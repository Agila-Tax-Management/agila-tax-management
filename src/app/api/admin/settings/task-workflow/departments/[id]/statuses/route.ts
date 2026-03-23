// src/app/api/admin/settings/task-workflow/departments/[id]/statuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const createStatusSchema = z.object({
  name: z.string().min(1, "Status name is required"),
  color: z.string().optional(),
  isEntryStep: z.boolean().optional(),
  isExitStep: z.boolean().optional(),
  daysDue: z.number().int().positive().optional(),
});

/**
 * GET /api/admin/settings/task-workflow/departments/[id]/statuses
 * Returns all statuses for a department, ordered by statusOrder.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deptId = parseInt(id, 10);
  if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const statuses = await prisma.departmentTaskStatus.findMany({
    where: { departmentId: deptId },
    orderBy: { statusOrder: "asc" },
  });

  return NextResponse.json({ data: statuses });
}

/**
 * POST /api/admin/settings/task-workflow/departments/[id]/statuses
 * Creates a new status for a department (appended at the end).
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

  const parsed = createStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const dept = await prisma.department.findUnique({ where: { id: deptId } });
  if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  const existing = await prisma.departmentTaskStatus.findUnique({
    where: { departmentId_name: { departmentId: deptId, name: parsed.data.name } },
  });
  if (existing) {
    return NextResponse.json({ error: "A status with this name already exists in this department" }, { status: 409 });
  }

  const maxOrder = await prisma.departmentTaskStatus.aggregate({
    where: { departmentId: deptId },
    _max: { statusOrder: true },
  });
  const nextOrder = (maxOrder._max.statusOrder ?? 0) + 1;

  const status = await prisma.departmentTaskStatus.create({
    data: {
      departmentId: deptId,
      name: parsed.data.name,
      color: parsed.data.color ?? null,
      isEntryStep: parsed.data.isEntryStep ?? false,
      isExitStep: parsed.data.isExitStep ?? false,
      statusOrder: nextOrder,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "DepartmentTaskStatus",
    entityId: String(status.id),
    description: `Created status "${status.name}" in department "${dept.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: status }, { status: 201 });
}
