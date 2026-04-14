// src/app/api/sales/job-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const JO_INCLUDE = {
  lead: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      businessName: true,
      contactNumber: true,
      businessType: true,
    },
  },
  client: { select: { id: true, businessName: true } },
  preparedBy: { select: { id: true, name: true } },
  assignedAccountManager: { select: { id: true, name: true } },
  actualAccountManager: { select: { id: true, name: true } },
  assignedOperationsManager: { select: { id: true, name: true } },
  actualOperationsManager: { select: { id: true, name: true } },
  assignedExecutive: { select: { id: true, name: true } },
  actualExecutive: { select: { id: true, name: true } },
  items: { orderBy: { createdAt: "asc" as const } },
} as const;

const jobOrderItemSchema = z.object({
  itemType: z.enum(["SUBSCRIPTION", "ONE_TIME"]),
  serviceName: z.string().min(1, "Service name is required"),
  rate: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  remarks: z.string().optional().nullable(),
});

const createJobOrderSchema = z.object({
  leadId: z.number().int().positive("Lead is required"),
  clientId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(jobOrderItemSchema).default([]),
});

/**
 * GET /api/sales/job-orders
 * Returns all job orders with relations.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobOrders = await prisma.jobOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: JO_INCLUDE,
  });

  return NextResponse.json({ data: jobOrders });
}

/**
 * POST /api/sales/job-orders
 * Creates a new job order with an auto-generated JO number (JO-YYYY-NNN).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { items, leadId, clientId, notes } = parsed.data;

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const jobOrder = await prisma.$transaction(async (tx) => {
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
    const jobOrderNumber = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    return tx.jobOrder.create({
      data: {
        jobOrderNumber,
        leadId,
        clientId: clientId ?? null,
        notes: notes ?? null,
        preparedById: session.user.id,
        datePrepared: new Date(),
        items:
          items.length > 0
            ? {
                create: items.map((item) => ({
                  itemType: item.itemType,
                  serviceName: item.serviceName,
                  rate: item.rate,
                  discount: item.discount,
                  total: item.total,
                  remarks: item.remarks ?? null,
                })),
              }
            : undefined,
      },
      include: JO_INCLUDE,
    });
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "JobOrder",
    entityId: jobOrder.id,
    description: `Created job order ${jobOrder.jobOrderNumber}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: jobOrder }, { status: 201 });
}
