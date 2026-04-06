// src/app/api/accounting/invoices/[id]/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { addInvoiceHistory } from '@/lib/invoice-history';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'E_WALLET', 'CREDIT_CARD']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      allocations: { select: { amountApplied: true } },
      lead: { select: { convertedClientId: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.status === 'PAID' || invoice.status === 'VOID') {
    return NextResponse.json(
      { error: 'Cannot add payment to a PAID or VOID invoice.' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;
  // Resolve client: direct clientId, or the converted client if this is a lead invoice
  const effectiveClientId = invoice.clientId ?? invoice.lead?.convertedClientId ?? null;
  const currentBalanceDue = Number(invoice.balanceDue);
  const amountApplied = Math.min(data.amount, currentBalanceDue);
  const unusedAmount = Math.max(0, data.amount - currentBalanceDue);
  const totalPaid = invoice.allocations.reduce((s, a) => s + Number(a.amountApplied), 0) + amountApplied;
  const totalAmount = Number(invoice.totalAmount);
  const newBalanceDue = Math.max(0, totalAmount - totalPaid);
  const newStatus = newBalanceDue === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : invoice.status;

  const payment = await prisma.$transaction(async (tx) => {
    // Generate payment number atomically (PAY-YYYY-XXXX)
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;
    const latest = await tx.payment.findFirst({
      where: { paymentNumber: { startsWith: prefix } },
      orderBy: { paymentNumber: 'desc' },
      select: { paymentNumber: true },
    });
    let nextSeq = 1;
    if (latest) {
      const parts = latest.paymentNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    const paymentNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    const p = await tx.payment.create({
      data: {
        paymentNumber,
        clientId: effectiveClientId,
        recordedById: session.user.id,
        amount: data.amount,
        unusedAmount,
        paymentDate: new Date(data.paymentDate),
        method: data.method,
        referenceNumber: data.referenceNumber ?? null,
        notes: data.notes ?? null,
        allocations: {
          create: { invoiceId: id, amountApplied },
        },
      },
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        unusedAmount: true,
        paymentDate: true,
        method: true,
        referenceNumber: true,
        notes: true,
        createdAt: true,
      },
    });

    await tx.invoice.update({
      where: { id },
      data: { balanceDue: newBalanceDue, status: newStatus },
    });

    return p;
  });

  void addInvoiceHistory({
    invoiceId: id,
    actorId: session.user.id,
    changeType: 'PAYMENT_ADDED',
    newValue: `${data.method} ₱${data.amount.toLocaleString('en-PH')}`,
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'Invoice',
    entityId: id,
    description: `Recorded payment of ₱${data.amount.toLocaleString('en-PH')} on invoice ${invoice.invoiceNumber}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      ...payment,
      amount: Number(payment.amount),
      unusedAmount: Number(payment.unusedAmount),
      paymentDate: payment.paymentDate.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    },
    meta: { newStatus, newBalanceDue },
  });
}
