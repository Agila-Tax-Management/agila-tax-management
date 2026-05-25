// src/app/api/accounting/petty-cash/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { serializePcf } from '../route';

// ── Full select (mirrors parent route) ───────────────────────────────────────
const FULL_SELECT = {
  id: true,
  pcfNo: true,
  date: true,
  purpose: true,
  status: true,
  totalRequestedAmount: true,
  totalEmployeeExpenses: true,
  totalClientFundUsed: true,
  clientFundBalanceSnapshot: true,
  rejectionReason: true,
  custodianNotes: true,
  managerNotes: true,
  custodianApprovedAt: true,
  accountingManagerApprovedAt: true,
  clientId: true,
  client: { select: { id: true, businessName: true, clientNo: true } },
  requestedById: true,
  requestedBy: { select: { id: true, name: true } },
  custodianId: true,
  custodian: { select: { id: true, name: true } },
  accountingManagerId: true,
  accountingManager: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      category: true,
      clientId: true,
      client: { select: { id: true, businessName: true, clientNo: true } },
      clientFundBalanceSnapshot: true,
      description: true,
      amount: true,
      remarks: true,
    },
    orderBy: { id: 'asc' as const },
  },
  createdAt: true,
  updatedAt: true,
} as const;

// ── Schemas ───────────────────────────────────────────────────────────────────
const updateItemSchema = z.object({
  category: z.enum(['EMPLOYEE_EXPENSE', 'CLIENT_FUND']),
  clientId: z.number().int().positive().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  remarks: z.string().optional(),
}).refine(
  (it) => it.category !== 'CLIENT_FUND' || it.clientId != null,
  { message: 'Client is required for CLIENT_FUND items' },
);

const updateSchema = z.object({
  purpose: z.string().min(1).optional(),
  items: z.array(updateItemSchema).min(1).optional(),
});

// ── GET /api/accounting/petty-cash/[id] ───────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const pcf = await prisma.pettyCash.findUnique({ where: { id }, select: FULL_SELECT });
  if (!pcf) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: serializePcf(pcf) });
}

// ── PUT /api/accounting/petty-cash/[id] ───────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.pettyCash.findUnique({
    where: { id },
    select: { id: true, pcfNo: true, status: true, requestedById: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const role = session.user.role as string;
  const isOwner = existing.requestedById === session.user.id;
  const isSuperAdmin = role === 'SUPER_ADMIN';

  if (!isOwner && !isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!['DRAFT', 'PENDING'].includes(existing.status)) {
    return NextResponse.json(
      { error: 'Cannot edit a request that has already been approved.' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;

  let totalEmployee = 0;
  let totalClient = 0;
  if (data.items) {
    totalEmployee = data.items
      .filter((i) => i.category === 'EMPLOYEE_EXPENSE')
      .reduce((s, i) => s + i.amount, 0);
    totalClient = data.items
      .filter((i) => i.category === 'CLIENT_FUND')
      .reduce((s, i) => s + i.amount, 0);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.pettyCashItem.deleteMany({ where: { pettyCashId: id } });
      await tx.pettyCashItem.createMany({
        data: data.items.map((it) => ({
          pettyCashId: id,
          category: it.category,
          clientId: it.clientId ?? null,
          description: it.description,
          amount: it.amount,
          remarks: it.remarks ?? null,
        })),
      });
    }

    return tx.pettyCash.update({
      where: { id },
      data: {
        ...(data.purpose !== undefined ? { purpose: data.purpose } : {}),
        ...(data.items
          ? {
              totalRequestedAmount: totalEmployee + totalClient,
              totalEmployeeExpenses: totalEmployee,
              totalClientFundUsed: totalClient,
            }
          : {}),
      },
      select: FULL_SELECT,
    });
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'PettyCash',
    entityId: id,
    description: `Updated petty cash request ${existing.pcfNo}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: serializePcf(updated) });
}

// ── DELETE /api/accounting/petty-cash/[id] ────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.pettyCash.findUnique({
    where: { id },
    select: { id: true, pcfNo: true, status: true, requestedById: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const role = session.user.role as string;
  const userId = session.user.id;
  const isOwner = existing.requestedById === userId;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  // Owners can delete their own DRAFT/PENDING requests.
  // Admins can also delete VOID records (void-first workflow from the portal).
  const canDelete =
    (isOwner && ['DRAFT', 'PENDING'].includes(existing.status)) ||
    (isAdmin && ['DRAFT', 'PENDING', 'VOID'].includes(existing.status));

  if (!canDelete) {
    const isForbidden = !isOwner && !isAdmin;
    return NextResponse.json(
      {
        error: isForbidden
          ? 'Forbidden'
          : 'Only VOID, DRAFT, or PENDING requests can be deleted.',
      },
      { status: isForbidden ? 403 : 400 },
    );
  }

  await prisma.pettyCash.delete({ where: { id } });

  void logActivity({
    userId,
    action: 'DELETED',
    entity: 'PettyCash',
    entityId: id,
    description: `Deleted petty cash request ${existing.pcfNo}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id } });
}
