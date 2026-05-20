// src/app/api/accounting/petty-cash/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notify } from '@/lib/notification';

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function createClientFundDebit(
  tx: PrismaTx,
  pettyCashId: string,
  clientId: number,
  debitAmount: number,
  processedById: string,
): Promise<void> {
  const settings = await tx.accountingSetting.findFirst({
    select: { cftNumberPrefix: true },
  });
  const cftPfx = settings?.cftNumberPrefix ?? 'CFT';
  const year = new Date().getFullYear();
  const cftPrefix = `${cftPfx}-${year}-`;

  const latestCft = await tx.clientFundTransaction.findFirst({
    where: { transactionNo: { startsWith: cftPrefix } },
    orderBy: { transactionNo: 'desc' },
    select: { transactionNo: true },
  });
  let nextSeq = 1;
  if (latestCft) {
    const parts = latestCft.transactionNo.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]!, 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }
  const transactionNo = `${cftPrefix}${String(nextSeq).padStart(4, '0')}`;

  const latestTx = await tx.clientFundTransaction.findFirst({
    where: { clientId },
    orderBy: { date: 'desc' },
    select: { runningBalance: true },
  });
  const currentBalance = latestTx ? Number(latestTx.runningBalance) : 0;
  const newBalance = currentBalance - debitAmount;

  await tx.clientFundTransaction.create({
    data: {
      transactionNo,
      clientId,
      type: 'PETTY_CASH_DEBIT',
      pettyCashId,
      amount: debitAmount,
      runningBalance: newBalance,
      processedById,
    },
  });
}

// ── POST /api/accounting/petty-cash/[id]/approve ──────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const pcf = await prisma.pettyCash.findUnique({
    where: { id },
    select: {
      id: true,
      pcfNo: true,
      status: true,
      custodianId: true,
      accountingManagerId: true,
      requestedById: true,
      totalRequestedAmount: true,
      totalClientFundUsed: true,
      clientId: true,
    },
  });

  if (!pcf) {
    return NextResponse.json({ error: 'Petty cash request not found' }, { status: 404 });
  }

  const userId = session.user.id;
  const role = session.user.role as string;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const total = Number(pcf.totalRequestedAmount);
  const clientFundTotal = Number(pcf.totalClientFundUsed);
  const now = new Date();

  // ── Custodian approval stage (PENDING → APPROVED or DISBURSED) ──────────────
  if (pcf.status === 'PENDING') {
    const isCustodian = pcf.custodianId === userId;
    if (!isSuperAdmin && !isCustodian) {
      return NextResponse.json(
        { error: 'Only the custodian or a super admin can approve this request.' },
        { status: 403 },
      );
    }

    // < ₱500 → skip straight to DISBURSED; ≥ ₱500 → APPROVED (needs manager)
    const newStatus = total < 500 ? 'DISBURSED' : 'APPROVED';

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.pettyCash.update({
        where: { id },
        data: {
          status: newStatus,
          custodianId: pcf.custodianId ?? userId,
          custodianApprovedAt: now,
        },
        select: { id: true, status: true, pcfNo: true, accountingManagerId: true },
      });

      if (newStatus === 'DISBURSED' && clientFundTotal > 0) {
        await createClientFundDebit(tx, id, pcf.clientId, clientFundTotal, userId);
      }

      return result;
    });

    void logActivity({
      userId,
      action: 'APPROVED',
      entity: 'PettyCash',
      entityId: id,
      description:
        newStatus === 'DISBURSED'
          ? `Approved & disbursed petty cash request ${pcf.pcfNo}`
          : `Custodian approved petty cash request ${pcf.pcfNo}`,
      ...getRequestMeta(request),
    });

    if (newStatus === 'APPROVED' && updated.accountingManagerId) {
      // Notify accounting manager that custodian has approved
      void notify({
        recipientId: updated.accountingManagerId,
        actorId: userId,
        type: 'ACTION_REQUIRED',
        title: 'Petty cash request ready for disbursement',
        message: `${pcf.pcfNo} has been custodian-approved. Please review and disburse.`,
        entity: 'PettyCash',
        entityId: id,
        actionUrl: '/dashboard/petty-cash',
      });
    } else if (newStatus === 'DISBURSED') {
      // Notify requester that it was approved and disbursed
      void notify({
        recipientId: pcf.requestedById,
        actorId: userId,
        type: 'SUCCESS',
        title: 'Petty cash request disbursed',
        message: `Your request ${pcf.pcfNo} has been approved and disbursed.`,
        entity: 'PettyCash',
        entityId: id,
        actionUrl: '/dashboard/petty-cash',
      });
    }

    return NextResponse.json({ data: { status: updated.status } });
  }

  // ── Accounting manager approval stage (APPROVED → DISBURSED) ────────────────
  if (pcf.status === 'APPROVED') {
    const isManager = pcf.accountingManagerId === userId;
    if (!isSuperAdmin && !isManager) {
      return NextResponse.json(
        { error: 'Only the accounting manager or a super admin can disburse this request.' },
        { status: 403 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.pettyCash.update({
        where: { id },
        data: {
          status: 'DISBURSED',
          accountingManagerId: pcf.accountingManagerId ?? userId,
          accountingManagerApprovedAt: now,
        },
        select: { id: true, status: true, pcfNo: true },
      });

      if (clientFundTotal > 0) {
        await createClientFundDebit(tx, id, pcf.clientId, clientFundTotal, userId);
      }

      return result;
    });

    void logActivity({
      userId,
      action: 'APPROVED',
      entity: 'PettyCash',
      entityId: id,
      description: `Accounting manager disbursed petty cash request ${pcf.pcfNo}`,
      ...getRequestMeta(request),
    });

    // Notify requester
    void notify({
      recipientId: pcf.requestedById,
      actorId: userId,
      type: 'SUCCESS',
      title: 'Petty cash request disbursed',
      message: `Your request ${pcf.pcfNo} has been approved and disbursed.`,
      entity: 'PettyCash',
      entityId: id,
      actionUrl: '/dashboard/petty-cash',
    });

    return NextResponse.json({ data: { status: updated.status } });
  }

  return NextResponse.json(
    { error: 'This request cannot be approved in its current status.' },
    { status: 400 },
  );
}
