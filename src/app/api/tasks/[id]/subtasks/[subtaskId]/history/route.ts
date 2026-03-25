// src/app/api/tasks/[id]/subtasks/[subtaskId]/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

type Params = { params: Promise<{ id: string; subtaskId: string }> };

/**
 * GET /api/tasks/[id]/subtasks/[subtaskId]/history
 * Returns the activity log (comments + change entries) for a subtask.
 */
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
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

  const history = await prisma.taskSubtaskHistory.findMany({
    where: { subtaskId: stId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      kind: true,
      message: true,
      createdAt: true,
      actor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: history });
}
