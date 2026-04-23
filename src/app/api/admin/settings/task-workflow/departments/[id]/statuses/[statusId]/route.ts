// src/app/api/admin/settings/task-workflow/departments/[id]/statuses/[statusId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string; statusId: string }>;
}

const updateStatusSchema = z.object({
  name: z.string().min(1, "Status name is required").optional(),
  color: z.string().nullable().optional(),
  isEntryStep: z.boolean().optional(),
  isExitStep: z.boolean().optional(),
});

/**
 * PATCH /api/admin/settings/task-workflow/departments/[id]/statuses/[statusId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, statusId } = await params;
  const deptId = parseInt(id, 10);
  const statusIdInt = parseInt(statusId, 10);
  if (isNaN(deptId) || isNaN(statusIdInt)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.departmentTaskStatus.findUnique({ where: { id: statusIdInt } });
  if (!existing || existing.departmentId !== deptId) {
    return NextResponse.json({ error: "Status not found" }, { status: 404 });
  }

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const nameConflict = await prisma.departmentTaskStatus.findUnique({
      where: { departmentId_name: { departmentId: deptId, name: parsed.data.name } },
    });
    if (nameConflict) {
      return NextResponse.json({ error: "A status with this name already exists in this department" }, { status: 409 });
    }
  }

  const updated = await prisma.departmentTaskStatus.update({
    where: { id: statusIdInt },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      ...(parsed.data.isEntryStep !== undefined && { isEntryStep: parsed.data.isEntryStep }),
      ...(parsed.data.isExitStep !== undefined && { isExitStep: parsed.data.isExitStep }),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "DepartmentTaskStatus",
    entityId: String(statusIdInt),
    description: `Updated status "${updated.name}" in department #${deptId}`,
    ...getRequestMeta(request),
  });

  revalidateTag('task-departments', 'max');

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/settings/task-workflow/departments/[id]/statuses/[statusId]
 * Deletes a status and compacts remaining statusOrders.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, statusId } = await params;
  const deptId = parseInt(id, 10);
  const statusIdInt = parseInt(statusId, 10);
  if (isNaN(deptId) || isNaN(statusIdInt)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const existing = await prisma.departmentTaskStatus.findUnique({ where: { id: statusIdInt } });
  if (!existing || existing.departmentId !== deptId) {
    return NextResponse.json({ error: "Status not found" }, { status: 404 });
  }

  await prisma.departmentTaskStatus.delete({ where: { id: statusIdInt } });

  // Compact remaining statusOrders
  const remaining = await prisma.departmentTaskStatus.findMany({
    where: { departmentId: deptId },
    orderBy: { statusOrder: "asc" },
  });
  await prisma.$transaction(
    remaining.map((s, idx) =>
      prisma.departmentTaskStatus.update({
        where: { id: s.id },
        data: { statusOrder: idx + 1 },
      })
    )
  );

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "DepartmentTaskStatus",
    entityId: String(statusIdInt),
    description: `Deleted status "${existing.name}" from department #${deptId}`,
    ...getRequestMeta(request),
  });

  revalidateTag('task-departments', 'max');

  return NextResponse.json({ data: { success: true } });
}
