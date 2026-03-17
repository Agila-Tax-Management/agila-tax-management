// src/app/api/hr/positions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createPositionSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

/**
 * GET /api/hr/positions?departmentId=
 * Returns all positions, optionally filtered by departmentId.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const departmentIdParam = searchParams.get("departmentId");
  const departmentId = departmentIdParam ? parseInt(departmentIdParam, 10) : undefined;

  const positions = await prisma.position.findMany({
    where: departmentId ? { departmentId } : undefined,
    orderBy: { title: "asc" },
    include: {
      department: { select: { id: true, name: true } },
      _count: { select: { employments: true } },
    },
  });

  return NextResponse.json({
    data: positions.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      departmentId: p.departmentId,
      departmentName: p.department.name,
      employeeCount: p._count.employments,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/hr/positions
 * Creates a new position under a given department.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createPositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const dept = await prisma.department.findUnique({ where: { id: parsed.data.departmentId } });
  if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  const position = await prisma.position.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      departmentId: parsed.data.departmentId,
    },
    include: { department: { select: { name: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Position",
    entityId: String(position.id),
    description: `Created position ${position.title} in ${position.department.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: position }, { status: 201 });
}
