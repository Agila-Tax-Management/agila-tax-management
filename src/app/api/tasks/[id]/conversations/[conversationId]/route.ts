// src/app/api/tasks/[id]/conversations/[conversationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

const updateMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

type Params = { params: Promise<{ id: string; conversationId: string }> };

/**
 * PATCH /api/tasks/[id]/conversations/[conversationId]
 * Update a comment - only the author can edit their own comment
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, conversationId } = await params;
  const taskId = Number(id);
  const convId = Number(conversationId);

  if (isNaN(taskId) || isNaN(convId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Find the conversation
  const conversation = await prisma.taskConversation.findUnique({
    where: { id: convId },
    select: { id: true, taskId: true, authorId: true, message: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (conversation.taskId !== taskId) {
    return NextResponse.json({ error: "Comment does not belong to this task" }, { status: 400 });
  }

  // Authorization: Only the author can edit their own comment
  if (conversation.authorId !== session.user.id) {
    return NextResponse.json({ error: "You can only edit your own comments" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  // Update the comment
  const updated = await prisma.taskConversation.update({
    where: { id: convId },
    data: { message: parsed.data.message },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  // Log the edit in task history
  void prisma.taskHistory.create({
    data: {
      taskId,
      actorId: session.user.id,
      changeType: "COMMENT_EDITED",
      oldValue: conversation.message.slice(0, 200),
      newValue: parsed.data.message.slice(0, 200),
    },
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/tasks/[id]/conversations/[conversationId]
 * Delete a comment - only the author can delete their own comment
 */
export async function DELETE(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, conversationId } = await params;
  const taskId = Number(id);
  const convId = Number(conversationId);

  if (isNaN(taskId) || isNaN(convId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Find the conversation
  const conversation = await prisma.taskConversation.findUnique({
    where: { id: convId },
    select: { id: true, taskId: true, authorId: true, message: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (conversation.taskId !== taskId) {
    return NextResponse.json({ error: "Comment does not belong to this task" }, { status: 400 });
  }

  // Authorization: Only the author can delete their own comment
  if (conversation.authorId !== session.user.id) {
    return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 });
  }

  // Delete the comment
  await prisma.taskConversation.delete({
    where: { id: convId },
  });

  // Log the deletion in task history
  void prisma.taskHistory.create({
    data: {
      taskId,
      actorId: session.user.id,
      changeType: "COMMENT_DELETED",
      oldValue: conversation.message.slice(0, 200),
    },
  });

  return NextResponse.json({ success: true });
}
