// src/app/api/task-management/settings/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const patchSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  daysDue: z.number().int().positive().nullable().optional(),
});

const templateInclude = {
  departmentRoutes: {
    orderBy: { routeOrder: "asc" as const },
    include: {
      department: {
        select: { id: true, name: true },
        include: { statuses: { orderBy: { statusOrder: "asc" as const } } },
      },
      subtasks: { orderBy: { subtaskOrder: "asc" as const } },
    },
  },
  servicePlans: {
    select: { id: true, name: true, serviceRate: true, recurring: true, status: true },
  },
  serviceOneTimePlans: {
    select: { id: true, name: true, serviceRate: true, status: true },
  },
} as const;

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/task-management/settings/templates/[id]
 * Updates template name, description, or daysDue.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = Number(id);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });

  const existing = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    select: { name: true },
  });
  if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const template = await prisma.taskTemplate.update({
    where: { id: templateId },
    data: parsed.data,
    include: templateInclude,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Updated task template "${template.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: template });
}

/**
 * DELETE /api/task-management/settings/templates/[id]
 * Deletes a task template and its routes/subtasks (cascade).
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = Number(id);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });

  const existing = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    select: { name: true },
  });
  if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  await prisma.taskTemplate.delete({ where: { id: templateId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Deleted task template "${existing.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: templateId } });
}
