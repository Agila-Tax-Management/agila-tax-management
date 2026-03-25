// src/app/api/accounting/invoices/services/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { ServiceOption } from '@/types/accounting.types';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [plans, oneTime] = await Promise.all([
    prisma.servicePlan.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, serviceRate: true },
      orderBy: { name: 'asc' },
    }),
    prisma.serviceOneTime.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, serviceRate: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const options: ServiceOption[] = [
    ...plans.map((p) => ({
      id: p.id,
      type: 'plan' as const,
      name: p.name,
      rate: Number(p.serviceRate),
    })),
    ...oneTime.map((o) => ({
      id: o.id,
      type: 'one-time' as const,
      name: o.name,
      rate: Number(o.serviceRate),
    })),
  ];

  return NextResponse.json({ data: options });
}
