// src/app/api/accounting/gl-accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

function serializeAccount(a: unknown) {
  const account = a as Record<string, unknown>;
  return {
    id: account.id,
    accountCode: account.accountCode,
    name: account.name,
    description: account.description ?? null,
    accountTypeId: account.accountTypeId,
    accountType: account.accountType,
    accountDetailTypeId: account.accountDetailTypeId,
    accountDetailType: account.accountDetailType,
    parentId: account.parentId ?? null,
    clientId: account.clientId,
    isActive: account.isActive,
    isBankAccount: account.isBankAccount,
    openingBalance: account.openingBalance != null ? Number(account.openingBalance) : null,
    createdAt: (account.createdAt as Date).toISOString(),
    updatedAt: (account.updatedAt as Date).toISOString(),
  };
}

const INCLUDE = {
  accountType: { select: { id: true, name: true, group: true, normalBalance: true } },
  accountDetailType: { select: { id: true, name: true } },
  parent: { select: { id: true, accountCode: true, name: true } },
} as const;

const updateSchema = z.object({
  accountCode: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  accountTypeId: z.number().int().positive().optional(),
  accountDetailTypeId: z.number().int().positive().optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isBankAccount: z.boolean().optional(),
  openingBalance: z.number().optional().nullable(),
});

// ─── GET /api/accounting/gl-accounts/[id] ───────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const account = await prisma.glAccount.findUnique({ where: { id }, include: INCLUDE });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  return NextResponse.json({ data: serializeAccount(account) });
}

// ─── PUT /api/accounting/gl-accounts/[id] ───────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.glAccount.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const data = parsed.data;

  // If updating accountDetailTypeId, validate it belongs to the (new or existing) accountTypeId
  const resolvedTypeId = data.accountTypeId ?? existing.accountTypeId;
  if (data.accountDetailTypeId) {
    const detailType = await prisma.accountDetailType.findFirst({
      where: { id: data.accountDetailTypeId, accountTypeId: resolvedTypeId },
    });
    if (!detailType) {
      return NextResponse.json({ error: 'Invalid account type and detail type combination.' }, { status: 422 });
    }
  }

  // validate account code uniqueness if changing
  if (data.accountCode && data.accountCode !== existing.accountCode) {
    const duplicate = await prisma.glAccount.findUnique({
      where: { clientId_accountCode: { clientId: existing.clientId, accountCode: data.accountCode } },
    });
    if (duplicate) {
      return NextResponse.json({ error: `Account code "${data.accountCode}" already exists for this client.` }, { status: 409 });
    }
  }

  const updated = await prisma.glAccount.update({
    where: { id },
    data,
    include: INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'GlAccount',
    entityId: id,
    description: `Updated GL account ${updated.accountCode} — ${updated.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: serializeAccount(updated) });
}

// ─── DELETE /api/accounting/gl-accounts/[id] ────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.glAccount.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  // Check if account has journal lines attached — Restrict prevents delete at DB level,
  // but we return a clean error message instead of a 500.
  const lineCount = await prisma.journalLine.count({ where: { glAccountId: id } });
  if (lineCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete "${existing.name}" — it has ${lineCount} journal line(s) attached.` },
      { status: 409 },
    );
  }

  await prisma.glAccount.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'GlAccount',
    entityId: id,
    description: `Deleted GL account ${existing.accountCode} — ${existing.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id } });
}
