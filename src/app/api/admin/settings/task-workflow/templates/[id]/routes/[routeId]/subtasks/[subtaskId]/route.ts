// src/app/api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/subtasks/[subtaskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string; routeId: string; subtaskId: string }>;
}

const updateSubtaskSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  daysDue: z.number().int().positive().nullable().optional(),
});

/**
 * PATCH /api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/subtasks/[subtaskId]
 * Updates a subtask's fields.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, routeId, subtaskId } = await params;
  const templateId = parseInt(id, 10);
  const routeIdInt = parseInt(routeId, 10);
  const subtaskIdInt = parseInt(subtaskId, 10);
  if (isNaN(templateId) || isNaN(routeIdInt) || isNaN(subtaskIdInt)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const subtask = await prisma.taskTemplateSubtask.findUnique({ where: { id: subtaskIdInt } });
  if (!subtask || subtask.routeId !== routeIdInt) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  const updated = await prisma.taskTemplateSubtask.update({
    where: { id: subtaskIdInt },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
      ...(parsed.data.daysDue !== undefined && { daysDue: parsed.data.daysDue }),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Updated subtask "${updated.name}" in route step #${routeIdInt}`,
    ...getRequestMeta(request),
  });

  revalidateTag('task-templates', 'max');

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/subtasks/[subtaskId]
 * Deletes a subtask and compacts remaining subtaskOrders.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, routeId, subtaskId } = await params;
  const templateId = parseInt(id, 10);
  const routeIdInt = parseInt(routeId, 10);
  const subtaskIdInt = parseInt(subtaskId, 10);
  if (isNaN(templateId) || isNaN(routeIdInt) || isNaN(subtaskIdInt)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const subtask = await prisma.taskTemplateSubtask.findUnique({ where: { id: subtaskIdInt } });
  if (!subtask || subtask.routeId !== routeIdInt) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  await prisma.taskTemplateSubtask.delete({ where: { id: subtaskIdInt } });

  // Compact remaining subtaskOrders
  const remaining = await prisma.taskTemplateSubtask.findMany({
    where: { routeId: routeIdInt },
    orderBy: { subtaskOrder: "asc" },
  });
  if (remaining.length > 0) {
    await prisma.$transaction(
      remaining.map((s, idx) =>
        prisma.taskTemplateSubtask.update({
          where: { id: s.id },
          data: { subtaskOrder: idx + 1 },
        }),
      ),
    );
  }

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Deleted subtask "${subtask.name}" from route step #${routeIdInt}`,
    ...getRequestMeta(request),
  });

  revalidateTag('task-templates', 'max');

  return NextResponse.json({ data: { success: true } });
}
