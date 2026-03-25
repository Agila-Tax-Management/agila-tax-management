// src/app/api/task-management/settings/templates/[id]/routes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const addRouteSchema = z.object({
  departmentId: z.number().int().positive("Department ID is required"),
  daysDue: z.number().int().positive().optional(),
});

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/task-management/settings/templates/[id]/routes
 * Adds a department to the template's workflow route (appended at end).
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = Number(id);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });

  const template = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    select: { id: true },
  });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  // Check department exists
  const dept = await prisma.department.findUnique({
    where: { id: parsed.data.departmentId },
    select: { id: true, name: true },
  });
  if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  // Prevent duplicate department in same template
  const dupCheck = await prisma.taskTemplateRoute.findUnique({
    where: {
      templateId_departmentId: {
        templateId,
        departmentId: parsed.data.departmentId,
      },
    },
  });
  if (dupCheck) {
    return NextResponse.json(
      { error: "This department is already in the workflow" },
      { status: 409 }
    );
  }

  // Determine next routeOrder
  const lastRoute = await prisma.taskTemplateRoute.findFirst({
    where: { templateId },
    orderBy: { routeOrder: "desc" },
    select: { routeOrder: true },
  });
  const nextOrder = (lastRoute?.routeOrder ?? 0) + 1;

  const route = await prisma.taskTemplateRoute.create({
    data: {
      templateId,
      departmentId: parsed.data.departmentId,
      routeOrder: nextOrder,
      daysDue: parsed.data.daysDue ?? null,
    },
    include: {
      department: {
        select: { id: true, name: true },
        include: { statuses: { orderBy: { statusOrder: "asc" } } },
      },
      subtasks: { orderBy: { subtaskOrder: "asc" } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Added department "${dept.name}" to template #${templateId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: route }, { status: 201 });
}
