// src/app/api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/subtasks/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string; routeId: string }>;
}

const reorderSchema = z.object({
  orders: z
    .array(
      z.object({
        subtaskId: z.number().int().positive(),
        subtaskOrder: z.number().int().positive(),
      }),
    )
    .min(1),
});

/**
 * PATCH /api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/subtasks/reorder
 * Bulk-updates subtaskOrder for all subtasks in a route step.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, routeId } = await params;
  const templateId = parseInt(id, 10);
  const routeIdInt = parseInt(routeId, 10);
  if (isNaN(templateId) || isNaN(routeIdInt)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.orders.map(({ subtaskId, subtaskOrder }) =>
      prisma.taskTemplateSubtask.update({
        where: { id: subtaskId },
        data: { subtaskOrder },
      }),
    ),
  );

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Reordered subtasks for route step #${routeIdInt} in template #${templateId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}
