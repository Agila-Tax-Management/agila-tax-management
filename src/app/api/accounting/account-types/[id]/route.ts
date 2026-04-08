// src/app/api/accounting/account-types/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  group: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  normalBalance: z.enum(['DEBIT', 'CREDIT']).optional(),
});

// ─── PUT /api/accounting/account-types/[id] ──────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.accountType.findUnique({ where: { id: numId } });
  if (!existing) return NextResponse.json({ error: 'Account type not found' }, { status: 404 });

  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const duplicate = await prisma.accountType.findUnique({ where: { name: parsed.data.name } });
    if (duplicate) {
      return NextResponse.json({ error: `Account type "${parsed.data.name}" already exists.` }, { status: 409 });
    }
  }

  const updated = await prisma.accountType.update({
    where: { id: numId },
    data: parsed.data,
    include: { _count: { select: { detailTypes: true, accounts: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'AccountType',
    entityId: String(numId),
    description: `Updated account type: ${updated.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

// ─── DELETE /api/accounting/account-types/[id] ───────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.accountType.findUnique({
    where: { id: numId },
    include: { _count: { select: { accounts: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Account type not found' }, { status: 404 });

  // Block deletion if GL accounts are linked — prevents ledger destruction
  if (existing._count.accounts > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete "${existing.name}" — it has ${existing._count.accounts} GL account(s) linked. Deleting this will destroy ledger integrity.`,
      },
      { status: 409 },
    );
  }

  // Soft-delete: mark isActive=false instead of hard delete to preserve audit trail
  await prisma.accountType.update({ where: { id: numId }, data: { isActive: false } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'AccountType',
    entityId: String(numId),
    description: `Deleted account type: ${existing.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: numId } });
}
