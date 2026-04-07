// src/app/api/client-gateway/clients/[id]/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import prisma from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });

  const subscriptions = await prisma.clientSubscription.findMany({
    where: { clientId },
    select: {
      id: true,
      serviceId: true,
      service: { select: { id: true, name: true } },
      billingCycle: true,
      agreedRate: true,
      effectiveDate: true,
      inactiveDate: true,
      nextBillingDate: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ isActive: 'desc' }, { effectiveDate: 'asc' }],
  });

  const data = subscriptions.map((s) => ({
    id: s.id,
    serviceId: s.serviceId,
    serviceName: s.service.name,
    billingCycle: s.billingCycle,
    agreedRate: Number(s.agreedRate),
    effectiveDate: s.effectiveDate.toISOString(),
    inactiveDate: s.inactiveDate ? s.inactiveDate.toISOString() : null,
    nextBillingDate: s.nextBillingDate ? s.nextBillingDate.toISOString() : null,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}
