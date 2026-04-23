// src/app/api/sales/tsa/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { logLeadHistory } from "@/lib/lead-history";
import { notify } from "@/lib/notification";

type Params = { params: Promise<{ id: string }> };

const TSA_SELECT = {
  id: true,
  referenceNumber: true,
  status: true,
  documentDate: true,
  businessName: true,
  authorizedRep: true,
  email: true,
  phone: true,
  tin: true,
  civilStatus: true,
  businessAddress: true,
  residenceAddress: true,
  isBusinessRegistered: true,
  lockInMonths: true,
  billingCycleStart: true,
  pdfUrl: true,
  leadId: true,
  clientId: true,
  quoteId: true,
  preparedById: true,
  preparedAt: true,
  assignedApproverId: true,
  assignedApprover: { select: { id: true, name: true, email: true, image: true } },
  actualApproverId: true,
  actualApprover: { select: { id: true, name: true, email: true, image: true } },
  approvedAt: true,
  clientSignedAt: true,
  clientSignerName: true,
  createdAt: true,
  updatedAt: true,
  preparedBy: { select: { id: true, name: true } },
  quote: {
    include: {
      lineItems: {
        include: {
          service: { select: { id: true, name: true, billingType: true, frequency: true, serviceRate: true } },
          sourcePackage: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

const patchTsaSchema = z.discriminatedUnion("action", [
  // Update editable fields (DRAFT only)
  z.object({
    action: z.literal("update"),
    documentDate: z.string().datetime({ offset: true }).optional(),
    businessName: z.string().min(1).optional(),
    authorizedRep: z.string().min(1).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    tin: z.string().optional().nullable(),
    civilStatus: z.string().optional().nullable(),
    businessAddress: z.string().optional().nullable(),
    residenceAddress: z.string().optional().nullable(),
    isBusinessRegistered: z.boolean().optional(),
    lockInMonths: z.number().int().positive().optional(),
    billingCycleStart: z.number().int().min(1).max(31).optional(),
    pdfUrl: z.string().url().optional().nullable(),
  }),
  // Submit for approval (DRAFT → PENDING_APPROVAL)
  z.object({ action: z.literal("submit_for_approval") }),
  // Approve (PENDING_APPROVAL → APPROVED)
  z.object({ action: z.literal("approve") }),
  // Send to client (APPROVED → SENT_TO_CLIENT)
  z.object({ action: z.literal("send_to_client") }),
  // Mark as signed by client (SENT_TO_CLIENT → SIGNED)
  z.object({
    action: z.literal("mark_signed"),
    clientSignerName: z.string().min(1, "Signer name is required"),
    clientSignedAt: z.string().datetime({ offset: true }).optional(),
    pdfUrl: z.string().url().optional().nullable(),
  }),
  // Void at any stage before SIGNED
  z.object({ action: z.literal("void") }),
]);

/**
 * GET /api/sales/tsa/[id]
 */
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tsa = await prisma.tsaContract.findUnique({ where: { id }, select: TSA_SELECT });
  if (!tsa) return NextResponse.json({ error: "TSA not found" }, { status: 404 });

  return NextResponse.json({ data: tsa });
}

/**
 * PATCH /api/sales/tsa/[id]
 * Handles both field updates and workflow state transitions.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.tsaContract.findUnique({
    where: { id },
    select: { id: true, status: true, referenceNumber: true, leadId: true, clientId: true, quoteId: true },
  });
  if (!existing) return NextResponse.json({ error: "TSA not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchTsaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { action } = parsed.data;
  const leadId = existing.leadId;
  const clientId = existing.clientId;
  const tsaQuoteId = existing.quoteId;

  let updateData: Record<string, unknown> = {};
  let historyValue = "";

  if (action === "update") {
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT TSAs can be edited" }, { status: 409 });
    }
    const { action: _a, documentDate, ...rest } = parsed.data;
    updateData = {
      ...rest,
      ...(documentDate ? { documentDate: new Date(documentDate) } : {}),
    };
    historyValue = `TSA ${existing.referenceNumber} details updated`;
  } else if (action === "submit_for_approval") {
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT TSAs can be submitted" }, { status: 409 });
    }

    // Fetch default TSA approver from sales settings
    const firmClient = await prisma.client.findFirst({
      where: { active: true },
      select: { id: true },
    });

    let assignedApproverId: string | null = null;

    if (firmClient) {
      const settings = await prisma.salesSetting.findUnique({
        where: { clientId: firmClient.id },
        select: { defaultTsaApproverId: true, defaultTsaApprover: { select: { id: true, name: true } } },
      });
      assignedApproverId = settings?.defaultTsaApproverId ?? null;
    }

    updateData = { status: "PENDING_APPROVAL", assignedApproverId };
    historyValue = `TSA ${existing.referenceNumber} submitted for approval`;

    // Notify assigned approver if configured
    if (assignedApproverId) {
      void notify({
        userId: assignedApproverId,
        type: "TASK",
        priority: "HIGH",
        title: "TSA contract awaits your approval",
        message: `${existing.referenceNumber} has been submitted for your review.`,
        linkUrl: `/portal/sales/lead-center`,
      });
    }
  } else if (action === "approve") {
    if (existing.status !== "PENDING_APPROVAL") {
      return NextResponse.json({ error: "TSA must be PENDING_APPROVAL to approve" }, { status: 409 });
    }

    // Fetch full TSA to check assigned approver
    const tsaForPermCheck = await prisma.tsaContract.findUnique({
      where: { id },
      select: {
        assignedApproverId: true,
        preparedById: true,
        preparedBy: { select: { id: true, name: true } },
      },
    });
    if (!tsaForPermCheck) {
      return NextResponse.json({ error: "TSA not found" }, { status: 404 });
    }

    // Permission check: User role ADMIN/SUPER_ADMIN or assigned approver
    const hasAdminOverride =
      session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

    const isAssignedApprover =
      tsaForPermCheck.assignedApproverId && tsaForPermCheck.assignedApproverId === session.user.id;

    if (!hasAdminOverride && !isAssignedApprover) {
      return NextResponse.json(
        { error: "Only the assigned approver or admin can approve this TSA" },
        { status: 403 },
      );
    }

    updateData = { status: "APPROVED", actualApproverId: session.user.id, approvedAt: new Date() };
    historyValue = `TSA ${existing.referenceNumber} approved`;

    // Notify preparer if different from approver
    if (tsaForPermCheck.preparedById && tsaForPermCheck.preparedById !== session.user.id) {
      void notify({
        userId: tsaForPermCheck.preparedById,
        type: "DOCUMENT",
        priority: "NORMAL",
        title: "TSA contract approved",
        message: `${existing.referenceNumber} has been approved and is ready to send to client.`,
        linkUrl: `/portal/sales/lead-center`,
      });
    }
  } else if (action === "send_to_client") {
    if (existing.status !== "APPROVED") {
      return NextResponse.json({ error: "TSA must be APPROVED before sending to client" }, { status: 409 });
    }
    updateData = { status: "SENT_TO_CLIENT" };
    historyValue = `TSA ${existing.referenceNumber} sent to client`;
  } else if (action === "mark_signed") {
    if (existing.status !== "SENT_TO_CLIENT") {
      return NextResponse.json({ error: "TSA must be SENT_TO_CLIENT to mark as signed" }, { status: 409 });
    }
    const { clientSignerName, clientSignedAt, pdfUrl } = parsed.data;
    updateData = {
      status: "SIGNED",
      clientSignerName,
      clientSignedAt: clientSignedAt ? new Date(clientSignedAt) : new Date(),
      ...(pdfUrl !== undefined ? { pdfUrl } : {}),
    };
    historyValue = `TSA ${existing.referenceNumber} signed by ${clientSignerName}`;
  } else if (action === "void") {
    if (existing.status === "SIGNED") {
      return NextResponse.json({ error: "Signed TSAs cannot be voided" }, { status: 409 });
    }
    // Clear quoteId so the @unique constraint is freed, allowing a new TSA to be created for the same quote
    updateData = { status: "VOID", quoteId: null };
    historyValue = `TSA ${existing.referenceNumber} voided`;
  }

  let tsa: Awaited<ReturnType<typeof prisma.tsaContract.update<{ where: { id: string }; data: Record<string, unknown>; select: typeof TSA_SELECT }>>>;
  let autoCreatedInvoiceNumber: string | null = null;

  if (action === "mark_signed" && leadId) {
    // ─── Lead path: update TSA + lead flags + auto-create invoice ────────────
    const txResult = await prisma.$transaction(async (tx) => {
      const updatedTsa = await tx.tsaContract.update({
        where: { id },
        data: updateData,
        select: TSA_SELECT,
      });

      // Fetch lead with accepted quote to auto-generate invoice
      const lead = await tx.lead.findUnique({
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

      const leadUpdateData: Record<string, unknown> = {
        isSignedTSA: true,
        signedTsaUrl: updatedTsa.pdfUrl ?? null,
        // Sync the TSA's authoritative business name back to the lead
        businessName: updatedTsa.businessName,
      };

      let createdInvoiceNumber: string | null = null;

      // Auto-create invoice from accepted quote if not yet created
      // Double-check: ensure no invoice already exists for this lead
      const existingInvoice = await tx.invoice.findFirst({
        where: { leadId },
        select: { invoiceNumber: true },
      });

      if (lead && !lead.isCreatedInvoice && !existingInvoice) {
        const acceptedQuote = lead.quotes[0] ?? null;
        if (acceptedQuote && acceptedQuote.lineItems.length > 0) {
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
          createdInvoiceNumber = invoiceNumber;

          // Calculate invoice totals
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
              notes: `Initial invoice for ${updatedTsa.businessName}`,
              items: { create: invoiceItems },
            },
          });

          leadUpdateData.isCreatedInvoice = true;
        }
      } else if (existingInvoice && !lead?.isCreatedInvoice) {
        // Invoice exists but flag not set — sync the flag
        leadUpdateData.isCreatedInvoice = true;
      }

      await tx.lead.update({ where: { id: leadId }, data: leadUpdateData });
      return { updatedTsa, createdInvoiceNumber };
    });

    tsa = txResult.updatedTsa;
    autoCreatedInvoiceNumber = txResult.createdInvoiceNumber;

    void logLeadHistory({
      leadId,
      actorId: session.user.id,
      changeType: "TSA_SIGNED",
      newValue: historyValue,
    });

    if (autoCreatedInvoiceNumber) {
      void logLeadHistory({
        leadId,
        actorId: session.user.id,
        changeType: "INVOICE_GENERATED",
        newValue: `Generated initial onboarding invoice ${autoCreatedInvoiceNumber} — auto-created on TSA signing`,
      });
      revalidatePath("/portal/accounting-and-finance/billing");
      revalidateTag('sales-quotes', 'max');
      revalidatePath('/portal/sales/quotations');
    }
  } else if (action === "mark_signed" && clientId && !leadId) {
    // ─── Client path: update TSA + auto-create invoice linked to client quote ─
    const txResult = await prisma.$transaction(async (tx) => {
      const updatedTsa = await tx.tsaContract.update({
        where: { id },
        data: updateData,
        select: TSA_SELECT,
      });

      let createdInvoiceNumber: string | null = null;

      if (tsaQuoteId) {
        // Check no invoice already exists for this quote
        const existingInvoice = await tx.invoice.findFirst({
          where: { quoteId: tsaQuoteId },
          select: { invoiceNumber: true },
        });

        if (!existingInvoice) {
          const quote = await tx.quote.findUnique({
            where: { id: tsaQuoteId },
            include: {
              lineItems: {
                include: { service: { select: { id: true, name: true, isVatable: true } } },
              },
            },
          });

          if (quote && quote.lineItems.length > 0) {
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
            createdInvoiceNumber = invoiceNumber;

            let subTotal = 0;
            let taxAmount = 0;
            const invoiceItems = quote.lineItems.map((li) => {
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

            await tx.invoice.create({
              data: {
                invoiceNumber,
                clientId,
                quoteId: tsaQuoteId,
                status: "UNPAID",
                dueDate,
                subTotal,
                taxAmount,
                discountAmount: 0,
                totalAmount,
                balanceDue: totalAmount,
                terms: "Net 30",
                notes: `Invoice for ${updatedTsa.businessName} — ${updatedTsa.referenceNumber}`,
                items: { create: invoiceItems },
              },
            });
          }
        }
      }

      return { updatedTsa, createdInvoiceNumber };
    });

    tsa = txResult.updatedTsa;
    autoCreatedInvoiceNumber = txResult.createdInvoiceNumber;

    if (autoCreatedInvoiceNumber) {
      revalidatePath("/portal/accounting-and-finance/billing");
    }
  } else {
    tsa = await prisma.tsaContract.update({
      where: { id },
      data: updateData,
      select: TSA_SELECT,
    });

    if (leadId && historyValue) {
      void logLeadHistory({
        leadId,
        actorId: session.user.id,
        changeType: "DETAILS_UPDATED",
        newValue: historyValue,
      });
    }
  }

  // Invalidate quote-related caches so QuotationViewModal reflects latest TSA status
  revalidateTag('sales-quotes', 'max');
  revalidatePath('/portal/sales/quotations');

  void logActivity({
    userId: session.user.id,
    action: action === "update" ? "UPDATED" : "STATUS_CHANGE",
    entity: "TsaContract",
    entityId: id,
    description: historyValue,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: tsa });
}

/**
 * DELETE /api/sales/tsa/[id]
 * Permanently deletes a TSA. Only allowed when status is DRAFT or PENDING_APPROVAL.
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.tsaContract.findUnique({
    where: { id },
    select: { id: true, status: true, referenceNumber: true, leadId: true },
  });
  if (!existing) return NextResponse.json({ error: "TSA not found" }, { status: 404 });

  if (existing.status !== "DRAFT" && existing.status !== "PENDING_APPROVAL") {
    return NextResponse.json(
      { error: "Only DRAFT or PENDING_APPROVAL contracts can be deleted." },
      { status: 409 },
    );
  }

  await prisma.tsaContract.delete({ where: { id } });

  if (existing.leadId) {
    void logLeadHistory({
      leadId: existing.leadId,
      actorId: session.user.id,
      changeType: "DETAILS_UPDATED",
      newValue: `TSA ${existing.referenceNumber} deleted`,
    });
  }

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "TsaContract",
    entityId: id,
    description: `Deleted TSA ${existing.referenceNumber}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id } });
}
