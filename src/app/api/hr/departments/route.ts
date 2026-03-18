// src/app/api/hr/departments/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createDepartmentSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { getClientIdFromSession } from "@/lib/session";

/**
 * GET /api/hr/departments
 * Returns departments scoped to the session user's client.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const departments = await prisma.department.findMany({
    where: { clientId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { positions: true, employments: true } },
    },
  });

  return NextResponse.json({
    data: departments.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      positionCount: d._count.positions,
      employeeCount: d._count.employments,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/hr/departments
 * Creates a new department under the ATMS client.
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

  const parsed = createDepartmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const existing = await prisma.department.findUnique({
    where: { clientId_name: { clientId, name: parsed.data.name } },
  });
  if (existing) {
    return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
  }

  const department = await prisma.department.create({
    data: {
      clientId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Department",
    entityId: String(department.id),
    description: `Created department ${department.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: department }, { status: 201 });
}
