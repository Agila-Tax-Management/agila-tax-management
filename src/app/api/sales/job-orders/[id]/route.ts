// src/app/api/sales/job-orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type Params = { params: Promise<{ id: string }> };

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
  accountManager: { select: { id: true, name: true } },
  operationsManager: { select: { id: true, name: true } },
  executive: { select: { id: true, name: true } },
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

const patchJobOrderSchema = z.discriminatedUnion("action", [
  // Edit fields — only allowed when DRAFT
  z.object({
    action: z.literal("update"),
    leadId: z.number().int().positive().optional(),
    clientId: z.number().int().positive().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(jobOrderItemSchema).optional(),
  }),
  // Submit for review — DRAFT → SUBMITTED
  z.object({ action: z.literal("submit") }),
  // Account Manager acknowledges — must be SUBMITTED + accountManagerId null
  z.object({ action: z.literal("ack_account_manager") }),
  // Operations Manager acknowledges — must be SUBMITTED + AM acked + ops null → ACKNOWLEDGED
  z.object({ action: z.literal("ack_operations") }),
  // Executive approves — must be ACKNOWLEDGED → COMPLETED
  z.object({ action: z.literal("ack_executive") }),
  // Cancel at any stage before COMPLETED
  z.object({ action: z.literal("cancel") }),
]);

/**
 * GET /api/sales/job-orders/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const jobOrder = await prisma.jobOrder.findUnique({
    where: { id },
    include: JO_INCLUDE,
  });
  if (!jobOrder) return NextResponse.json({ error: "Job order not found" }, { status: 404 });

  return NextResponse.json({ data: jobOrder });
}

/**
 * PATCH /api/sales/job-orders/[id]
 * Handles both field edits and workflow acknowledgments.
 */
export async function PATCH(
  request: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.jobOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      jobOrderNumber: true,
      accountManagerId: true,
      operationsManagerId: true,
      executiveId: true,
      leadId: true,
      clientId: true,
    },
  });
  if (!existing) return NextResponse.json({ error: "Job order not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchJobOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { action } = parsed.data;
  const now = new Date();

  if (action === "update") {
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT job orders can be edited" },
        { status: 409 },
      );
    }

    const { items, leadId, clientId, notes } = parsed.data;

    const jobOrder = await prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.jobOrderItem.deleteMany({ where: { jobOrderId: id } });
      }

      return tx.jobOrder.update({
        where: { id },
        data: {
          ...(leadId !== undefined && { leadId }),
          ...(clientId !== undefined && { clientId: clientId ?? null }),
          ...(notes !== undefined && { notes: notes ?? null }),
          ...(items !== undefined && items.length > 0
            ? {
                items: {
                  create: items.map((item) => ({
                    itemType: item.itemType,
                    serviceName: item.serviceName,
                    rate: item.rate,
                    discount: item.discount,
                    total: item.total,
                    remarks: item.remarks ?? null,
                  })),
                },
              }
            : {}),
        },
        include: JO_INCLUDE,
      });
    });

    void logActivity({
      userId: session.user.id,
      action: "UPDATED",
      entity: "JobOrder",
      entityId: id,
      description: `Updated job order ${existing.jobOrderNumber}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: jobOrder });
  }

  if (action === "submit") {
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT job orders can be submitted" },
        { status: 409 },
      );
    }
    const jobOrder = await prisma.jobOrder.update({
      where: { id },
      data: { status: "SUBMITTED" },
      include: JO_INCLUDE,
    });
    void logActivity({
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entity: "JobOrder",
      entityId: id,
      description: `Submitted job order ${existing.jobOrderNumber} for acknowledgment`,
      ...getRequestMeta(request),
    });
    return NextResponse.json({ data: jobOrder });
  }

  if (action === "ack_account_manager") {
    if (existing.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Job order must be SUBMITTED for Account Officer acknowledgment" },
        { status: 409 },
      );
    }
    if (!existing.operationsManagerId) {
      return NextResponse.json(
        { error: "Operations Manager must acknowledge first" },
        { status: 409 },
      );
    }
    if (existing.accountManagerId) {
      return NextResponse.json(
        { error: "Account Officer has already acknowledged this job order" },
        { status: 409 },
      );
    }

    const jobOrder = await prisma.$transaction(async (tx) => {
      // ── Mark job order as ACKNOWLEDGED ──────────────────────────
      const updatedJO = await tx.jobOrder.update({
        where: { id },
        data: {
          accountManagerId: session.user.id,
          dateAccountManagerAck: now,
          status: "ACKNOWLEDGED",
        },
        include: JO_INCLUDE,
      });

      // ── Spawn tasks from linked task templates ─────────────────────
      // Fetch the lead with its service plans + one-time services +
      // their task templates (including department routes + subtasks).
      const lead = await tx.lead.findUnique({
        where: { id: existing.leadId },
        include: {
          servicePlans: {
            include: {
              taskTemplates: {
                include: {
                  taskTemplate: {
                    include: {
                      departmentRoutes: {
                        orderBy: { routeOrder: "asc" },
                        include: { subtasks: { orderBy: { subtaskOrder: "asc" } } },
                      },
                    },
                  },
                },
              },
            },
          },
          serviceOneTimePlans: {
            include: {
              taskTemplates: {
                include: {
                  taskTemplate: {
                    include: {
                      departmentRoutes: {
                        orderBy: { routeOrder: "asc" },
                        include: { subtasks: { orderBy: { subtaskOrder: "asc" } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (lead) {
        const clientId = existing.clientId ?? lead.convertedClientId ?? null;

        // Deduplicate templates across all attached services
        type TplEntry = typeof lead.servicePlans[0]["taskTemplates"][0]["taskTemplate"];
        const templateMap = new Map<number, TplEntry>();
        for (const plan of lead.servicePlans) {
          for (const link of plan.taskTemplates) {
            if (!templateMap.has(link.taskTemplate.id)) {
              templateMap.set(link.taskTemplate.id, link.taskTemplate);
            }
          }
        }
        for (const svc of lead.serviceOneTimePlans) {
          for (const link of svc.taskTemplates) {
            if (!templateMap.has(link.taskTemplate.id)) {
              templateMap.set(link.taskTemplate.id, link.taskTemplate);
            }
          }
        }

        for (const template of templateMap.values()) {
          const firstRoute = template.departmentRoutes[0] ?? null;

          const entryStatus = firstRoute
            ? await tx.departmentTaskStatus.findFirst({
                where: { departmentId: firstRoute.departmentId, isEntryStep: true },
                select: { id: true },
              })
            : null;

          const taskDueDate = template.daysDue
            ? new Date(Date.now() + template.daysDue * 24 * 60 * 60 * 1000)
            : null;

          const newTask = await tx.task.create({
            data: {
              name: template.name,
              description: template.description ?? null,
              clientId,
              templateId: template.id,
              jobOrderId: updatedJO.id,
              departmentId: firstRoute?.departmentId ?? null,
              statusId: entryStatus?.id ?? null,
              daysDue: template.daysDue ?? null,
              dueDate: taskDueDate,
            },
            select: { id: true },
          });

          const subtaskData = template.departmentRoutes.flatMap((route) =>
            route.subtasks.map((tSub) => ({
              parentTaskId: newTask.id,
              departmentId: route.departmentId,
              name: tSub.name,
              description: tSub.description ?? null,
              priority: tSub.priority,
              order: tSub.subtaskOrder,
              daysDue: tSub.daysDue ?? null,
              dueDate:
                tSub.daysDue && taskDueDate
                  ? new Date(taskDueDate.getTime() + tSub.daysDue * 24 * 60 * 60 * 1000)
                  : null,
            }))
          );

          if (subtaskData.length > 0) {
            await tx.taskSubtask.createMany({ data: subtaskData });
          }

          await tx.taskHistory.create({
            data: {
              taskId: newTask.id,
              actorId: session.user.id,
              changeType: "CREATED",
              newValue: `Auto-created from job order ${updatedJO.jobOrderNumber} on acknowledgment (template: "${template.name}")`,
            },
          });
        }
      }

      return updatedJO;
    });

    void logActivity({
      userId: session.user.id,
      action: "APPROVED",
      entity: "JobOrder",
      entityId: id,
      description: `Account Officer acknowledged job order ${existing.jobOrderNumber}`,
      ...getRequestMeta(request),
    });
    return NextResponse.json({ data: jobOrder });
  }

  if (action === "ack_operations") {
    if (existing.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Job order must be SUBMITTED for Operations Manager acknowledgment" },
        { status: 409 },
      );
    }
    if (existing.operationsManagerId) {
      return NextResponse.json(
        { error: "Operations Manager has already acknowledged this job order" },
        { status: 409 },
      );
    }
    const jobOrder = await prisma.jobOrder.update({
      where: { id },
      data: {
        operationsManagerId: session.user.id,
        dateOperationsManagerAck: now,
      },
      include: JO_INCLUDE,
    });
    void logActivity({
      userId: session.user.id,
      action: "APPROVED",
      entity: "JobOrder",
      entityId: id,
      description: `Operations Manager acknowledged job order ${existing.jobOrderNumber}`,
      ...getRequestMeta(request),
    });
    return NextResponse.json({ data: jobOrder });
  }

  if (action === "ack_executive") {
    if (existing.status !== "ACKNOWLEDGED") {
      return NextResponse.json(
        { error: "Job order must be ACKNOWLEDGED for Executive approval" },
        { status: 409 },
      );
    }
    if (existing.executiveId) {
      return NextResponse.json(
        { error: "Executive has already approved this job order" },
        { status: 409 },
      );
    }
    const jobOrder = await prisma.jobOrder.update({
      where: { id },
      data: {
        executiveId: session.user.id,
        dateExecutiveAck: now,
        status: "COMPLETED",
      },
      include: JO_INCLUDE,
    });
    void logActivity({
      userId: session.user.id,
      action: "APPROVED",
      entity: "JobOrder",
      entityId: id,
      description: `Executive approved job order ${existing.jobOrderNumber}`,
      ...getRequestMeta(request),
    });
    return NextResponse.json({ data: jobOrder });
  }

  if (action === "cancel") {
    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot cancel a completed or already cancelled job order" },
        { status: 409 },
      );
    }
    const jobOrder = await prisma.jobOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: JO_INCLUDE,
    });
    void logActivity({
      userId: session.user.id,
      action: "CANCELLED",
      entity: "JobOrder",
      entityId: id,
      description: `Cancelled job order ${existing.jobOrderNumber}`,
      ...getRequestMeta(request),
    });
    return NextResponse.json({ data: jobOrder });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

/**
 * DELETE /api/sales/job-orders/[id]
 * Only DRAFT job orders can be deleted.
 */
export async function DELETE(
  request: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.jobOrder.findUnique({
    where: { id },
    select: { id: true, status: true, jobOrderNumber: true },
  });
  if (!existing) return NextResponse.json({ error: "Job order not found" }, { status: 404 });

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT job orders can be deleted" },
      { status: 409 },
    );
  }

  await prisma.jobOrder.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "JobOrder",
    entityId: id,
    description: `Deleted job order ${existing.jobOrderNumber}`,
    ...getRequestMeta(request),
  });

  return new NextResponse(null, { status: 204 });
}
