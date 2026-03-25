// src/app/(portal)/portal/accounting/billing/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity } from '@/lib/activity-log';

const BILLING_CYCLES = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'] as const;

const createSubscriptionSchema = z.object({
  clientId: z.number().int().positive('Client is required'),
  servicePlanId: z.number().int().positive('Service plan is required'),
  agreedRate: z.number().positive('Agreed rate must be greater than zero'),
  billingCycle: z.enum(BILLING_CYCLES),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  nextBillingDate: z.string().min(1, 'Next billing date is required'),
});

const updateSubscriptionSchema = z.object({
  servicePlanId: z.number().int().positive('Service plan is required'),
  agreedRate: z.number().positive('Agreed rate must be greater than zero'),
  billingCycle: z.enum(BILLING_CYCLES),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  nextBillingDate: z.string().nullable(),
  isActive: z.boolean(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export async function createSubscriptionAction(
  input: CreateSubscriptionInput,
): Promise<{ success: true; id: number } | { error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: 'Unauthorized' };

  const parsed = createSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  // Enforce one-active-subscription-per-client rule
  const existing = await prisma.clientSubscription.findFirst({
    where: { clientId: data.clientId, isActive: true },
    select: { id: true },
  });
  if (existing) {
    return {
      error:
        'This client already has an active subscription. Please deactivate it before creating a new one.',
    };
  }

  const plan = await prisma.servicePlan.findUnique({
    where: { id: data.servicePlanId },
    select: { name: true },
  });

  try {
    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.clientSubscription.create({
        data: {
          clientId: data.clientId,
          servicePlanId: data.servicePlanId,
          agreedRate: data.agreedRate,
          billingCycle: data.billingCycle,
          effectiveDate: new Date(data.effectiveDate),
          nextBillingDate: new Date(data.nextBillingDate),
          isActive: true,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          actorId: session.user.id,
          changeType: 'SUBSCRIPTION_CREATED',
          newValue: `Plan: ${plan?.name ?? data.servicePlanId}, Rate: \u20b1${data.agreedRate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}, Cycle: ${data.billingCycle}`,
        },
      });

      return sub;
    });

    void logActivity({
      userId: session.user.id,
      action: 'CREATED',
      entity: 'ClientSubscription',
      entityId: String(subscription.id),
      description: `Created subscription for client #${data.clientId} — ${plan?.name ?? 'Plan #' + data.servicePlanId}`,
    });

    revalidatePath('/portal/accounting/billing');
    return { success: true, id: subscription.id };
  } catch (err) {
    console.error('[createSubscriptionAction]', err);
    return { error: 'Failed to create subscription. Please try again.' };
  }
}

export async function updateSubscriptionAction(
  subscriptionId: number,
  input: UpdateSubscriptionInput,
): Promise<{ success: true } | { error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: 'Unauthorized' };

  const parsed = updateSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  const existing = await prisma.clientSubscription.findUnique({
    where: { id: subscriptionId },
    select: {
      servicePlanId: true,
      agreedRate: true,
      billingCycle: true,
      isActive: true,
      servicePlan: { select: { name: true } },
    },
  });
  if (!existing) return { error: 'Subscription not found' };

  // Fetch new plan name if plan changed
  let newPlanName = existing.servicePlan?.name ?? String(data.servicePlanId);
  if (existing.servicePlanId !== data.servicePlanId) {
    const newPlan = await prisma.servicePlan.findUnique({
      where: { id: data.servicePlanId },
      select: { name: true },
    });
    newPlanName = newPlan?.name ?? String(data.servicePlanId);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.clientSubscription.update({
        where: { id: subscriptionId },
        data: {
          servicePlanId: data.servicePlanId,
          agreedRate: data.agreedRate,
          billingCycle: data.billingCycle,
          effectiveDate: new Date(data.effectiveDate),
          nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
          isActive: data.isActive,
          // Set inactiveDate when deactivating, clear it when reactivating
          ...(data.isActive !== existing.isActive && {
            inactiveDate: data.isActive ? null : new Date(),
          }),
        },
      });

      // Log plan change
      if (existing.servicePlanId !== data.servicePlanId) {
        await tx.subscriptionHistory.create({
          data: {
            subscriptionId,
            actorId: session.user.id,
            changeType: 'PLAN_CHANGED',
            oldValue: `Plan: ${existing.servicePlan?.name ?? existing.servicePlanId}`,
            newValue: `Plan: ${newPlanName}`,
          },
        });
      }

      // Log rate change
      if (Number(existing.agreedRate) !== data.agreedRate) {
        await tx.subscriptionHistory.create({
          data: {
            subscriptionId,
            actorId: session.user.id,
            changeType: 'RATE_CHANGED',
            oldValue: `Rate: \u20b1${Number(existing.agreedRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            newValue: `Rate: \u20b1${data.agreedRate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
          },
        });
      }

      // Log active status change
      if (existing.isActive !== data.isActive) {
        await tx.subscriptionHistory.create({
          data: {
            subscriptionId,
            actorId: session.user.id,
            changeType: data.isActive ? 'REACTIVATED' : 'PAUSED',
            oldValue: existing.isActive ? 'Active' : 'Inactive',
            newValue: data.isActive ? 'Active' : 'Inactive',
          },
        });
      }
    });

    void logActivity({
      userId: session.user.id,
      action: 'UPDATED',
      entity: 'ClientSubscription',
      entityId: String(subscriptionId),
      description: `Updated subscription #${subscriptionId}`,
    });

    revalidatePath('/portal/accounting/billing');
    revalidatePath(`/portal/accounting/billing/${subscriptionId}`);

    return { success: true };
  } catch (err) {
    console.error('[updateSubscriptionAction]', err);
    return { error: 'Failed to update subscription. Please try again.' };
  }
}
