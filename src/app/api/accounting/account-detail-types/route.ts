// src/app/api/accounting/account-detail-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  accountTypeId: z.number().int().positive('Account type is required'),
});

// ─── GET /api/accounting/account-detail-types ────────────────────────────────

export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const detailTypes = await prisma.accountDetailType.findMany({
    where: { isActive: true },
    orderBy: [{ accountTypeId: 'asc' }, { name: 'asc' }],
    include: {
      accountType: { select: { id: true, name: true, group: true } },
      _count: { select: { accounts: true } },
    },
  });

  return NextResponse.json({ data: detailTypes });
}

// ─── POST /api/accounting/account-detail-types ───────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const { name, accountTypeId } = parsed.data;

  const accountType = await prisma.accountType.findUnique({ where: { id: accountTypeId, isActive: true } });
  if (!accountType) {
    return NextResponse.json({ error: 'Account type not found.' }, { status: 404 });
  }

  const existing = await prisma.accountDetailType.findUnique({
    where: { accountTypeId_name: { accountTypeId, name } },
  });
  if (existing) {
    return NextResponse.json({ error: `Detail type "${name}" already exists under "${accountType.name}".` }, { status: 409 });
  }

  const detailType = await prisma.accountDetailType.create({
    data: { name, accountTypeId },
    include: {
      accountType: { select: { id: true, name: true, group: true } },
      _count: { select: { accounts: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'AccountDetailType',
    entityId: String(detailType.id),
    description: `Created detail type: ${name} under ${accountType.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: detailType }, { status: 201 });
}
