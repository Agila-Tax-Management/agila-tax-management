// src/app/api/accounting/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { addInvoiceHistory } from '@/lib/invoice-history';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

// ── Full select for single invoice ───────────────────────────────
const FULL_SELECT = {
  id: true,
  invoiceNumber: true,
  status: true,
  issueDate: true,
  dueDate: true,
  subTotal: true,
  taxAmount: true,
  discountAmount: true,
  totalAmount: true,
  balanceDue: true,
  notes: true,
  terms: true,
  clientId: true,
  client: { select: { id: true, businessName: true, clientNo: true, businessEntity: true } },
  leadId: true,
  lead: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      businessName: true,
      businessType: true,
    },
  },
  items: {
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPrice: true,
      total: true,
      remarks: true,
    },
    orderBy: { id: 'asc' as const },
  },
  allocations: {
    select: {
      id: true,
      amountApplied: true,
      createdAt: true,
      payment: {
        select: {
          id: true,
          paymentDate: true,
          method: true,
          referenceNumber: true,
          proofOfPaymentUrl: true,
          notes: true,
          unusedAmount: true,
          recordedBy: { select: { id: true, name: true } },
          createdAt: true,
        },
      },
    },
    orderBy: { payment: { paymentDate: 'desc' as const } },
  },
  historyLogs: {
    select: {
      id: true,
      actorId: true,
      actor: { select: { id: true, name: true } },
      changeType: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
  createdAt: true,
  updatedAt: true,
} as const;

function serialize(inv: unknown) {
  const i = inv as Record<string, unknown>;
  return {
    ...i,
    subTotal: Number(i.subTotal),
    taxAmount: Number(i.taxAmount),
    discountAmount: Number(i.discountAmount),
    totalAmount: Number(i.totalAmount),
    balanceDue: Number(i.balanceDue),
    issueDate: (i.issueDate as Date).toISOString(),
    dueDate: (i.dueDate as Date).toISOString(),
    createdAt: (i.createdAt as Date).toISOString(),
    updatedAt: (i.updatedAt as Date).toISOString(),
    items: ((i.items as Record<string, unknown>[]) ?? []).map((it) => ({
      ...it,
      unitPrice: Number(it.unitPrice),
      total: Number(it.total),
    })),
    payments: ((i.allocations as Record<string, unknown>[]) ?? []).map((alloc) => {
      const p = alloc.payment as Record<string, unknown>;
      return {
        id: p.id,
        amount: Number(alloc.amountApplied),
        unusedAmount: Number(p.unusedAmount ?? 0),
        paymentDate: (p.paymentDate as Date).toISOString(),
        method: p.method,
        referenceNumber: p.referenceNumber ?? null,
        proofOfPaymentUrl: p.proofOfPaymentUrl ?? null,
        notes: p.notes ?? null,
        recordedBy: p.recordedBy ?? null,
        createdAt: (p.createdAt as Date).toISOString(),
      };
    }),
    historyLogs: ((i.historyLogs as Record<string, unknown>[]) ?? []).map((h) => ({
      ...h,
      createdAt: (h.createdAt as Date).toISOString(),
    })),
  };
}

// ── GET /api/accounting/invoices/[id] ────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: FULL_SELECT });
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  return NextResponse.json({ data: serialize(invoice) });
}

// ── PUT /api/accounting/invoices/[id] ───────────────────────────
const updateItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
  remarks: z.string().optional().default(''),
});

const updateSchema = z.object({
  dueDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID']).optional(),
  items: z.array(updateItemSchema).min(1).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { allocations: { select: { amountApplied: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const totalPaid = existing.allocations.reduce((s, a) => s + Number(a.amountApplied), 0);
  const subTotal = data.items
    ? data.items.reduce((s, it) => s + it.total, 0)
    : Number(existing.subTotal);
  const totalAmount = subTotal;
  const balanceDue = Math.max(0, totalAmount - totalPaid);
  const oldStatus = existing.status;

  const final = await prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.createMany({
        data: data.items.map((it) => ({
          invoiceId: id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
          remarks: it.remarks || null,
        })),
      });
    }

    await tx.invoice.update({
      where: { id },
      data: {
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.terms !== undefined ? { terms: data.terms } : {}),
        ...(data.status ? { status: data.status } : {}),
        subTotal,
        totalAmount,
        balanceDue,
      },
    });

    return tx.invoice.findUnique({ where: { id }, select: FULL_SELECT });
  });

  const changeType =
    data.status && data.status !== oldStatus ? 'STATUS_CHANGED' : 'INVOICE_UPDATED';

  void addInvoiceHistory({
    invoiceId: id,
    actorId: session.user.id,
    changeType,
    oldValue: data.status ? String(oldStatus) : undefined,
    newValue: data.status ? data.status : undefined,
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'Invoice',
    entityId: id,
    description: `Updated invoice ${existing.invoiceNumber}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: serialize(final) });
}

// ── DELETE /api/accounting/invoices/[id] ─────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { invoiceNumber: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  if (existing.status !== 'DRAFT' && existing.status !== 'VOID') {
    return NextResponse.json(
      { error: 'Only DRAFT or VOID invoices can be deleted. Please void the invoice first.' },
      { status: 400 },
    );
  }

  await prisma.invoice.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'Invoice',
    entityId: id,
    description: `Deleted invoice ${existing.invoiceNumber}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}
