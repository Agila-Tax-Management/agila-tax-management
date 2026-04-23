// src/app/api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string; routeId: string }>;
}

const updateRouteSchema = z.object({
  daysDue: z.number().int().positive().nullable(),
});

/**
 * PATCH /api/admin/settings/task-workflow/templates/[id]/routes/[routeId]
 * Updates the daysDue for a specific route step.
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

  const parsed = updateRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const route = await prisma.taskTemplateRoute.findUnique({
    where: { id: routeIdInt },
    include: { department: true },
  });
  if (!route || route.templateId !== templateId) {
    return NextResponse.json({ error: "Route step not found" }, { status: 404 });
  }

  const updated = await prisma.taskTemplateRoute.update({
    where: { id: routeIdInt },
    data: { daysDue: parsed.data.daysDue },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Updated daysDue for "${route.department.name}" step in template #${templateId}`,
    ...getRequestMeta(request),
  });

  revalidateTag('task-templates', 'max');

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/settings/task-workflow/templates/[id]/routes/[routeId]
 * Removes a department route step and compacts remaining routeOrders.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

  const route = await prisma.taskTemplateRoute.findUnique({
    where: { id: routeIdInt },
    include: { department: true, template: true },
  });
  if (!route || route.templateId !== templateId) {
    return NextResponse.json({ error: "Route step not found" }, { status: 404 });
  }

  await prisma.taskTemplateRoute.delete({ where: { id: routeIdInt } });

  // Compact remaining routeOrders
  const remaining = await prisma.taskTemplateRoute.findMany({
    where: { templateId },
    orderBy: { routeOrder: "asc" },
  });
  if (remaining.length > 0) {
    await prisma.$transaction(
      remaining.map((r, idx) =>
        prisma.taskTemplateRoute.update({
          where: { id: r.id },
          data: { routeOrder: idx + 1 },
        }),
      ),
    );
  }

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Removed department "${route.department.name}" from template "${route.template.name}"`,
    ...getRequestMeta(request),
  });

  revalidateTag('task-templates', 'max');

  return NextResponse.json({ data: { success: true } });
}
