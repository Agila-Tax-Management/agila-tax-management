// src/app/api/accounting/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';
import type { PaymentListRecord, PaymentStats } from '@/types/accounting.types';

const PAYMENT_SELECT = {
  id: true,
  paymentNumber: true,
  clientId: true,
  client: { select: { id: true, businessName: true, clientNo: true } },
  amount: true,
  unusedAmount: true,
  paymentDate: true,
  method: true,
  referenceNumber: true,
  createdAt: true,
} as const;

function serialize(p: unknown): PaymentListRecord {
  const pay = p as Record<string, unknown>;
  return {
    id: pay.id as string,
    paymentNumber: pay.paymentNumber as string,
    clientId: pay.clientId as number | null,
    client: pay.client as PaymentListRecord['client'],
    amount: Number(pay.amount),
    unusedAmount: Number(pay.unusedAmount),
    paymentDate: (pay.paymentDate as Date).toISOString(),
    method: pay.method as PaymentListRecord['method'],
    referenceNumber: pay.referenceNumber as string | null,
    createdAt: (pay.createdAt as Date).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const method = searchParams.get('method') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 50;
  const skip = (page - 1) * limit;

  type WhereClause = Prisma.PaymentWhereInput;
  const where: WhereClause = {};
  if (method) where.method = method as import('@/generated/prisma/client').PaymentMethod;
  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: 'insensitive' } },
      { client: { businessName: { contains: search, mode: 'insensitive' } } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [payments, total, sumAgg] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: PAYMENT_SELECT,
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      _sum: { amount: true, unusedAmount: true },
      _count: { id: true },
    }),
  ]);

  const stats: PaymentStats = {
    totalReceived: Number(sumAgg._sum.amount ?? 0),
    totalUnusedCredit: Number(sumAgg._sum.unusedAmount ?? 0),
    paymentCount: sumAgg._count.id,
  };

  return NextResponse.json({
    data: payments.map(serialize),
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
    stats,
  });
}
