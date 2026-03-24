// src/app/api/admin/settings/task-workflow/templates/[id]/routes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addRouteSchema = z.object({
  departmentId: z.number().int().positive(),
  daysDue: z.number().int().positive().optional(),
});

/**
 * POST /api/admin/settings/task-workflow/templates/[id]/routes
 * Adds a department to a template's route (appended at the end).
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const template = await prisma.taskTemplate.findUnique({ where: { id: templateId } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const department = await prisma.department.findUnique({ where: { id: parsed.data.departmentId } });
  if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  const existing = await prisma.taskTemplateRoute.findUnique({
    where: { templateId_departmentId: { templateId, departmentId: parsed.data.departmentId } },
  });
  if (existing) {
    return NextResponse.json({ error: "This department is already in the route" }, { status: 409 });
  }

  const maxOrder = await prisma.taskTemplateRoute.aggregate({
    where: { templateId },
    _max: { routeOrder: true },
  });
  const nextOrder = (maxOrder._max.routeOrder ?? 0) + 1;

  const route = await prisma.taskTemplateRoute.create({
    data: {
      templateId,
      departmentId: parsed.data.departmentId,
      routeOrder: nextOrder,
      daysDue: parsed.data.daysDue ?? null,
    },
    include: {
      department: { select: { id: true, name: true } },
      subtasks: { orderBy: { subtaskOrder: "asc" } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Added department "${department.name}" to template "${template.name}" at step ${nextOrder}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: route }, { status: 201 });
}
