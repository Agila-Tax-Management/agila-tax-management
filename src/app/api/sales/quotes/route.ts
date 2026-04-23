// src/app/api/sales/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const lineItemSchema = z.object({
  serviceId: z.number().int().positive('Service ID is required'),
  sourcePackageId: z.number().int().positive().optional().nullable(),
  customName: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  negotiatedRate: z.number().nonnegative('Rate must be 0 or greater'),
  isVatable: z.boolean().default(true),
});

const createClientQuoteSchema = z.object({
  clientId: z.number().int().positive('Client is required'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one service is required'),
  notes: z.string().optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(['DRAFT', 'SENT_TO_CLIENT', 'NEGOTIATING', 'ACCEPTED', 'REJECTED']).optional(),
});

const QUOTE_INCLUDE = {
  lineItems: {
    include: {
      service: { select: { id: true, name: true, billingType: true, frequency: true } },
      sourcePackage: { select: { id: true, name: true } },
    },
  },
  lead: { select: { id: true, firstName: true, lastName: true, businessName: true } },
  client: { select: { id: true, businessName: true, clientNo: true } },
} as const;

/**
 * GET /api/sales/quotes
 * Returns all quotes (lead + client) using the cached data function.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { getSalesQuotes } = await import('@/lib/data/sales/quotes');
  const quotes = await getSalesQuotes();

  return NextResponse.json({ data: quotes });
}

/**
 * POST /api/sales/quotes
 * Creates a new quote linked to an existing client (not a lead).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createClientQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    );
  }

  const client = await prisma.client.findUnique({
    where: { id: parsed.data.clientId },
    select: { id: true, businessName: true },
  });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  try {
    const quote = await prisma.$transaction(async (tx) => {
      // Generate quote number: QT-YYYY-XXXX
      const year = new Date().getFullYear();
      const prefix = `QT-${year}-`;
      const latest = await tx.quote.findFirst({
        where: { quoteNumber: { startsWith: prefix } },
        orderBy: { quoteNumber: 'desc' },
        select: { quoteNumber: true },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.quoteNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const quoteNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

      // Calculate totals
      let subTotal = 0;
      let vatTotal = 0;
      for (const li of parsed.data.lineItems) {
        const lineTotal = li.negotiatedRate * li.quantity;
        subTotal += lineTotal;
        if (li.isVatable) vatTotal += lineTotal * 0.12;
      }
      const grandTotal = subTotal + vatTotal;

      return tx.quote.create({
        data: {
          quoteNumber,
          clientId: parsed.data.clientId,
          status: parsed.data.status ?? 'DRAFT',
          subTotal,
          totalDiscount: 0,
          grandTotal,
          notes: parsed.data.notes ?? null,
          validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
          lineItems: {
            create: parsed.data.lineItems.map((li) => ({
              serviceId: li.serviceId,
              sourcePackageId: li.sourcePackageId ?? null,
              customName: li.customName ?? null,
              quantity: li.quantity,
              negotiatedRate: li.negotiatedRate,
              isVatable: li.isVatable,
            })),
          },
        },
        include: QUOTE_INCLUDE,
      });
    });

    revalidateTag('sales-quotes', 'max');

    void logActivity({
      userId: session.user.id,
      action: 'CREATED',
      entity: 'Quote',
      entityId: quote.id,
      description: `Created quote ${quote.quoteNumber} for client ${client.businessName}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: quote }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sales/quotes]', err);
    return NextResponse.json({ error: 'Failed to create quotation. Please try again.' }, { status: 500 });
  }
}
