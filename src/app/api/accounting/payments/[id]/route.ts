// src/app/api/accounting/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { PaymentDetailRecord } from '@/types/accounting.types';

const FULL_SELECT = {
  id: true,
  paymentNumber: true,
  clientId: true,
  client: { select: { id: true, businessName: true, clientNo: true } },
  amount: true,
  unusedAmount: true,
  paymentDate: true,
  method: true,
  referenceNumber: true,
  proofOfPaymentUrl: true,
  notes: true,
  recordedBy: { select: { id: true, name: true } },
  allocations: {
    select: {
      id: true,
      invoiceId: true,
      amountApplied: true,
      createdAt: true,
      invoice: {
        select: {
          invoiceNumber: true,
          totalAmount: true,
          dueDate: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  historyLogs: {
    select: {
      id: true,
      changeType: true,
      oldValue: true,
      newValue: true,
      actorId: true,
      actor: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
  createdAt: true,
  updatedAt: true,
} as const;

function serialize(p: unknown): PaymentDetailRecord {
  const pay = p as Record<string, unknown>;
  return {
    id: pay.id as string,
    paymentNumber: pay.paymentNumber as string,
    clientId: pay.clientId as number | null,
    client: pay.client as PaymentDetailRecord['client'],
    amount: Number(pay.amount),
    unusedAmount: Number(pay.unusedAmount),
    paymentDate: (pay.paymentDate as Date).toISOString(),
    method: pay.method as PaymentDetailRecord['method'],
    referenceNumber: pay.referenceNumber as string | null,
    proofOfPaymentUrl: pay.proofOfPaymentUrl as string | null,
    notes: pay.notes as string | null,
    recordedBy: pay.recordedBy as PaymentDetailRecord['recordedBy'],
    allocations: ((pay.allocations as Record<string, unknown>[]) ?? []).map((a) => {
      const inv = a.invoice as Record<string, unknown>;
      return {
        id: a.id as string,
        invoiceId: a.invoiceId as string,
        invoiceNumber: inv.invoiceNumber as string,
        invoiceTotalAmount: Number(inv.totalAmount),
        invoiceStatus: inv.status as import('@/types/accounting.types').InvoiceStatus,
        amountApplied: Number(a.amountApplied),
        createdAt: (a.createdAt as Date).toISOString(),
      };
    }),
    historyLogs: ((pay.historyLogs as Record<string, unknown>[]) ?? []).map((h) => ({
      id: h.id as string,
      changeType: h.changeType as import('@/types/accounting.types').PaymentChangeType,
      oldValue: h.oldValue as string | null,
      newValue: h.newValue as string | null,
      actorId: h.actorId as string | null,
      actor: h.actor as { id: string; name: string } | null,
      createdAt: (h.createdAt as Date).toISOString(),
    })),
    createdAt: (pay.createdAt as Date).toISOString(),
    updatedAt: (pay.updatedAt as Date).toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { id }, select: FULL_SELECT });
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  return NextResponse.json({ data: serialize(payment) });
}
