// src/app/api/accounting/client-funds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * GET /api/accounting/client-funds
 * Returns a list of all clients that have at least one ClientFundTransaction
 * OR at least one ChequeMonitoring record, including their current balance,
 * last transaction metadata, and pending cheque totals.
 */
export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Run all queries in parallel
  const [fundGroups, chequeGroups] = await Promise.all([
    prisma.clientFundTransaction.groupBy({ by: ['clientId'] }),
    prisma.chequeMonitoring.groupBy({
      by: ['clientId'],
      _count: { id: true },
      _sum: { amount: true },
      where: { status: 'FOR_CLEARING' },
    }),
  ]);

  const fundClientIds = fundGroups.map((g) => g.clientId);
  const chequeClientIds = chequeGroups.map((g) => g.clientId);
  const allClientIds = [...new Set([...fundClientIds, ...chequeClientIds])];

  if (allClientIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Batch: latest transaction per client + client info
  const [latestTxns, clients] = await Promise.all([
    Promise.all(
      fundClientIds.map((cid) =>
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
      where: { id: { in: allClientIds } },
      select: { id: true, businessName: true, clientNo: true },
      orderBy: { businessName: 'asc' },
    }),
  ]);

  // Map clientId → latest transaction
  const latestByClient = new Map(latestTxns.filter(Boolean).map((t) => [t!.clientId, t!]));

  // Map clientId → pending cheque info
  const pendingByClient = new Map(
    chequeGroups.map((g) => [
      g.clientId,
      { count: g._count.id, amount: Number(g._sum.amount ?? 0) },
    ]),
  );

  const data = clients.map((c) => {
    const latest = latestByClient.get(c.id);
    const pending = pendingByClient.get(c.id);
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
      pendingChequeCount: pending?.count ?? 0,
      pendingChequeAmount: pending?.amount ?? 0,
    };
  });

  return NextResponse.json({ data });
}
