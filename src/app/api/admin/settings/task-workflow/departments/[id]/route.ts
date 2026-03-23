// src/app/api/admin/settings/task-workflow/departments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateDeptSchema = z.object({
  name: z.string().min(1, "Department name is required").max(80).optional(),
  description: z.string().nullable().optional(),
});

/**
 * PATCH /api/admin/settings/task-workflow/departments/[id]
 * Renames or updates the description of a department.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const deptId = parseInt(id, 10);
  if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const dept = await prisma.department.findUnique({ where: { id: deptId } });
  if (!dept || dept.clientId !== clientId) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateDeptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  if (parsed.data.name && parsed.data.name !== dept.name) {
    const conflict = await prisma.department.findUnique({
      where: { clientId_name: { clientId, name: parsed.data.name } },
    });
    if (conflict) {
      return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
    }
  }

  const updated = await prisma.department.update({
    where: { id: deptId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
    },
    include: { statuses: { orderBy: { statusOrder: "asc" } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Department",
    entityId: String(deptId),
    description: `Updated department "${updated.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/settings/task-workflow/departments/[id]
 * Deletes a department and all its statuses (cascaded by Prisma).
 * Blocked if the department is still linked to any workflow template routes.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const deptId = parseInt(id, 10);
  if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const dept = await prisma.department.findUnique({
    where: { id: deptId },
    include: { templateRoutes: { take: 1 } },
  });
  if (!dept || dept.clientId !== clientId) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  if (dept.templateRoutes.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete: department is used in one or more workflow templates. Remove it from those workflows first." },
      { status: 409 }
    );
  }

  await prisma.department.delete({ where: { id: deptId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Department",
    entityId: String(deptId),
    description: `Deleted department "${dept.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}
