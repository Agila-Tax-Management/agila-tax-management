// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { notifyMany } from "@/lib/notification";
import { revalidateTag } from "next/cache";

const taskInclude = {
  client: { select: { id: true, businessName: true } },
  template: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  status: { select: { id: true, name: true, color: true } },
  assignedTo: {
    select: { id: true, firstName: true, lastName: true, employeeNo: true },
  },
  jobOrder: { select: { id: true, jobOrderNumber: true } },
  subtasks: {
    orderBy: { order: "asc" as const },
    include: {
      department: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  conversations: {
    orderBy: { createdAt: "asc" as const },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  },
  historyLogs: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: {
      actor: { select: { id: true, name: true } },
    },
  },
} as const;

const patchTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  clientId: z.number().int().positive().nullable().optional(),
  templateId: z.number().int().positive().nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  statusId: z.number().int().positive().nullable().optional(),
  assignedToId: z.number().int().positive().nullable().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  daysDue: z.number().int().positive().nullable().optional(),
  jobOrderId: z.string().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/tasks/[id]
 */
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });

  const task = await prisma.task.findUnique({ where: { id: taskId }, include: taskInclude });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ data: task });
}

/**
 * PATCH /api/tasks/[id]
 * Updates any combination of task fields; auto-logs history entries.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });

  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      department: { select: { name: true } },
      status: { select: { name: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      jobOrder: { select: { jobOrderNumber: true } },
    },
  });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { dueDate, ...rest } = parsed.data;
  const updateData = {
    ...rest,
    ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
  };

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: taskInclude,
  });

  // Build history log entries for each changed field
  const PRIORITY_LABELS: Record<string, string> = {
    LOW: "Low", NORMAL: "Medium", HIGH: "High", URGENT: "Urgent",
  };

  const historyEntries: {
    taskId: number;
    actorId: string;
    changeType: "STATUS_CHANGED" | "DEPARTMENT_CHANGED" | "ASSIGNEE_CHANGED" | "PRIORITY_CHANGED" | "DUE_DATE_CHANGED" | "DETAILS_UPDATED" | "JOB_ORDER_CHANGED";
    oldValue?: string;
    newValue?: string;
  }[] = [];

  if (rest.statusId !== undefined && rest.statusId !== existing.statusId) {
    historyEntries.push({
      taskId,
      actorId: session.user.id,
      changeType: "STATUS_CHANGED",
      oldValue: existing.status?.name ?? undefined,
      newValue: updated.status?.name ?? undefined,
    });
  }
  if (rest.departmentId !== undefined && rest.departmentId !== existing.departmentId) {
    historyEntries.push({
      taskId,
      actorId: session.user.id,
      changeType: "DEPARTMENT_CHANGED",
      oldValue: existing.department?.name ?? undefined,
      newValue: updated.department?.name ?? undefined,
    });
  }
  if (rest.assignedToId !== undefined && rest.assignedToId !== existing.assignedToId) {
    const oldName = existing.assignedTo
      ? `${existing.assignedTo.firstName} ${existing.assignedTo.lastName}`
      : undefined;
    const newAssignee = updated.assignedTo;
    const newName = newAssignee
      ? `${newAssignee.firstName} ${newAssignee.lastName}`
      : undefined;
    historyEntries.push({
      taskId,
      actorId: session.user.id,
      changeType: "ASSIGNEE_CHANGED",
      oldValue: oldName,
      newValue: newName,
    });
  }
  if (rest.priority !== undefined && rest.priority !== existing.priority) {
    historyEntries.push({
      taskId,
      actorId: session.user.id,
      changeType: "PRIORITY_CHANGED",
      oldValue: PRIORITY_LABELS[existing.priority] ?? existing.priority,
      newValue: PRIORITY_LABELS[rest.priority] ?? rest.priority,
    });
  }
  if (dueDate !== undefined) {
    const oldDate = existing.dueDate
      ? new Date(existing.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
      : undefined;
    const newDate = dueDate
      ? new Date(dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
      : undefined;
    historyEntries.push({
      taskId,
      actorId: session.user.id,
      changeType: "DUE_DATE_CHANGED",
      oldValue: oldDate,
      newValue: newDate,
    });
  }
  if (rest.name !== undefined && rest.name !== existing.name) {
    historyEntries.push({
      taskId,
      actorId: session.user.id,
      changeType: "DETAILS_UPDATED",
      oldValue: existing.name,
      newValue: rest.name,
    });
  }
  if (rest.description !== undefined && rest.description !== existing.description) {
    historyEntries.push({
      taskId,
      actorId: session.user.id,
      changeType: "DETAILS_UPDATED",
      newValue: "Description updated",
    });
  }
  if (rest.jobOrderId !== undefined && rest.jobOrderId !== existing.jobOrderId) {
    historyEntries.push({
      taskId,
      actorId: session.user.id,
      changeType: "JOB_ORDER_CHANGED",
      oldValue: existing.jobOrder?.jobOrderNumber ?? undefined,
      newValue: updated.jobOrder?.jobOrderNumber ?? undefined,
    });
  }

  // Await history creation so the re-fetched logs include the new entries
  if (historyEntries.length > 0) {
    await prisma.taskHistory.createMany({ data: historyEntries });
  }

  // Re-fetch fresh history so the response includes just-created entries
  const freshHistory = await prisma.taskHistory.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { actor: { select: { id: true, name: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Task",
    entityId: String(taskId),
    description: `Updated task "${updated.name}"`,
    ...getRequestMeta(request),
  });

  // Notify relevant users on important changes
  const notifyTypes = ['STATUS_CHANGED', 'PRIORITY_CHANGED', 'DUE_DATE_CHANGED', 'ASSIGNEE_CHANGED'];
  if (historyEntries.some(e => notifyTypes.includes(e.changeType))) {
    void (async () => {
      // Determine portal URL based on department
      const deptName = updated.department?.name?.toLowerCase() ?? '';
      let portalUrl = `/portal/task-management/tasks/${taskId}`;
      
      if (deptName.includes('liaison')) {
        portalUrl = `/portal/liaison/tasks/${taskId}`;
      } else if (deptName.includes('compliance')) {
        portalUrl = `/portal/compliance/tasks/${taskId}`;
      } else if (deptName.includes('account officer') || deptName.includes('account-officer')) {
        portalUrl = `/portal/account-officer/tasks/${taskId}`;
      } else if (deptName.includes('operation')) {
        portalUrl = `/portal/operations/tasks/${taskId}`;
      }

      const statusEntry = historyEntries.find(e => e.changeType === 'STATUS_CHANGED');
      const priorityEntry = historyEntries.find(e => e.changeType === 'PRIORITY_CHANGED');
      const dueDateEntry = historyEntries.find(e => e.changeType === 'DUE_DATE_CHANGED');
      const assigneeEntry = historyEntries.find(e => e.changeType === 'ASSIGNEE_CHANGED');

      // Assignment change: Notify ONLY the new assignee
      if (assigneeEntry && updated.assignedToId) {
        const newAssignee = await prisma.employee.findUnique({
          where: { id: updated.assignedToId },
          select: { userId: true },
        });
        if (newAssignee?.userId && newAssignee.userId !== session.user.id) {
          void notifyMany({
            userIds: [newAssignee.userId],
            type: 'TASK',
            title: `You were assigned to "${updated.name}"`,
            message: `${session.user.name} assigned you to this task.`,
            linkUrl: portalUrl,
          });
        }
      }

      // Status/Priority/Due Date change: Notify current assignee
      if ((statusEntry || priorityEntry || dueDateEntry) && updated.assignedToId) {
        const currentAssignee = await prisma.employee.findUnique({
          where: { id: updated.assignedToId },
          select: { userId: true },
        });
        if (currentAssignee?.userId && currentAssignee.userId !== session.user.id) {
          let title = `Task updated: "${updated.name}"`;
          let message = 'A task has been updated.';
          
          if (statusEntry) {
            title = `Task status changed to ${statusEntry.newValue}`;
            message = `"${updated.name}" status: ${statusEntry.oldValue ?? '—'} → ${statusEntry.newValue ?? '—'}`;
          } else if (priorityEntry) {
            title = `Task priority changed to ${priorityEntry.newValue}`;
            message = `"${updated.name}" priority: ${priorityEntry.oldValue ?? '—'} → ${priorityEntry.newValue ?? '—'}`;
          } else if (dueDateEntry) {
            title = 'Task due date updated';
            message = `"${updated.name}" due date changed to ${dueDateEntry.newValue ?? '—'}`;
          }

          void notifyMany({
            userIds: [currentAssignee.userId],
            type: 'TASK',
            title,
            message,
            linkUrl: portalUrl,
          });
        }
      }
    })();
  }

  revalidateTag('tasks-list', 'max');
  revalidateTag('task-management-dashboard', 'max');
  revalidateTag('liaison-dashboard', 'max');
  revalidateTag('ao-dashboard', 'max');
  revalidateTag('operation-dashboard', 'max');

  return NextResponse.json({ data: { ...updated, historyLogs: freshHistory } });
}

/**
 * DELETE /api/tasks/[id]
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });

  const existing = await prisma.task.findUnique({ where: { id: taskId }, select: { name: true } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id: taskId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Task",
    entityId: String(taskId),
    description: `Deleted task "${existing.name}"`,
    ...getRequestMeta(request),
  });

  revalidateTag('tasks-list', 'max');
  revalidateTag('task-management-dashboard', 'max');
  revalidateTag('liaison-dashboard', 'max');
  revalidateTag('ao-dashboard', 'max');
  revalidateTag('operation-dashboard', 'max');

  return NextResponse.json({ data: { id: taskId } });
}
