// src/app/api/tasks/[id]/subtasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";

const createSubtaskSchema = z.object({
  name: z.string().min(1, "Subtask name is required"),
  description: z.string().optional(),
  departmentId: z.number().int().positive().optional(),
  assignedToId: z.number().int().positive().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  daysDue: z.number().int().positive().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  order: z.number().int().min(0).optional(),
});

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/tasks/[id]/subtasks
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, name: true } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { dueDate, ...rest } = parsed.data;

  const subtask = await prisma.taskSubtask.create({
    data: {
      parentTaskId: taskId,
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      department: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "TaskSubtask",
    entityId: String(subtask.id),
    description: `Added subtask "${subtask.name}" to task #${taskId}`,
    ...getRequestMeta(request),
  });

  revalidateTag('tasks-list', 'max');
  revalidateTag('task-management-dashboard', 'max');
  revalidateTag('liaison-dashboard', 'max');
  revalidateTag('ao-dashboard', 'max');
  revalidateTag('operation-dashboard', 'max');

  return NextResponse.json({ data: subtask }, { status: 201 });
}
