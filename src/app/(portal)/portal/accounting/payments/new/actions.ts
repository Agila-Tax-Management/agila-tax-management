// src/app/(portal)/portal/accounting/payments/new/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity } from '@/lib/activity-log';
import type { RecordPaymentInput } from '@/types/accounting.types';

export async function recordPaymentAction(
  input: RecordPaymentInput,
): Promise<{ paymentId: string } | { error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: 'Unauthorized' };

  const validAllocations = input.allocations.filter((a) => a.amountApplied > 0);
  const totalApplied = validAllocations.reduce((s, a) => s + a.amountApplied, 0);
  const unusedAmount = Math.max(0, input.amount - totalApplied);

  try {
    const payment = await prisma.$transaction(async (tx) => {
      // Step 1: Generate PAY-YYYY-XXXX atomically
      const year = new Date().getFullYear();
      const prefix = `PAY-${year}-`;
      const latest = await tx.payment.findFirst({
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

      // Step 2: Create the payment record
      const newPayment = await tx.payment.create({
        data: {
          paymentNumber,
          clientId: input.clientId,
          recordedById: session.user.id,
          amount: input.amount,
          unusedAmount,
          paymentDate: new Date(input.paymentDate),
          method: input.method,
          referenceNumber: input.referenceNumber ?? null,
          notes: input.notes ?? null,
        },
        select: { id: true, paymentNumber: true },
      });

      // Step 3: Create allocations and update each invoice
      for (const alloc of validAllocations) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: newPayment.id,
            invoiceId: alloc.invoiceId,
            amountApplied: alloc.amountApplied,
          },
        });

        const invoice = await tx.invoice.findUnique({
          where: { id: alloc.invoiceId },
          select: { balanceDue: true, totalAmount: true, invoiceNumber: true },
        });
        if (!invoice) continue;

        const newBalanceDue = Math.max(0, Number(invoice.balanceDue) - alloc.amountApplied);
        const newStatus = newBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: alloc.invoiceId },
          data: { balanceDue: newBalanceDue, status: newStatus },
        });

        await tx.invoiceHistory.create({
          data: {
            invoiceId: alloc.invoiceId,
            actorId: session.user.id,
            changeType: 'PAYMENT_ADDED',
            newValue: `${input.method} ₱${alloc.amountApplied.toLocaleString('en-PH', { minimumFractionDigits: 2 })} via ${newPayment.paymentNumber}`,
          },
        });
      }

      return newPayment;
    });

    void logActivity({
      userId: session.user.id,
      action: 'CREATED',
      entity: 'Payment',
      entityId: payment.id,
      description: `Recorded payment ${payment.paymentNumber} of ₱${input.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} for client #${input.clientId}`,
    });

    // Step 4: Revalidate both lists
    revalidatePath('/portal/accounting/payments');
    revalidatePath('/portal/accounting/invoices');

    return { paymentId: payment.id };
  } catch (err) {
    console.error('[recordPaymentAction]', err);
    return { error: 'Failed to record payment. Please try again.' };
  }
}
