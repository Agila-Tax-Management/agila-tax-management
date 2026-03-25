// src/app/api/accounting/subscriptions/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { SubscriptionListRecord, BillingCycleType } from '@/types/accounting.types';

const LIST_SELECT = {
  id: true,
  clientId: true,
  client: { select: { id: true, businessName: true, clientNo: true } },
  servicePlanId: true,
  servicePlan: { select: { id: true, name: true, serviceRate: true } },
  billingCycle: true,
  agreedRate: true,
  effectiveDate: true,
  nextBillingDate: true,
  inactiveDate: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function serialize(s: unknown): SubscriptionListRecord {
  const sub = s as Record<string, unknown>;
  const plan = sub.servicePlan as Record<string, unknown>;
  return {
    id: sub.id as number,
    clientId: sub.clientId as number,
    client: sub.client as SubscriptionListRecord['client'],
    servicePlanId: sub.servicePlanId as number,
    servicePlan: {
      id: plan.id as number,
      name: plan.name as string,
      serviceRate: Number(plan.serviceRate),
    },
    billingCycle: sub.billingCycle as BillingCycleType,
    agreedRate: Number(sub.agreedRate),
    effectiveDate: (sub.effectiveDate as Date).toISOString(),
    nextBillingDate: sub.nextBillingDate
      ? (sub.nextBillingDate as Date).toISOString()
      : null,
    inactiveDate: sub.inactiveDate
      ? (sub.inactiveDate as Date).toISOString()
      : null,
    isActive: sub.isActive as boolean,
    createdAt: (sub.createdAt as Date).toISOString(),
    updatedAt: (sub.updatedAt as Date).toISOString(),
  };
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscriptions = await prisma.clientSubscription.findMany({
    select: LIST_SELECT,
    orderBy: [{ isActive: 'desc' }, { client: { businessName: 'asc' } }],
  });

  return NextResponse.json({ data: subscriptions.map(serialize) });
}
