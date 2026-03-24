// src/app/api/accounting/invoices/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { addInvoiceHistory } from '@/lib/invoice-history';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const source = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!source) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const newInvoice = await prisma.$transaction(async (tx) => {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const latest = await tx.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextSeq = 1;
    if (latest) {
      const parts = latest.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    return tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: source.clientId,
        leadId: source.leadId,
        dueDate: source.dueDate,
        notes: source.notes,
        terms: source.terms,
        subTotal: source.subTotal,
        taxAmount: source.taxAmount,
        discountAmount: source.discountAmount,
        totalAmount: source.totalAmount,
        balanceDue: source.totalAmount,
        status: 'DRAFT',
        items: {
          create: source.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            remarks: it.remarks ?? null,
          })),
        },
      },
      select: { id: true, invoiceNumber: true },
    });
  });

  void addInvoiceHistory({
    invoiceId: newInvoice.id,
    actorId: session.user.id,
    changeType: 'INVOICE_CREATED',
    newValue: `Duplicated from ${source.invoiceNumber} → ${newInvoice.invoiceNumber}`,
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'Invoice',
    entityId: newInvoice.id,
    description: `Duplicated invoice ${source.invoiceNumber} as ${newInvoice.invoiceNumber}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: newInvoice }, { status: 201 });
}
