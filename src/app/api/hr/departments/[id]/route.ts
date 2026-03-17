// src/app/api/hr/departments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateDepartmentSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hr/departments/[id]
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deptId = parseInt(id, 10);
  if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const department = await prisma.department.findUnique({
    where: { id: deptId },
    include: {
      positions: { orderBy: { title: "asc" } },
      _count: { select: { employments: true } },
    },
  });

  if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  return NextResponse.json({ data: department });
}

/**
 * PATCH /api/hr/departments/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const deptId = parseInt(id, 10);
  if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateDepartmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.department.findUnique({ where: { id: deptId } });
  if (!existing) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const nameConflict = await prisma.department.findUnique({
      where: { clientId_name: { clientId: existing.clientId, name: parsed.data.name } },
    });
    if (nameConflict) {
      return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
    }
  }

  const updated = await prisma.department.update({
    where: { id: deptId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Department",
    entityId: String(deptId),
    description: `Updated department ${updated.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/departments/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const deptId = parseInt(id, 10);
  if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.department.findUnique({
    where: { id: deptId },
    include: { _count: { select: { employments: true, positions: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  if (existing._count.employments > 0) {
    return NextResponse.json(
      { error: "Cannot delete a department with active employees. Reassign them first." },
      { status: 409 },
    );
  }

  await prisma.department.delete({ where: { id: deptId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Department",
    entityId: String(deptId),
    description: `Deleted department ${existing.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: deptId } });
}
