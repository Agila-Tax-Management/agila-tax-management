// src/app/api/sales/job-orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { notify } from "@/lib/notification";

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
  client: { select: { id: true, businessName: true, companyName: true } },
  preparedBy: { select: { id: true, name: true, email: true, image: true } },
  // Assigned approvers (default from sales settings)
  assignedOperationsManager: { select: { id: true, name: true, email: true, image: true } },
  assignedAccountManager: { select: { id: true, name: true, email: true, image: true } },
  assignedExecutive: { select: { id: true, name: true, email: true, image: true } },
  // Actual approvers (who clicked the button)
  actualOperationsManager: { select: { id: true, name: true, email: true, image: true } },
  actualAccountManager: { select: { id: true, name: true, email: true, image: true } },
  actualExecutive: { select: { id: true, name: true, email: true, image: true } },
  items: {
    orderBy: { createdAt: "asc" as const },
    include: { service: { select: { id: true, name: true, billingType: true } } },
  },
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
  // Submit for approval — DRAFT → notifies Operations Manager
  z.object({ action: z.literal("submit") }),
  // Operations Manager approves (first level)
  z.object({ action: z.literal("approve_operations") }),
  // Account Manager approves (second level)
  z.object({ action: z.literal("approve_account") }),
  // Executive approves (third level) → generates tasks
  z.object({ action: z.literal("approve_executive") }),
  // Cancel at any stage
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
      leadId: true,
      clientId: true,
      preparedById: true,
      assignedOperationsManagerId: true,
      assignedAccountManagerId: true,
      assignedExecutiveId: true,
      actualOperationsManagerId: true,
      actualAccountManagerId: true,
      actualExecutiveId: true,
      dateOperationsManagerAck: true,
      dateAccountManagerAck: true,
      dateExecutiveAck: true,
      lead: { select: { id: true, firstName: true, lastName: true, businessName: true, convertedClientId: true } },
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

  // Check portal access for admin override
  const hasAdminOverride =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

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

    // Check if approvers are assigned
    if (!existing.assignedOperationsManagerId) {
      return NextResponse.json(
        { error: "Operations Manager must be assigned before submission. Please configure default approvers in Sales Settings." },
        { status: 400 },
      );
    }

    const jobOrder = await prisma.jobOrder.update({
      where: { id },
      data: { status: "PENDING_OPERATIONS_ACK" },
      include: JO_INCLUDE,
    });

    // Notify operations manager
    if (existing.assignedOperationsManagerId) {
      void notify({
        userId: existing.assignedOperationsManagerId,
        type: "TASK",
        priority: "NORMAL",
        title: "New Job Order Ready for Approval",
        message: `Job Order ${existing.jobOrderNumber} for ${
          existing.lead.businessName ?? `${existing.lead.firstName} ${existing.lead.lastName}`
        } is ready for your approval.`,
        linkUrl: `/portal/sales/job-orders/${id}`,
      });
    }

    void logActivity({
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entity: "JobOrder",
      entityId: id,
      description: `Submitted job order ${existing.jobOrderNumber} for approval`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: jobOrder });
  }

  if (action === "approve_operations") {
    // Permission check: must be assigned operations manager OR admin override
    if (
      !hasAdminOverride &&
      (!existing.assignedOperationsManagerId ||
        existing.assignedOperationsManagerId !== session.user.id)
    ) {
      return NextResponse.json(
        { error: "Only the assigned Operations Manager can approve this step" },
        { status: 403 },
      );
    }

    if (existing.status !== "PENDING_OPERATIONS_ACK") {
      return NextResponse.json(
        { error: "Job order is not awaiting Operations Manager approval" },
        { status: 409 },
      );
    }

    if (existing.actualOperationsManagerId) {
      return NextResponse.json(
        { error: "Operations Manager has already approved this job order" },
        { status: 409 },
      );
    }

    const jobOrder = await prisma.jobOrder.update({
      where: { id },
      data: {
        actualOperationsManagerId: session.user.id,
        dateOperationsManagerAck: now,
        status: "PENDING_ACCOUNT_ACK",
      },
      include: JO_INCLUDE,
    });

    // Notify account manager (next approver)
    if (existing.assignedAccountManagerId) {
      void notify({
        userId: existing.assignedAccountManagerId,
        type: "TASK",
        priority: "NORMAL",
        title: "Job Order Ready for Account Manager Approval",
        message: `Job Order ${existing.jobOrderNumber} for ${
          existing.lead.businessName ?? `${existing.lead.firstName} ${existing.lead.lastName}`
        } is ready for your approval.`,
        linkUrl: `/portal/sales/job-orders/${id}`,
      });
    }

    void logActivity({
      userId: session.user.id,
      action: "APPROVED",
      entity: "JobOrder",
      entityId: id,
      description: `Operations Manager approved job order ${existing.jobOrderNumber}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: jobOrder });
  }

  if (action === "approve_account") {
    // Permission check: must be assigned account manager OR admin override
    if (
      !hasAdminOverride &&
      (!existing.assignedAccountManagerId ||
        existing.assignedAccountManagerId !== session.user.id)
    ) {
      return NextResponse.json(
        { error: "Only the assigned Account Manager can approve this step" },
        { status: 403 },
      );
    }

    if (existing.status !== "PENDING_ACCOUNT_ACK") {
      return NextResponse.json(
        { error: "Job order is not awaiting Account Manager approval" },
        { status: 409 },
      );
    }

    if (!existing.actualOperationsManagerId) {
      return NextResponse.json(
        { error: "Operations Manager must approve first" },
        { status: 400 },
      );
    }

    if (existing.actualAccountManagerId) {
      return NextResponse.json(
        { error: "Account Manager has already approved this job order" },
        { status: 409 },
      );
    }

    const jobOrder = await prisma.jobOrder.update({
      where: { id },
      data: {
        actualAccountManagerId: session.user.id,
        dateAccountManagerAck: now,
        status: "PENDING_EXECUTIVE_ACK",
      },
      include: JO_INCLUDE,
    });

    // Notify executive (final approver)
    if (existing.assignedExecutiveId) {
      void notify({
        userId: existing.assignedExecutiveId,
        type: "TASK",
        priority: "NORMAL",
        title: "Job Order Ready for Executive Approval",
        message: `Job Order ${existing.jobOrderNumber} for ${
          existing.lead.businessName ?? `${existing.lead.firstName} ${existing.lead.lastName}`
        } is ready for your final approval.`,
        linkUrl: `/portal/sales/job-orders/${id}`,
      });
    }

    void logActivity({
      userId: session.user.id,
      action: "APPROVED",
      entity: "JobOrder",
      entityId: id,
      description: `Account Manager approved job order ${existing.jobOrderNumber}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: jobOrder });
  }

  if (action === "approve_executive") {
    // Permission check: must be assigned executive OR admin override
    if (
      !hasAdminOverride &&
      (!existing.assignedExecutiveId ||
        existing.assignedExecutiveId !== session.user.id)
    ) {
      return NextResponse.json(
        { error: "Only the assigned Executive can approve this step" },
        { status: 403 },
      );
    }

    if (existing.status !== "PENDING_EXECUTIVE_ACK") {
      return NextResponse.json(
        { error: "Job order is not awaiting Executive approval" },
        { status: 409 },
      );
    }

    if (!existing.actualAccountManagerId) {
      return NextResponse.json(
        { error: "Account Manager must approve first" },
        { status: 400 },
      );
    }

    if (existing.actualExecutiveId) {
      return NextResponse.json(
        { error: "Executive has already approved this job order" },
        { status: 409 },
      );
    }

    const jobOrder = await prisma.$transaction(async (tx) => {
      // Mark job order as APPROVED (fully approved)
      const updatedJO = await tx.jobOrder.update({
        where: { id },
        data: {
          actualExecutiveId: session.user.id,
          dateExecutiveAck: now,
          status: "APPROVED",
        },
        include: JO_INCLUDE,
      });

      // ─── Spawn tasks from linked task templates ───────────────────
      // Fetch the lead with service task templates
      const lead = await tx.lead.findUnique({
        where: { id: existing.leadId },
        include: {
          quotes: {
            where: { status: "ACCEPTED" },
            include: {
              lineItems: {
                include: {
                  service: {
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
              },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (lead) {
        const clientId = existing.clientId ?? lead.convertedClientId ?? null;
        const lineItems = lead.quotes[0]?.lineItems ?? [];

        // Deduplicate templates across all attached services
        type TplEntry = typeof lineItems[0]["service"]["taskTemplates"][0]["taskTemplate"];
        const templateMap = new Map<number, TplEntry>();
        for (const li of lineItems) {
          for (const link of li.service.taskTemplates) {
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
              newValue: `Auto-created from job order ${updatedJO.jobOrderNumber} after full approval (template: "${template.name}")`,
            },
          });
        }
      }

      return updatedJO;
    });

    // Notify preparer that job order is fully approved
    if (existing.preparedById) {
      void notify({
        userId: existing.preparedById,
        type: "TASK",
        priority: "NORMAL",
        title: "Job Order Fully Approved",
        message: `Job Order ${existing.jobOrderNumber} has been fully approved and tasks have been generated.`,
        linkUrl: `/portal/sales/job-orders/${id}`,
      });
    }

    void logActivity({
      userId: session.user.id,
      action: "APPROVED",
      entity: "JobOrder",
      entityId: id,
      description: `Executive approved job order ${existing.jobOrderNumber} — fully approved, tasks generated`,
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
