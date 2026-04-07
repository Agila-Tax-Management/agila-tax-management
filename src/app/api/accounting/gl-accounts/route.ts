// src/app/api/accounting/gl-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  clientId: z.number().int().positive().optional(),
  accountCode: z.string().min(1, 'Account code is required').max(20),
  name: z.string().min(1, 'Account name is required').max(100),
  description: z.string().max(500).optional(),
  accountTypeId: z.number().int().positive('Account type is required'),
  accountDetailTypeId: z.number().int().positive('Account detail type is required'),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isBankAccount: z.boolean().optional().default(false),
  openingBalance: z.number().optional().nullable(),
});

// ─── GET /api/accounting/gl-accounts ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const clientId = searchParams.get('clientId');
  const isActive = searchParams.get('isActive');
  const groupFilter = searchParams.get('group');

  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = parseInt(clientId, 10);
  if (isActive === 'true') where.isActive = true;
  if (isActive === 'false') where.isActive = false;
  if (groupFilter) where.accountType = { group: groupFilter };
  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { accountCode: { contains: search, mode: 'insensitive' } },
      { accountDetailType: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const accounts = await prisma.glAccount.findMany({
    where,
    orderBy: [{ accountType: { id: 'asc' } }, { accountCode: 'asc' }],
    include: INCLUDE,
  });

  return NextResponse.json({ data: accounts.map(serializeAccount) });
}

// ─── POST /api/accounting/gl-accounts ────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  let resolvedClientId = parsed.data.clientId;
  if (!resolvedClientId) {
    const employment = await prisma.employeeEmployment.findFirst({
      where: { employee: { userId: session.user.id }, employmentStatus: 'ACTIVE' },
      select: { clientId: true },
    });
    if (!employment) {
      return NextResponse.json({ error: 'Could not determine your client context.' }, { status: 422 });
    }
    resolvedClientId = employment.clientId;
  }
  const { accountCode, name, description, accountTypeId, accountDetailTypeId, parentId, isActive, isBankAccount, openingBalance } = parsed.data;

  // Validate uniqueness: accountCode must be unique per client
  const existing = await prisma.glAccount.findUnique({
    where: { clientId_accountCode: { clientId: resolvedClientId, accountCode } },
  });
  if (existing) {
    return NextResponse.json({ error: `Account code "${accountCode}" already exists for this client.` }, { status: 409 });
  }

  // Validate accountType + accountDetailType exist and belong together
  const detailType = await prisma.accountDetailType.findFirst({
    where: { id: accountDetailTypeId, accountTypeId },
  });
  if (!detailType) {
    return NextResponse.json({ error: 'Invalid account type and detail type combination.' }, { status: 422 });
  }

  const account = await prisma.glAccount.create({
    data: {
      clientId: resolvedClientId,
      accountCode,
      name,
      description,
      accountTypeId,
      accountDetailTypeId,
      parentId: parentId ?? null,
      isActive: isActive ?? true,
      isBankAccount: isBankAccount ?? false,
      openingBalance: openingBalance ?? null,
    },
    include: INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'GlAccount',
    entityId: account.id,
    description: `Created GL account ${account.accountCode} — ${account.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: serializeAccount(account) }, { status: 201 });
}
