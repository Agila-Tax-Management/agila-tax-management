// src/lib/data/sales/quotes.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

const QUOTE_LIST_INCLUDE = {
  lead: {
    select: { id: true, firstName: true, lastName: true, businessName: true },
  },
  client: {
    select: { id: true, businessName: true, clientNo: true },
  },
  lineItems: {
    select: { id: true },
  },
  // ─── Lifecycle indicators (for list-level badges) ─────────────────────────
  tsaContract: {
    select: { id: true, status: true },
  },
  invoice: {
    select: { id: true, status: true },
  },
  jobOrders: {
    select: { id: true, status: true },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

/**
 * Fetch all quotes (lead + client) ordered by newest first.
 * Cached for 5 minutes.
 * @tag sales-quotes
 */
export async function getSalesQuotes() {
  'use cache';
  cacheLife('minutes');
  cacheTag('sales-quotes');

  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    include: QUOTE_LIST_INCLUDE,
  });

  return quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    status: q.status as 'DRAFT' | 'SENT_TO_CLIENT' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED',
    grandTotal: q.grandTotal.toString(),
    subTotal: q.subTotal.toString(),
    totalDiscount: q.totalDiscount.toString(),
    validUntil: q.validUntil?.toISOString() ?? null,
    notes: q.notes,
    lineItemCount: q.lineItems.length,
    sourceType: q.leadId != null ? ('LEAD' as const) : ('CLIENT' as const),
    leadId: q.leadId,
    lead: q.lead
      ? {
          id: q.lead.id,
          firstName: q.lead.firstName,
          lastName: q.lead.lastName,
          businessName: q.lead.businessName,
        }
      : null,
    clientId: q.clientId,
    client: q.client
      ? {
          id: q.client.id,
          businessName: q.client.businessName,
          clientNo: q.client.clientNo,
        }
      : null,
    // ─── Lifecycle indicators ─────────────────────────────────────────────
    tsaStatus: (q.tsaContract?.status ?? null) as
      | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_CLIENT' | 'SIGNED' | 'VOID'
      | null,
    invoiceStatus: (q.invoice?.status ?? null) as
      | 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID'
      | null,
    jobOrderStatus: (q.jobOrders[0]?.status ?? null) as
      | 'DRAFT' | 'PENDING_ACCOUNT_ACK' | 'PENDING_OPERATIONS_ACK' | 'PENDING_EXECUTIVE_ACK'
      | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
      | null,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  }));
}

export type SalesQuoteListItem = Awaited<ReturnType<typeof getSalesQuotes>>[number];
