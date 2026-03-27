// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { notifyMany } from "@/lib/notification";

const taskInclude = {
  client: { select: { id: true, businessName: true } },
  template: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  status: { select: { id: true, name: true, color: true } },
  assignedTo: {
    select: { id: true, firstName: true, lastName: true, employeeNo: true },
  },
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
    changeType: "STATUS_CHANGED" | "DEPARTMENT_CHANGED" | "ASSIGNEE_CHANGED" | "PRIORITY_CHANGED" | "DUE_DATE_CHANGED" | "DETAILS_UPDATED";
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

  // Notify assigned employee and task creator on important changes
  const importantTypes = ['STATUS_CHANGED', 'PRIORITY_CHANGED', 'DETAILS_UPDATED', 'ASSIGNEE_CHANGED'];
  if (historyEntries.some(e => importantTypes.includes(e.changeType))) {
    void (async () => {
      const [creatorLog, assigneeEmployee] = await Promise.all([
        prisma.activityLog.findFirst({
          where: { entity: 'Task', entityId: String(taskId), action: 'CREATED' },
          select: { userId: true },
        }),
        updated.assignedToId
          ? prisma.employee.findUnique({ where: { id: updated.assignedToId }, select: { userId: true } })
          : Promise.resolve(null),
      ]);

      const recipientIds = new Set<string>();
      if (creatorLog?.userId && creatorLog.userId !== session.user.id) recipientIds.add(creatorLog.userId);
      if (assigneeEmployee?.userId && assigneeEmployee.userId !== session.user.id) recipientIds.add(assigneeEmployee.userId);
      if (recipientIds.size === 0) return;

      const statusEntry = historyEntries.find(e => e.changeType === 'STATUS_CHANGED');
      const priorityEntry = historyEntries.find(e => e.changeType === 'PRIORITY_CHANGED');
      const nameEntry = historyEntries.find(e => e.changeType === 'DETAILS_UPDATED' && e.oldValue);
      const assigneeEntry = historyEntries.find(e => e.changeType === 'ASSIGNEE_CHANGED');

      let title = `Task updated: "${updated.name}"`;
      let message = 'A task has been updated.';
      if (statusEntry) {
        title = `Status changed on "${updated.name}"`;
        message = `Status: "${statusEntry.oldValue ?? '—'}" → "${statusEntry.newValue ?? '—'}"`;
      } else if (priorityEntry) {
        title = `Priority changed on "${updated.name}"`;
        message = `Priority: "${priorityEntry.oldValue ?? '—'}" → "${priorityEntry.newValue ?? '—'}"`;
      } else if (nameEntry) {
        title = 'Task renamed';
        message = `"${nameEntry.oldValue}" was renamed to "${nameEntry.newValue}"`;
      } else if (assigneeEntry) {
        title = `Assignee changed on "${updated.name}"`;
        message = `Assignee changed to "${assigneeEntry.newValue ?? 'Unassigned'}"`;
      }

      void notifyMany({
        userIds: [...recipientIds],
        type: 'TASK',
        title,
        message,
        linkUrl: `/portal/task-management/tasks/${taskId}`,
      });
    })();
  }

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

  return NextResponse.json({ data: { id: taskId } });
}
