// src/app/api/accounting/client-funds/[clientId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * GET /api/accounting/client-funds/[clientId]
 * Returns all ClientFundTransactions for a specific client, ordered by date DESC,
 * along with the client's current balance and basic info.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId: rawId } = await params;
  const clientId = parseInt(rawId, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const [client, transactions] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true, clientNo: true },
    }),
    prisma.clientFundTransaction.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        transactionNo: true,
        date: true,
        type: true,
        invoiceId: true,
        invoice: { select: { id: true, invoiceNumber: true } },
        paymentId: true,
        payment: { select: { id: true, paymentNumber: true } },
        pettyCashId: true,
        processedBy: { select: { id: true, name: true } },
        amount: true,
        runningBalance: true,
        notes: true,
      },
    }),
  ]);

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const currentBalance =
    transactions.length > 0 ? Number(transactions[0].runningBalance) : 0;

  return NextResponse.json({
    data: {
      clientId: client.id,
      clientNo: client.clientNo,
      businessName: client.businessName,
      currentBalance,
      transactions: transactions.map((t) => ({
        id: t.id,
        transactionNo: t.transactionNo,
        date: t.date.toISOString(),
        type: t.type,
        invoiceId: t.invoiceId,
        invoice: t.invoice,
        paymentId: t.paymentId,
        payment: t.payment,
        pettyCashId: t.pettyCashId,
        processedBy: t.processedBy,
        amount: Number(t.amount),
        runningBalance: Number(t.runningBalance),
        notes: t.notes,
      })),
    },
  });
}
