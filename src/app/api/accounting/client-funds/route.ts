// src/app/api/accounting/client-funds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * GET /api/accounting/client-funds
 * Returns a list of all clients that have at least one ClientFundTransaction,
 * including their current balance and last transaction metadata.
 */
export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all unique clientIds that have fund transactions
  const groups = await prisma.clientFundTransaction.groupBy({
    by: ['clientId'],
  });

  if (groups.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const clientIds = groups.map((g) => g.clientId);

  // Batch: latest transaction per client + client info
  const [latestTxns, clients] = await Promise.all([
    Promise.all(
      clientIds.map((cid) =>
        prisma.clientFundTransaction.findFirst({
          where: { clientId: cid },
          orderBy: { date: 'desc' },
          select: {
            clientId: true,
            type: true,
            date: true,
            runningBalance: true,
            invoiceId: true,
            paymentId: true,
            pettyCashId: true,
          },
        }),
      ),
    ),
    prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, businessName: true, clientNo: true },
      orderBy: { businessName: 'asc' },
    }),
  ]);

  // Map clientId → latest transaction
  const latestByClient = new Map(latestTxns.filter(Boolean).map((t) => [t!.clientId, t!]));

  const data = clients.map((c) => {
    const latest = latestByClient.get(c.id);
    return {
      clientId: c.id,
      clientNo: c.clientNo,
      businessName: c.businessName,
      currentBalance: Number(latest?.runningBalance ?? 0),
      lastTransactionType: latest?.type ?? null,
      lastTransactionDate: latest?.date.toISOString() ?? null,
      lastInvoiceId: latest?.invoiceId ?? null,
      lastPaymentId: latest?.paymentId ?? null,
      lastPettyCashId: latest?.pettyCashId ?? null,
    };
  });

  return NextResponse.json({ data });
}
