// src/app/api/sales/leads/[id]/job-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { logLeadHistory } from "@/lib/lead-history";

type Params = { params: Promise<{ id: string }> };

const LEAD_INCLUDE = {
  status: { select: { id: true, name: true, color: true, sequence: true, isOnboarding: true, isConverted: true } },
  assignedAgent: { select: { id: true, name: true, email: true } },
  servicePlans: { select: { id: true, name: true, serviceRate: true, recurring: true } },
  serviceOneTimePlans: { select: { id: true, name: true, serviceRate: true } },
  promo: { select: { id: true, name: true, code: true, discountType: true, discountRate: true, promoFor: true } },
  comments: {
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  historyLogs: {
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" as const },
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

const createJobOrderSchema = z.object({
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/sales/leads/[id]/job-order
 * Creates a Job Order for the given lead.
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
      servicePlans: { select: { id: true, name: true, serviceRate: true } },
      serviceOneTimePlans: { select: { id: true, name: true, serviceRate: true } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.isAccountCreated) {
    return NextResponse.json({ error: "Account must be created before generating a job order." }, { status: 400 });
  }
  if (lead.isCreatedJobOrder) {
    return NextResponse.json({ error: "A job order has already been created for this lead." }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createJobOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  try {
    const updatedLead = await prisma.$transaction(async (tx) => {
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

      // Create the job order
      await tx.jobOrder.create({
        data: {
          jobOrderNumber,
          leadId,
          clientId: lead.convertedClientId ?? undefined,
          status: "DRAFT",
          notes: parsed.data.notes ?? null,
          preparedById: session.user.id,
          datePrepared: new Date(),
          items: {
            create: [
              ...lead.servicePlans.map((plan) => ({
                itemType: "SUBSCRIPTION" as const,
                serviceName: plan.name,
                rate: Number(plan.serviceRate),
                discount: 0,
                total: Number(plan.serviceRate),
              })),
              ...lead.serviceOneTimePlans.map((svc) => ({
                itemType: "ONE_TIME" as const,
                serviceName: svc.name,
                rate: Number(svc.serviceRate),
                discount: 0,
                total: Number(svc.serviceRate),
              })),
            ],
          },
        },
      });

      // Mark lead as job order created
      const result = await tx.lead.update({
        where: { id: leadId },
        data: { isCreatedJobOrder: true },
        include: LEAD_INCLUDE,
      });

      // Log history inside the transaction
      await tx.leadHistory.create({
        data: {
          leadId,
          actorId: session.user.id,
          changeType: "JOB_ORDER_GENERATED",
          newValue: `Job Order ${jobOrderNumber} created`,
        },
      });

      return result;
    });

    void logActivity({
      userId: session.user.id,
      action: "CREATED",
      entity: "JobOrder",
      entityId: String(leadId),
      description: `Created job order for lead #${leadId} — ${lead.firstName} ${lead.lastName}`,
      ...getRequestMeta(request),
    });

    void logLeadHistory({
      leadId,
      actorId: session.user.id,
      changeType: "JOB_ORDER_GENERATED",
      newValue: `Job order generated for ${lead.businessName ?? `${lead.firstName} ${lead.lastName}`}`,
    });

    return NextResponse.json({ data: updatedLead });
  } catch (err) {
    console.error("[POST /api/sales/leads/[id]/job-order]", err);
    return NextResponse.json({ error: "Failed to create job order. Please try again." }, { status: 500 });
  }
}
