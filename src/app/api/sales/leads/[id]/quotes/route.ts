// src/app/api/sales/leads/[id]/quotes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { logLeadHistory } from "@/lib/lead-history";

type Params = { params: Promise<{ id: string }> };

const lineItemSchema = z.object({
  serviceId: z.number().int().positive("Service ID is required"),
  sourcePackageId: z.number().int().positive().optional().nullable(),
  customName: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  negotiatedRate: z.number().nonnegative("Rate must be 0 or greater"),
  isVatable: z.boolean().default(true),
});

const createQuoteSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, "At least one service is required"),
  notes: z.string().optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(["DRAFT", "SENT_TO_CLIENT", "NEGOTIATING", "ACCEPTED", "REJECTED"]).optional(),
});

const QUOTE_INCLUDE = {
  lineItems: {
    include: {
      service: { select: { id: true, name: true, billingType: true, frequency: true } },
      sourcePackage: { select: { id: true, name: true } },
    },
  },
} as const;

/**
 * GET /api/sales/leads/[id]/quotes
 * Returns all quotes for a lead.
 */
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const quotes = await prisma.quote.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    include: QUOTE_INCLUDE,
  });

  return NextResponse.json({ data: quotes });
}

/**
 * POST /api/sales/leads/[id]/quotes
 * Creates a new DRAFT quote for a lead.
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, firstName: true, lastName: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  try {
    const quote = await prisma.$transaction(async (tx) => {
      // Generate quote number: QT-YYYY-XXXX
      const year = new Date().getFullYear();
      const prefix = `QT-${year}-`;
      const latest = await tx.quote.findFirst({
        where: { quoteNumber: { startsWith: prefix } },
        orderBy: { quoteNumber: "desc" },
        select: { quoteNumber: true },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.quoteNumber.split("-");
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const quoteNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;

      // Calculate totals
      let subTotal = 0;
      let vatTotal = 0;
      for (const li of parsed.data.lineItems) {
        const lineTotal = li.negotiatedRate * li.quantity;
        subTotal += lineTotal;
        if (li.isVatable) vatTotal += lineTotal * 0.12;
      }
      const grandTotal = subTotal + vatTotal;

      const newQuote = await tx.quote.create({
        data: {
          quoteNumber,
          leadId,
          status: parsed.data.status ?? "DRAFT",
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

      return newQuote;
    });

    void logActivity({
      userId: session.user.id,
      action: "CREATED",
      entity: "Quote",
      entityId: quote.id,
      description: `Created quote ${quote.quoteNumber} for lead #${leadId} — ${lead.firstName} ${lead.lastName}`,
      ...getRequestMeta(request),
    });

    void logLeadHistory({
      leadId,
      actorId: session.user.id,
      changeType: "DETAILS_UPDATED",
      newValue: `Quotation ${quote.quoteNumber} created`,
    });

    return NextResponse.json({ data: quote }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sales/leads/[id]/quotes]", err);
    return NextResponse.json({ error: "Failed to create quotation. Please try again." }, { status: 500 });
  }
}
