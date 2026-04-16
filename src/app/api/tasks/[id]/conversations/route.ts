// src/app/api/tasks/[id]/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

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
      department: { select: { id: true, name: true } },
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

  return NextResponse.json({ data: message }, { status: 201 });
}
