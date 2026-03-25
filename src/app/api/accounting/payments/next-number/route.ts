// src/app/api/accounting/payments/next-number/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  const latest = await prisma.payment.findFirst({
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
  return NextResponse.json({ data: { paymentNumber } });
}
