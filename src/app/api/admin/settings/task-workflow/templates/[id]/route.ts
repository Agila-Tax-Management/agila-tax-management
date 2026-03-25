// src/app/api/admin/settings/task-workflow/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  daysDue: z.number().int().positive().nullable().optional(),
});

/**
 * GET /api/admin/settings/task-workflow/templates/[id]
 * Returns a single template with all route steps and subtasks.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const template = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    include: {
      departmentRoutes: {
        orderBy: { routeOrder: "asc" },
        include: {
          department: { select: { id: true, name: true } },
          subtasks: { orderBy: { subtaskOrder: "asc" } },
        },
      },
      servicePlans: {
        select: { id: true, name: true, serviceRate: true, recurring: true, status: true },
      },
      serviceOneTimePlans: {
        select: { id: true, name: true, serviceRate: true, status: true },
      },
    },
  });

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  return NextResponse.json({ data: template });
}

/**
 * PATCH /api/admin/settings/task-workflow/templates/[id]
 * Updates a template's name, description, or daysDue.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.taskTemplate.findUnique({ where: { id: templateId } });
  if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const updated = await prisma.taskTemplate.update({
    where: { id: templateId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.daysDue !== undefined && { daysDue: parsed.data.daysDue }),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Updated task template "${updated.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/settings/task-workflow/templates/[id]
 * Deletes a template (cascades routes and subtasks via Prisma schema).
 * Blocks deletion if the template has active tasks referencing it.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  if (existing._count.tasks > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${existing._count.tasks} active task(s) are using this template.` },
      { status: 409 },
    );
  }

  await prisma.taskTemplate.delete({ where: { id: templateId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Deleted task template "${existing.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}
