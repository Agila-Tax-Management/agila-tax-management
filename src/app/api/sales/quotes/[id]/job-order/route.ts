// src/app/api/sales/quotes/[id]/job-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { notify } from "@/lib/notification";

type Params = { params: Promise<{ id: string }> };

const createJobOrderSchema = z.object({
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/sales/quotes/[id]/job-order
 * Creates a Job Order for an existing client's accepted quote.
 * Preconditions: TSA must be SIGNED, quote must have a PAID invoice.
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Permission gate: only ADMIN/SETTINGS-level sales portal users can create job orders
  const salesRole = session.portalRoles?.SALES;
  const hasAccess =
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "ADMIN" ||
    salesRole === "ADMIN" ||
    salesRole === "SETTINGS";
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Only Sales Admins or Settings users can create Job Orders." },
      { status: 403 },
    );
  }

  const { id: quoteId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      lineItems: { include: { service: true } },
      tsaContract: { select: { id: true, status: true } },
      invoice: { select: { id: true, status: true } },
      jobOrders: { select: { id: true }, take: 1 },
      client: { select: { id: true, businessName: true } },
    },
  });

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  if (quote.leadId !== null) {
    return NextResponse.json(
      { error: "This quote belongs to a lead. Use the Lead Center to create a Job Order." },
      { status: 409 },
    );
  }

  if (!quote.clientId) {
    return NextResponse.json({ error: "Quote has no associated client" }, { status: 400 });
  }

  if (quote.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Only an ACCEPTED quote can generate a Job Order" },
      { status: 409 },
    );
  }

  if (!quote.tsaContract || quote.tsaContract.status !== "SIGNED") {
    return NextResponse.json(
      { error: "The TSA must be SIGNED before creating a Job Order." },
      { status: 400 },
    );
  }

  if (!quote.invoice || quote.invoice.status !== "PAID") {
    return NextResponse.json(
      { error: "The invoice must be PAID before a Job Order can be created." },
      { status: 400 },
    );
  }

  if (quote.jobOrders.length > 0) {
    return NextResponse.json(
      { error: "A Job Order has already been created for this quote." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createJobOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  // Pre-read sales settings outside the transaction
  const firmClient = await prisma.client.findFirst({
    where: { active: true },
    select: { id: true },
  });
  const salesSettings = firmClient
    ? await prisma.salesSetting.findUnique({
        where: { clientId: firmClient.id },
        select: {
          defaultJoOperationsApproverId: true,
          defaultJoAccountApproverId: true,
          defaultJoGeneralApproverId: true,
        },
      })
    : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Generate job order number: JO-YYYY-XXXX
      const year = new Date().getFullYear();
      const prefix = `JO-${year}-`;
      const latest = await tx.jobOrder.findFirst({
        where: { jobOrderNumber: { startsWith: prefix } },
        orderBy: { jobOrderNumber: "desc" },
        select: { jobOrderNumber: true },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.jobOrderNumber.split("-");
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const jobOrderNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;

      const recurringItems = quote.lineItems.filter((li) => li.service.billingType === "RECURRING");
      const oneTimeItems = quote.lineItems.filter((li) => li.service.billingType === "ONE_TIME");

      const jobOrder = await tx.jobOrder.create({
        data: {
          jobOrderNumber,
          clientId: quote.clientId,
          quoteId,
          status: "DRAFT",
          notes: parsed.data.notes ?? null,
          preparedById: session.user.id,
          datePrepared: new Date(),
          assignedOperationsManagerId: salesSettings?.defaultJoOperationsApproverId ?? null,
          assignedAccountManagerId: salesSettings?.defaultJoAccountApproverId ?? null,
          assignedExecutiveId: salesSettings?.defaultJoGeneralApproverId ?? null,
          items: {
            create: [
              ...recurringItems.map((li) => ({
                itemType: "SUBSCRIPTION" as const,
                serviceName: li.customName ?? li.service.name,
                serviceId: li.serviceId,
                rate: Number(li.negotiatedRate),
                discount: 0,
                total: Number(li.negotiatedRate),
              })),
              ...oneTimeItems.map((li) => ({
                itemType: "ONE_TIME" as const,
                serviceName: li.customName ?? li.service.name,
                serviceId: li.serviceId,
                rate: Number(li.negotiatedRate),
                discount: 0,
                total: Number(li.negotiatedRate),
              })),
            ],
          },
        },
        select: { id: true, jobOrderNumber: true },
      });

      return jobOrder;
    }, { timeout: 15000 });

    if (salesSettings?.defaultJoOperationsApproverId) {
      void notify({
        userId: salesSettings.defaultJoOperationsApproverId,
        type: "TASK",
        priority: "NORMAL",
        title: "New Job Order Ready for Approval",
        message: `Job Order ${result.jobOrderNumber} for ${quote.client?.businessName ?? "client"} is ready for your approval.`,
        linkUrl: `/portal/sales/job-orders/${result.id}`,
      });
    }

    revalidateTag("sales-quotes", "max");
    revalidatePath("/portal/sales/quotations");

    void logActivity({
      userId: session.user.id,
      action: "CREATED",
      entity: "JobOrder",
      entityId: result.id,
      description: `Created Job Order ${result.jobOrderNumber} for client quote ${quoteId} (${quote.client?.businessName ?? "Unknown"})`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({
      data: result,
      warning:
        !salesSettings?.defaultJoOperationsApproverId ||
        !salesSettings?.defaultJoAccountApproverId ||
        !salesSettings?.defaultJoGeneralApproverId
          ? "Default approvers not fully configured. Please assign them in Sales Settings."
          : undefined,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sales/quotes/[id]/job-order]", err);
    return NextResponse.json({ error: "Failed to create Job Order. Please try again." }, { status: 500 });
  }
}
