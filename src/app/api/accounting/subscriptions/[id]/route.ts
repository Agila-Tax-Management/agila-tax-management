// src/app/api/accounting/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type {
  SubscriptionDetailRecord,
  SubscriptionHistoryRecord,
  BillingCycleType,
  SubscriptionChangeType,
} from '@/types/accounting.types';

const DETAIL_SELECT = {
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
  historyLogs: {
    select: {
      id: true,
      changeType: true,
      oldValue: true,
      newValue: true,
      actorId: true,
      actor: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

function serialize(s: unknown): SubscriptionDetailRecord {
  const sub = s as Record<string, unknown>;
  const plan = sub.servicePlan as Record<string, unknown>;
  return {
    id: sub.id as number,
    clientId: sub.clientId as number,
    client: sub.client as SubscriptionDetailRecord['client'],
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
    historyLogs: ((sub.historyLogs as Record<string, unknown>[]) ?? []).map(
      (h): SubscriptionHistoryRecord => ({
        id: h.id as string,
        changeType: h.changeType as SubscriptionChangeType,
        oldValue: h.oldValue as string | null,
        newValue: h.newValue as string | null,
        actorId: h.actorId as string | null,
        actor: h.actor as { id: string; name: string } | null,
        createdAt: (h.createdAt as Date).toISOString(),
      }),
    ),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const subId = parseInt(id, 10);
  if (isNaN(subId))
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const subscription = await prisma.clientSubscription.findUnique({
    where: { id: subId },
    select: DETAIL_SELECT,
  });

  if (!subscription)
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  return NextResponse.json({ data: serialize(subscription) });
}
