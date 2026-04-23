// src/app/api/sales/quotes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { logLeadHistory } from "@/lib/lead-history";

type Params = { params: Promise<{ id: string }> };

const lineItemSchema = z.object({
  serviceId: z.number().int().positive(),
  sourcePackageId: z.number().int().positive().optional().nullable(),
  customName: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  negotiatedRate: z.number().nonnegative(),
  isVatable: z.boolean().default(true),
});

const patchQuoteSchema = z.object({
  status: z.enum(["DRAFT", "SENT_TO_CLIENT", "NEGOTIATING", "ACCEPTED", "REJECTED"]).optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
  notes: z.string().optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
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
 * GET /api/sales/quotes/[id]
 */
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const quote = await prisma.quote.findUnique({ where: { id }, include: QUOTE_INCLUDE });
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  return NextResponse.json({ data: quote });
}

/**
 * PATCH /api/sales/quotes/[id]
 * Updates a quote's line items and/or status.
 * - Line items can only be changed on DRAFT or NEGOTIATING quotes.
 * - Status can advance through: DRAFT → SENT_TO_CLIENT → NEGOTIATING → ACCEPTED / REJECTED
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.quote.findUnique({
    where: { id },
    select: { id: true, status: true, quoteNumber: true, leadId: true },
  });
  if (!existing) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  // Guard: line items can only be changed if not yet accepted/rejected/void
  if (parsed.data.lineItems && (existing.status === "ACCEPTED" || existing.status === "REJECTED")) {
    return NextResponse.json(
      { error: `Cannot edit line items of a ${existing.status} quote` },
      { status: 409 },
    );
  }

  try {
    const quote = await prisma.$transaction(async (tx) => {
      if (parsed.data.lineItems) {
        // Recalculate totals
        let subTotal = 0;
        let vatTotal = 0;
        for (const li of parsed.data.lineItems) {
          const lineTotal = li.negotiatedRate * li.quantity;
          subTotal += lineTotal;
          if (li.isVatable) vatTotal += lineTotal * 0.12;
        }
        const grandTotal = subTotal + vatTotal;

        await tx.quoteLineItem.deleteMany({ where: { quoteId: id } });

        return tx.quote.update({
          where: { id },
          data: {
            ...(parsed.data.status ? { status: parsed.data.status } : {}),
            ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
            ...(parsed.data.validUntil !== undefined
              ? { validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null }
              : {}),
            subTotal,
            grandTotal,
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
      }

      return tx.quote.update({
        where: { id },
        data: {
          ...(parsed.data.status ? { status: parsed.data.status } : {}),
          ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
          ...(parsed.data.validUntil !== undefined
            ? { validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null }
            : {}),
        },
        include: QUOTE_INCLUDE,
      });
    });

    revalidateTag('sales-quotes', 'max');

    if (parsed.data.status && existing.leadId != null) {
      void logLeadHistory({
        leadId: existing.leadId,
        actorId: session.user.id,
        changeType: "DETAILS_UPDATED",
        oldValue: existing.status,
        newValue: `Quote ${existing.quoteNumber} → ${parsed.data.status}`,
      });
    }

    void logActivity({
      userId: session.user.id,
      action: parsed.data.status ? "STATUS_CHANGE" : "UPDATED",
      entity: "Quote",
      entityId: id,
      description: parsed.data.status
        ? `Quote ${existing.quoteNumber} status changed to ${parsed.data.status}`
        : `Updated quote ${existing.quoteNumber}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: quote });
  } catch (err) {
    console.error("[PATCH /api/sales/quotes/[id]]", err);
    return NextResponse.json({ error: "Failed to update quotation. Please try again." }, { status: 500 });
  }
}

/**
 * DELETE /api/sales/quotes/[id]
 * Deletes a quote (any status).
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.quote.findUnique({
    where: { id },
    select: { id: true, status: true, quoteNumber: true, leadId: true },
  });
  if (!existing) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  await prisma.quote.delete({ where: { id } });

  revalidateTag('sales-quotes', 'max');

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Quote",
    entityId: id,
    description: `Deleted quote ${existing.quoteNumber} (${existing.status})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { deleted: true } });
}
