// src/app/api/tasks/[id]/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { notifyMany } from "@/lib/notification";

const createMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/tasks/[id]/conversations
 */
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const messages = await prisma.taskConversation.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ data: messages });
}

/**
 * POST /api/tasks/[id]/conversations
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      name: true,
      assignedTo: { select: { userId: true } },
    },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const message = await prisma.taskConversation.create({
    data: {
      taskId,
      authorId: session.user.id,
      message: parsed.data.message,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  // Log a comment_added history entry
  void prisma.taskHistory.create({
    data: {
      taskId,
      actorId: session.user.id,
      changeType: "COMMENT_ADDED",
      newValue: parsed.data.message.slice(0, 200),
    },
  });

  // Notify assigned employee and task creator
  void (async () => {
    const creatorLog = await prisma.activityLog.findFirst({
      where: { entity: 'Task', entityId: String(taskId), action: 'CREATED' },
      select: { userId: true },
    });
    const recipientIds = new Set<string>();
    if (task?.assignedTo?.userId && task.assignedTo.userId !== session.user.id) {
      recipientIds.add(task.assignedTo.userId);
    }
    if (creatorLog?.userId && creatorLog.userId !== session.user.id) {
      recipientIds.add(creatorLog.userId);
    }
    if (recipientIds.size > 0) {
      void notifyMany({
        userIds: [...recipientIds],
        type: 'TASK',
        title: `New comment on "${task?.name ?? 'task'}"`,
        message: `${session.user.name}: ${parsed.data.message.slice(0, 100)}`,
        linkUrl: `/portal/task-management/tasks/${taskId}`,
      });
    }
  })();

  return NextResponse.json({ data: message }, { status: 201 });
}
