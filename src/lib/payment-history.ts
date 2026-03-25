// src/lib/payment-history.ts
import prisma from './db';
import type { PaymentChangeType } from '@/generated/prisma/client';

interface AddPaymentHistoryInput {
  paymentId: string;
  actorId?: string | null;
  changeType: PaymentChangeType;
  oldValue?: string | null;
  newValue?: string | null;
}

/**
 * Fire-and-forget payment history writer.
 * Always call with `void` so it never blocks the response.
 */
export function addPaymentHistory(input: AddPaymentHistoryInput): Promise<void> {
  return prisma.paymentHistory
    .create({
      data: {
        paymentId: input.paymentId,
        actorId: input.actorId ?? null,
        changeType: input.changeType,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
      },
    })
    .then(() => {})
    .catch((err: unknown) => {
      console.error('[PaymentHistory] Failed to write history:', err);
    });
}
