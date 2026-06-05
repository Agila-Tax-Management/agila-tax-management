// src/app/api/accounting/cheque-monitoring/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const editChequeSchema = z.object({
  chequeNo: z.string().min(1, 'Cheque number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  chequeDate: z.string().min(1, 'Cheque date is required'),
  amount: z.number().positive('Amount must be positive'),
  invoiceId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(['FOR_CLEARING', 'CLEARED', 'BOUNCED']),
  notes: z.string().optional().nullable(),
});

/**
 * PATCH /api/accounting/cheque-monitoring/[id]
 * Updates the status of a cheque.
 * - CLEARED: creates a ClientFundTransaction (CHEQUE_CLEARING) and credits client funds
 * - BOUNCED: marks the cheque as bounced (no fund movement)
 * - FOR_CLEARING: resets to pending (only allowed from BOUNCED)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues ?? 'Validation error' }, { status: 400 });
  }

  const { status: newStatus, notes } = parsed.data;

  // Load existing cheque
  const existing = await prisma.chequeMonitoring.findUnique({
    where: { id },
    include: { client: { select: { id: true, businessName: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Cheque not found' }, { status: 404 });
  }

  // Validate transitions
  if (existing.status === 'CLEARED') {
    return NextResponse.json({ error: 'Cleared cheques cannot be changed' }, { status: 409 });
  }
  if (existing.status === newStatus) {
    return NextResponse.json({ error: `Cheque is already ${newStatus.toLowerCase().replace('_', ' ')}` }, { status: 409 });
  }

  let updatedCheque: Awaited<ReturnType<typeof prisma.chequeMonitoring.update>>;

  if (newStatus === 'CLEARED') {
    // Generate sequential transaction number inside a transaction
    updatedCheque = await prisma.$transaction(async (tx) => {
      // Generate transaction number
      const year = new Date().getFullYear();
      const prefix = `CFT-${year}-`;
      const latest = await tx.clientFundTransaction.findFirst({
        where: { transactionNo: { startsWith: prefix } },
        orderBy: { transactionNo: 'desc' },
        select: { transactionNo: true },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.transactionNo.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const transactionNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;

      // Get current balance
      const latestTxn = await tx.clientFundTransaction.findFirst({
        where: { clientId: existing.clientId },
        orderBy: { date: 'desc' },
        select: { runningBalance: true },
      });
      const currentBalance = latestTxn ? Number(latestTxn.runningBalance) : 0;
      const newBalance = currentBalance + Number(existing.amount);

      // Create the fund transaction
      const fundTxn = await tx.clientFundTransaction.create({
        data: {
          transactionNo,
          clientId: existing.clientId,
          type: 'CHEQUE_CLEARING',
          amount: existing.amount,
          runningBalance: newBalance,
          chequeMonitoringId: existing.id,
          processedById: session.user.id,
          notes: notes ?? `Cheque #${existing.chequeNo} cleared`,
        },
      });

      // Update cheque status
      return tx.chequeMonitoring.update({
        where: { id },
        data: {
          status: 'CLEARED',
          clearedAt: new Date(),
          processedById: session.user.id,
          notes: notes !== undefined ? notes : existing.notes,
        },
        include: {
          client: { select: { id: true, businessName: true, clientNo: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
          payment: { select: { id: true, paymentNumber: true } },
          receivedBy: { select: { id: true, name: true } },
          processedBy: { select: { id: true, name: true } },
        },
      });
    });

    void logActivity({
      userId: session.user.id,
      action: 'STATUS_CHANGE',
      entity: 'ChequeMonitoring',
      entityId: existing.id,
      description: `Cleared cheque #${existing.chequeNo} (${existing.client.businessName}) — ₱${Number(existing.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })} credited to client funds`,
      ...getRequestMeta(request),
    });
  } else {
    // BOUNCED or FOR_CLEARING
    updatedCheque = await prisma.chequeMonitoring.update({
      where: { id },
      data: {
        status: newStatus,
        bouncedAt: newStatus === 'BOUNCED' ? new Date() : null,
        processedById: session.user.id,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        client: { select: { id: true, businessName: true, clientNo: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        payment: { select: { id: true, paymentNumber: true } },
        receivedBy: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true } },
      },
    });

    void logActivity({
      userId: session.user.id,
      action: 'STATUS_CHANGE',
      entity: 'ChequeMonitoring',
      entityId: existing.id,
      description: `Marked cheque #${existing.chequeNo} (${existing.client.businessName}) as ${newStatus.toLowerCase().replace('_', ' ')}`,
      ...getRequestMeta(request),
    });
  }

  return NextResponse.json({
    data: {
      id: updatedCheque.id,
      chequeNo: updatedCheque.chequeNo,
      bankName: updatedCheque.bankName,
      chequeDate: updatedCheque.chequeDate.toISOString(),
      clientId: updatedCheque.clientId,
      clientNo: (updatedCheque as typeof updatedCheque & { client: { clientNo: string | null } }).client?.clientNo ?? null,
      businessName: (updatedCheque as typeof updatedCheque & { client: { businessName: string } }).client?.businessName ?? '',
      amount: Number(updatedCheque.amount),
      invoiceId: updatedCheque.invoiceId,
      invoice: (updatedCheque as typeof updatedCheque & { invoice: unknown }).invoice ?? null,
      paymentId: updatedCheque.paymentId,
      payment: (updatedCheque as typeof updatedCheque & { payment: unknown }).payment ?? null,
      status: updatedCheque.status,
      clearedAt: updatedCheque.clearedAt?.toISOString() ?? null,
      bouncedAt: updatedCheque.bouncedAt?.toISOString() ?? null,
      receivedBy: (updatedCheque as typeof updatedCheque & { receivedBy: unknown }).receivedBy ?? null,
      processedBy: (updatedCheque as typeof updatedCheque & { processedBy: unknown }).processedBy ?? null,
      notes: updatedCheque.notes,
      createdAt: updatedCheque.createdAt.toISOString(),
    },
  });
}

/**
 * PUT /api/accounting/cheque-monitoring/[id]
 * Edits cheque details (chequeNo, bankName, chequeDate, amount, invoiceId, notes).
 * Only allowed when status is FOR_CLEARING or BOUNCED (not CLEARED).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = editChequeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues ?? 'Validation error' }, { status: 400 });
  }

  const existing = await prisma.chequeMonitoring.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Cheque not found' }, { status: 404 });
  if (existing.status === 'CLEARED') {
    return NextResponse.json({ error: 'Cleared cheques cannot be edited' }, { status: 409 });
  }

  const updated = await prisma.chequeMonitoring.update({
    where: { id },
    data: {
      chequeNo: parsed.data.chequeNo,
      bankName: parsed.data.bankName,
      chequeDate: new Date(parsed.data.chequeDate),
      amount: parsed.data.amount,
      invoiceId: parsed.data.invoiceId ?? null,
      notes: parsed.data.notes ?? null,
    },
    include: {
      client: { select: { id: true, businessName: true, clientNo: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
      payment: { select: { id: true, paymentNumber: true } },
      receivedBy: { select: { id: true, name: true } },
      processedBy: { select: { id: true, name: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'ChequeMonitoring',
    entityId: id,
    description: `Updated cheque #${updated.chequeNo} (${updated.client.businessName})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      chequeNo: updated.chequeNo,
      bankName: updated.bankName,
      chequeDate: updated.chequeDate.toISOString(),
      clientId: updated.clientId,
      clientNo: updated.client.clientNo,
      businessName: updated.client.businessName,
      amount: Number(updated.amount),
      invoiceId: updated.invoiceId,
      invoice: updated.invoice,
      paymentId: updated.paymentId,
      payment: updated.payment,
      status: updated.status,
      clearedAt: updated.clearedAt?.toISOString() ?? null,
      bouncedAt: updated.bouncedAt?.toISOString() ?? null,
      receivedBy: updated.receivedBy,
      processedBy: updated.processedBy,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

/**
 * DELETE /api/accounting/cheque-monitoring/[id]
 * Deletes a cheque record. Only allowed when status is FOR_CLEARING or BOUNCED.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.chequeMonitoring.findUnique({
    where: { id },
    include: { client: { select: { businessName: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Cheque not found' }, { status: 404 });
  if (existing.status === 'CLEARED') {
    return NextResponse.json({ error: 'Cleared cheques cannot be deleted' }, { status: 409 });
  }

  await prisma.chequeMonitoring.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'ChequeMonitoring',
    entityId: id,
    description: `Deleted cheque #${existing.chequeNo} (${existing.client.businessName})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id } });
}
