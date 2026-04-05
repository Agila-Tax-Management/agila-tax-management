// src/app/api/accounting/invoices/services/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { ServiceOption } from '@/types/accounting.types';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const services = await prisma.service.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, serviceRate: true, billingType: true },
    orderBy: { name: 'asc' },
  });

  const options: ServiceOption[] = services.map((s) => ({
    id: s.id,
    type: s.billingType === 'RECURRING' ? ('plan' as const) : ('one-time' as const),
    name: s.name,
    rate: Number(s.serviceRate),
  }));

  return NextResponse.json({ data: options });
}
