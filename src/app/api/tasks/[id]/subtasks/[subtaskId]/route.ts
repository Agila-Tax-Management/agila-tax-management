// src/app/api/tasks/[id]/subtasks/[subtaskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const postActivitySchema = z.object({
  kind: z.enum(['comment', 'change']),
  message: z.string().min(1),
});

const patchSubtaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  assignedToId: z.number().int().positive().nullable().optional(),
  statusId: z.number().int().positive().nullable().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  daysDue: z.number().int().positive().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
  order: z.number().int().min(0).optional(),
});

type Params = { params: Promise<{ id: string; subtaskId: string }> };

/**
 * POST /api/tasks/[id]/subtasks/[subtaskId]
 * Adds a comment or change entry to the subtask history.
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, subtaskId } = await params;
  const taskId = Number(id);
  const stId = Number(subtaskId);
  if (isNaN(taskId) || isNaN(stId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.taskSubtask.findUnique({
    where: { id: stId },
    select: { id: true, parentTaskId: true },
  });
  if (!existing || existing.parentTaskId !== taskId) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = postActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const entry = await prisma.taskSubtaskHistory.create({
    data: {
      subtaskId: stId,
      actorId: session.user.id,
      kind: parsed.data.kind,
      message: parsed.data.message,
    },
    select: { id: true, kind: true, message: true, createdAt: true },
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}

/**
 * PATCH /api/tasks/[id]/subtasks/[subtaskId]
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, subtaskId } = await params;
  const taskId = Number(id);
  const stId = Number(subtaskId);
  if (isNaN(taskId) || isNaN(stId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.taskSubtask.findUnique({
    where: { id: stId },
    select: {
      id: true,
      parentTaskId: true,
      name: true,
      description: true,
      assignedToId: true,
      assignedTo: { select: { firstName: true, lastName: true } },
      statusId: true,
      status: { select: { name: true, isExitStep: true } },
      dueDate: true,
    },
  });
  if (!existing || existing.parentTaskId !== taskId) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { dueDate, ...rest } = parsed.data;

  const subtask = await prisma.taskSubtask.update({
    where: { id: stId },
    data: {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
    include: {
      department: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      status: { select: { id: true, name: true, color: true, isExitStep: true } },
    },
  });

  // Auto-create history entries for each changed field (mirrors main task PATCH behaviour)
  const historyMessages: string[] = [];

  if (rest.statusId !== undefined && rest.statusId !== existing.statusId) {
    const wasCompleted = existing.status?.isExitStep ?? false;
    const isNowCompleted = subtask.status?.isExitStep ?? false;
    if (wasCompleted !== isNowCompleted) {
      historyMessages.push(isNowCompleted ? "Marked subtask as completed" : "Marked subtask as to do");
    } else {
      const oldStatus = existing.status?.name ?? "Unknown";
      const newStatus = subtask.status?.name ?? "Unknown";
      historyMessages.push(`Changed status: ${oldStatus} → ${newStatus}`);
    }
  }
  if (rest.assignedToId !== undefined && rest.assignedToId !== existing.assignedToId) {
    const oldName = existing.assignedTo
      ? `${existing.assignedTo.firstName} ${existing.assignedTo.lastName}`
      : "Unassigned";
    const newName = subtask.assignedTo
      ? `${subtask.assignedTo.firstName} ${subtask.assignedTo.lastName}`
      : "Unassigned";
    historyMessages.push(`Changed assignee: ${oldName} → ${newName}`);
  }
  if (rest.description !== undefined && rest.description !== existing.description) {
    historyMessages.push("Updated notes");
  }
  if (dueDate !== undefined) {
    const fmt = (d: Date | null) =>
      d ? d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "none";
    const oldDate = fmt(existing.dueDate);
    const newDate = fmt(dueDate ? new Date(dueDate) : null);
    if (oldDate !== newDate) {
      historyMessages.push(`Changed due date: ${oldDate} → ${newDate}`);
    }
  }

  if (historyMessages.length > 0) {
    await prisma.taskSubtaskHistory.createMany({
      data: historyMessages.map(message => ({
        subtaskId: stId,
        actorId: session.user.id,
        kind: "change",
        message,
      })),
    });
  }

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskSubtask",
    entityId: String(stId),
    description: `Updated subtask "${subtask.name}" on task #${taskId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: subtask });
}

/**
 * DELETE /api/tasks/[id]/subtasks/[subtaskId]
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, subtaskId } = await params;
  const taskId = Number(id);
  const stId = Number(subtaskId);
  if (isNaN(taskId) || isNaN(stId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.taskSubtask.findUnique({
    where: { id: stId },
    select: { id: true, parentTaskId: true, name: true },
  });
  if (!existing || existing.parentTaskId !== taskId) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  await prisma.taskSubtask.delete({ where: { id: stId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "TaskSubtask",
    entityId: String(stId),
    description: `Deleted subtask "${existing.name}" from task #${taskId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: stId } });
}
