// src/app/(portal)/portal/accounting/payments/[id]/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity } from '@/lib/activity-log';

const updatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'E_WALLET', 'CREDIT_CARD']),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  proofOfPaymentUrl: z.string().url().optional().nullable(),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

export async function updatePaymentAction(
  paymentId: string,
  input: UpdatePaymentInput,
): Promise<{ success: true } | { error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: 'Unauthorized' };

  const parsed = updatePaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  // Step 1: Fetch existing state for audit log
  const existing = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      paymentNumber: true,
      amount: true,
      paymentDate: true,
      method: true,
      referenceNumber: true,
      notes: true,
      proofOfPaymentUrl: true,
      allocations: { select: { amountApplied: true } },
    },
  });
  if (!existing) return { error: 'Payment not found' };

  // Validate new amount against already-allocated total
  const totalAllocated = existing.allocations.reduce(
    (sum, a) => sum + Number(a.amountApplied),
    0,
  );
  if (data.amount < totalAllocated - 0.001) {
    return {
      error: `Amount cannot be less than ₱${totalAllocated.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (already applied to invoices).`,
    };
  }

  // Build human-readable diff summaries
  const oldParts: string[] = [];
  const newParts: string[] = [];

  if (Number(existing.amount) !== data.amount) {
    oldParts.push(`Amount: ₱${Number(existing.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
    newParts.push(`Amount: ₱${data.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
  }
  if (existing.method !== data.method) {
    oldParts.push(`Method: ${existing.method}`);
    newParts.push(`Method: ${data.method}`);
  }
  if ((existing.referenceNumber ?? null) !== (data.referenceNumber ?? null)) {
    oldParts.push(`Ref: ${existing.referenceNumber ?? 'none'}`);
    newParts.push(`Ref: ${data.referenceNumber ?? 'none'}`);
  }
  const existingDateStr = existing.paymentDate.toISOString().split('T')[0];
  if (existingDateStr !== data.paymentDate) {
    oldParts.push(`Date: ${existingDateStr}`);
    newParts.push(`Date: ${data.paymentDate}`);
  }
  if ((existing.notes ?? null) !== (data.notes ?? null)) {
    oldParts.push('Notes changed');
    newParts.push('Notes updated');
  }
  const proofChanged =
    data.proofOfPaymentUrl !== undefined &&
    data.proofOfPaymentUrl !== null &&
    data.proofOfPaymentUrl !== existing.proofOfPaymentUrl;
  if (proofChanged) {
    newParts.push('Uploaded new Proof of Payment');
  }

  const oldValue = oldParts.length > 0 ? oldParts.join(', ') : 'No metadata changes';
  const newValue = newParts.length > 0 ? newParts.join(', ') : 'No changes recorded';

  try {
    await prisma.$transaction(async (tx) => {
      // Step 2: Update the payment record
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          amount: data.amount,
          unusedAmount: data.amount - totalAllocated,
          paymentDate: new Date(data.paymentDate),
          method: data.method,
          referenceNumber: data.referenceNumber ?? null,
          notes: data.notes ?? null,
          ...(proofChanged && data.proofOfPaymentUrl
            ? { proofOfPaymentUrl: data.proofOfPaymentUrl }
            : {}),
        },
      });

      // Step 3: Create audit history entry
      await tx.paymentHistory.create({
        data: {
          paymentId,
          actorId: session.user.id,
          changeType: 'PAYMENT_UPDATED',
          oldValue,
          newValue,
        },
      });
    });

    // Fire-and-forget activity log
    void logActivity({
      userId: session.user.id,
      action: 'UPDATED',
      entity: 'Payment',
      entityId: paymentId,
      description: `Updated payment ${existing.paymentNumber}`,
    });

    // Step 4: Revalidate
    revalidatePath(`/portal/accounting/payments/${paymentId}`);
    revalidatePath('/portal/accounting/payments');

    return { success: true };
  } catch (err) {
    console.error('[updatePaymentAction]', err);
    return { error: 'Failed to update payment. Please try again.' };
  }
}
