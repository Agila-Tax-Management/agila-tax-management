// src/app/api/task-management/settings/templates/[id]/routes/[routeId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const patchRouteSchema = z.object({
  daysDue: z.number().int().positive().nullable().optional(),
  routeOrder: z.number().int().min(1).optional(),
});

type Params = { params: Promise<{ id: string; routeId: string }> };

/**
 * PATCH /api/task-management/settings/templates/[id]/routes/[routeId]
 * Updates a single route's daysDue or routeOrder.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, routeId } = await params;
  const templateId = Number(id);
  const rId = Number(routeId);
  if (isNaN(templateId) || isNaN(rId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const existing = await prisma.taskTemplateRoute.findUnique({
    where: { id: rId },
    select: { id: true, templateId: true },
  });
  if (!existing || existing.templateId !== templateId) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const route = await prisma.taskTemplateRoute.update({
    where: { id: rId },
    data: parsed.data,
    include: {
      department: {
        select: { id: true, name: true },
        include: { statuses: { orderBy: { statusOrder: "asc" } } },
      },
      subtasks: { orderBy: { subtaskOrder: "asc" } },
    },
  });

  return NextResponse.json({ data: route });
}

/**
 * DELETE /api/task-management/settings/templates/[id]/routes/[routeId]
 * Removes a department route from the template.
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, routeId } = await params;
  const templateId = Number(id);
  const rId = Number(routeId);
  if (isNaN(templateId) || isNaN(rId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const existing = await prisma.taskTemplateRoute.findUnique({
    where: { id: rId },
    select: { id: true, templateId: true, department: { select: { name: true } } },
  });
  if (!existing || existing.templateId !== templateId) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  await prisma.taskTemplateRoute.delete({ where: { id: rId } });

  // Re-number remaining routes for consistency
  const remaining = await prisma.taskTemplateRoute.findMany({
    where: { templateId },
    orderBy: { routeOrder: "asc" },
    select: { id: true },
  });
  await prisma.$transaction(
    remaining.map((r, idx) =>
      prisma.taskTemplateRoute.update({
        where: { id: r.id },
        data: { routeOrder: idx + 1 },
      })
    )
  );

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Removed department "${existing.department.name}" from template #${templateId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: rId } });
}
