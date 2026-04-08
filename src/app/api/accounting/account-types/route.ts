// src/app/api/accounting/account-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  group: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], {
    error: 'Invalid financial group',
  }),
  normalBalance: z.enum(['DEBIT', 'CREDIT'], {
    error: 'Invalid normal balance',
  }),
});

// ─── GET /api/accounting/account-types ───────────────────────────────────────

export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const types = await prisma.accountType.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    include: {
      _count: { select: { detailTypes: true, accounts: true } },
    },
  });

  return NextResponse.json({ data: types });
}

// ─── POST /api/accounting/account-types ──────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const { name, group, normalBalance } = parsed.data;

  const existing = await prisma.accountType.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: `Account type "${name}" already exists.` }, { status: 409 });
  }

  const type = await prisma.accountType.create({
    data: { name, group, normalBalance },
    include: { _count: { select: { detailTypes: true, accounts: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'AccountType',
    entityId: String(type.id),
    description: `Created account type: ${name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: type }, { status: 201 });
}
