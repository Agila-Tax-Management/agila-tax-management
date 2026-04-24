// src/app/api/sales/leads/[id]/invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { logLeadHistory } from "@/lib/lead-history";

type Params = { params: Promise<{ id: string }> };

const LEAD_INCLUDE = {
  status: { select: { id: true, name: true, color: true, sequence: true, isOnboarding: true, isConverted: true } },
  assignedAgent: { select: { id: true, name: true, email: true } },
  promo: { select: { id: true, name: true, code: true, discountType: true, discountRate: true } },
  quotes: {
    orderBy: { createdAt: "desc" as const },
    include: {
      lineItems: {
        include: {
          service: { select: { id: true, name: true, billingType: true, frequency: true } },
          sourcePackage: { select: { id: true, name: true } },
        },
      },
    },
  },
  tsaContracts: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      documentDate: true,
      businessName: true,
      quoteId: true,
      pdfUrl: true,
      clientSignedAt: true,
    },
  },
  invoices: {
    select: { id: true, invoiceNumber: true, status: true },
    orderBy: { issueDate: "asc" as const },
  },
  jobOrders: {
    select: { id: true, jobOrderNumber: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
} as const;

/**
 * POST /api/sales/leads/[id]/invoice
 * Creates the initial invoice from the lead's accepted quote.
 * Requires TSA to be signed first.
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      quotes: {
        where: { status: "ACCEPTED" },
        include: {
          lineItems: {
            include: { service: { select: { id: true, name: true, isVatable: true } } },
          },
        },
        take: 1,
      },
    },
  });

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (!lead.isSignedTSA) {
    return NextResponse.json(
      { error: "The TSA must be signed before creating an invoice." },
      { status: 400 },
    );
  }

  if (lead.isCreatedInvoice) {
    return NextResponse.json(
      { error: "An initial invoice has already been created for this lead." },
      { status: 409 },
    );
  }

  const acceptedQuote = lead.quotes[0] ?? null;
  if (!acceptedQuote || acceptedQuote.lineItems.length === 0) {
    return NextResponse.json(
      { error: "An accepted quote with at least one line item is required." },
      { status: 400 },
    );
  }

  try {
    const updatedLead = await prisma.$transaction(async (tx) => {
      // Generate INV-YYYY-XXXX sequence number
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      const latest = await tx.invoice.findFirst({
        where: { invoiceNumber: { startsWith: prefix } },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.invoiceNumber.split("-");
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;

      // Calculate totals from accepted quote line items
      let subTotal = 0;
      let taxAmount = 0;

      const invoiceItems = acceptedQuote.lineItems.map((li) => {
        const unitPrice = Number(li.negotiatedRate);
        const qty = typeof li.quantity === "number" ? li.quantity : 1;
        const lineTotal = unitPrice * qty;
        const lineTax = li.isVatable ? lineTotal * 0.12 : 0;
        subTotal += lineTotal;
        taxAmount += lineTax;
        return {
          description: li.customName ?? li.service.name,
          quantity: qty,
          unitPrice,
          total: lineTotal,
          isVatable: li.isVatable,
          category: "SERVICE_FEE" as const,
        };
      });

      const totalAmount = subTotal + taxAmount;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create the invoice
      await tx.invoice.create({
        data: {
          invoiceNumber,
          leadId,
          quoteId: acceptedQuote.id,
          status: "UNPAID",
          dueDate,
          subTotal,
          taxAmount,
          discountAmount: 0,
          totalAmount,
          balanceDue: totalAmount,
          terms: "Net 30",
          notes: `Initial invoice for ${lead.businessName ?? `${lead.firstName} ${lead.lastName}`}`,
          items: { create: invoiceItems },
        },
      });

      // Mark lead flag
      await tx.lead.update({
        where: { id: leadId },
        data: { isCreatedInvoice: true },
      });

      return await tx.lead.findUnique({
        where: { id: leadId },
        include: LEAD_INCLUDE,
      });
    });

    // Log outside transaction
    void logLeadHistory({
      leadId,
      actorId: session.user.id,
      changeType: "INVOICE_GENERATED",
      newValue: `Initial invoice created for lead #${leadId}`,
    });

    void logActivity({
      userId: session.user.id,
      action: "CREATED",
      entity: "Invoice",
      entityId: String(leadId),
      description: `Created initial invoice for lead #${leadId} (${lead.firstName} ${lead.lastName})`,
      ...getRequestMeta(request),
    });

    revalidateTag('sales-quotes', 'max');
    revalidatePath('/portal/sales/quotations');

    return NextResponse.json({ data: updatedLead });
  } catch (err) {
    console.error("Create invoice error:", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
