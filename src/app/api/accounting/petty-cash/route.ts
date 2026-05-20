// src/app/api/accounting/petty-cash/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notify } from '@/lib/notification';
import type { PettyCashStatus } from '@/generated/prisma/client';

const VALID_STATUSES: readonly string[] = [
  'DRAFT', 'PENDING', 'APPROVED', 'DISBURSED', 'LIQUIDATED', 'REJECTED', 'VOID',
];

// ── Schemas ───────────────────────────────────────────────────────────────────
const itemSchema = z.object({
  category: z.enum(['EMPLOYEE_EXPENSE', 'CLIENT_FUND']),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  remarks: z.string().optional(),
});

const createSchema = z.object({
  clientId: z.number().int().positive(),
  purpose: z.string().min(1, 'Purpose is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  custodianId: z.string().optional(),
  accountingManagerId: z.string().optional(),
});

// ── Full select ───────────────────────────────────────────────────────────────
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
      description: true,
      amount: true,
      remarks: true,
    },
    orderBy: { id: 'asc' as const },
  },
  createdAt: true,
  updatedAt: true,
} as const;

export function serializePcf(pcf: unknown) {
  const p = pcf as Record<string, unknown>;
  return {
    ...p,
    totalRequestedAmount: Number(p.totalRequestedAmount),
    totalEmployeeExpenses: Number(p.totalEmployeeExpenses),
    totalClientFundUsed: Number(p.totalClientFundUsed),
    clientFundBalanceSnapshot:
      p.clientFundBalanceSnapshot != null ? Number(p.clientFundBalanceSnapshot) : null,
    date: (p.date as Date).toISOString(),
    custodianApprovedAt: p.custodianApprovedAt
      ? (p.custodianApprovedAt as Date).toISOString()
      : null,
    accountingManagerApprovedAt: p.accountingManagerApprovedAt
      ? (p.accountingManagerApprovedAt as Date).toISOString()
      : null,
    createdAt: (p.createdAt as Date).toISOString(),
    updatedAt: (p.updatedAt as Date).toISOString(),
    items: ((p.items as Record<string, unknown>[]) ?? []).map((it) => ({
      ...it,
      amount: Number(it.amount),
    })),
  };
}

// ── GET /api/accounting/petty-cash ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const role = session.user.role as string;

  const where =
    role === 'SUPER_ADMIN' || role === 'ADMIN'
      ? {}
      : {
          OR: [
            { requestedById: userId },
            { custodianId: userId },
            { accountingManagerId: userId },
          ],
        };

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const statusWhere =
    statusFilter && VALID_STATUSES.includes(statusFilter)
      ? { status: statusFilter as PettyCashStatus }
      : {};

  const records = await prisma.pettyCash.findMany({
    where: { ...where, ...statusWhere },
    select: FULL_SELECT,
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ data: records.map(serializePcf) });
}

// ── POST /api/accounting/petty-cash ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;

  // Fetch accounting settings for defaults
  const settings = await prisma.accountingSetting.findFirst();
  const custodianId = data.custodianId ?? settings?.defaultCustodianId ?? null;
  const accountingManagerId =
    data.accountingManagerId ?? settings?.defaultAccountingManagerId ?? null;
  const prefix = settings?.pcfNumberPrefix ?? 'PCF';

  // Compute totals
  const totalEmployee = data.items
    .filter((i) => i.category === 'EMPLOYEE_EXPENSE')
    .reduce((s, i) => s + i.amount, 0);
  const totalClient = data.items
    .filter((i) => i.category === 'CLIENT_FUND')
    .reduce((s, i) => s + i.amount, 0);
  const totalRequested = totalEmployee + totalClient;

  // Get client fund balance snapshot (only when CLIENT_FUND items exist)
  let clientFundSnapshot: number | null = null;
  if (totalClient > 0) {
    const latestTx = await prisma.clientFundTransaction.findFirst({
      where: { clientId: data.clientId },
      orderBy: { date: 'desc' },
      select: { runningBalance: true },
    });
    clientFundSnapshot = latestTx ? Number(latestTx.runningBalance) : 0;
  }

  const created = await prisma.$transaction(async (tx) => {
    const year = new Date().getFullYear();
    const pcfPrefix = `${prefix}-${year}-`;
    const latest = await tx.pettyCash.findFirst({
      where: { pcfNo: { startsWith: pcfPrefix } },
      orderBy: { pcfNo: 'desc' },
      select: { pcfNo: true },
    });
    let nextSeq = 1;
    if (latest) {
      const parts = latest.pcfNo.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]!, 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    const pcfNo = `${pcfPrefix}${String(nextSeq).padStart(4, '0')}`;

    return tx.pettyCash.create({
      data: {
        pcfNo,
        clientId: data.clientId,
        purpose: data.purpose,
        requestedById: session.user.id,
        custodianId,
        accountingManagerId,
        status: 'PENDING',
        totalRequestedAmount: totalRequested,
        totalEmployeeExpenses: totalEmployee,
        totalClientFundUsed: totalClient,
        clientFundBalanceSnapshot: clientFundSnapshot,
        items: {
          create: data.items.map((it) => ({
            category: it.category,
            description: it.description,
            amount: it.amount,
            remarks: it.remarks ?? null,
          })),
        },
      },
      select: FULL_SELECT,
    });
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'PettyCash',
    entityId: created.id,
    description: `Created petty cash request ${created.pcfNo}`,
    ...getRequestMeta(request),
  });

  // Notify custodian
  if (custodianId) {
    void notify({
      recipientId: custodianId,
      actorId: session.user.id,
      type: 'ACTION_REQUIRED',
      title: 'Petty cash request pending approval',
      message: `${session.user.name} submitted ${created.pcfNo} for ₱${totalRequested.toLocaleString('en-PH', { minimumFractionDigits: 2 })}. Please review and approve.`,
      entity: 'PettyCash',
      entityId: created.id,
      actionUrl: '/dashboard/petty-cash',
    });
  }

  return NextResponse.json({ data: serializePcf(created) }, { status: 201 });
}
