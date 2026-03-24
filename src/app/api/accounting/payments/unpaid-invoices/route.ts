// src/app/api/accounting/payments/unpaid-invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { UnpaidInvoiceOption } from '@/types/accounting.types';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientIdRaw = request.nextUrl.searchParams.get('clientId');
  const clientId = clientIdRaw ? parseInt(clientIdRaw, 10) : NaN;
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      clientId,
      status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
    select: {
      id: true,
      invoiceNumber: true,
      issueDate: true,
      dueDate: true,
      totalAmount: true,
      balanceDue: true,
      status: true,
    },
    orderBy: { dueDate: 'asc' }, // oldest first — natural FIFO order
  });

  const data: UnpaidInvoiceOption[] = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    issueDate: inv.issueDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    totalAmount: Number(inv.totalAmount),
    balanceDue: Number(inv.balanceDue),
    status: inv.status as import('@/types/accounting.types').InvoiceStatus,
  }));

  return NextResponse.json({ data });
}
