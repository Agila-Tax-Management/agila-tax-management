// src/lib/invoice-history.ts
import prisma from './db';
import type { InvoiceChangeType } from '@/generated/prisma/client';

interface AddInvoiceHistoryInput {
  invoiceId: string;
  actorId?: string | null;
  changeType: InvoiceChangeType;
  oldValue?: string | null;
  newValue?: string | null;
}

/**
 * Fire-and-forget invoice history writer.
 * Always call with `void` so it never blocks the response.
 */
export function addInvoiceHistory(input: AddInvoiceHistoryInput): Promise<void> {
  return prisma.invoiceHistory
    .create({
      data: {
        invoiceId: input.invoiceId,
        actorId: input.actorId ?? null,
        changeType: input.changeType,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
      },
    })
    .then(() => {})
    .catch((err: unknown) => {
      console.error('[InvoiceHistory] Failed to write history:', err);
    });
}
