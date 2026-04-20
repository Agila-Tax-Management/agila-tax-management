// src/app/api/hr/employees/[id]/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { upsertAccessSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hr/employees/[id]/access
 * Returns all portal app access entries for the employee.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const access = await prisma.employeeAppAccess.findMany({
    where: { employeeId: empId },
    include: { app: { select: { name: true, label: true } } },
  });

  return NextResponse.json({ data: access });
}

/**
 * POST /api/hr/employees/[id]/access
 * Upserts portal access entries for the employee.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const employee = await prisma.employee.findFirst({ where: { id: empId, softDelete: false } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = upsertAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const apps = await prisma.app.findMany({
    where: { name: { in: parsed.data.entries.map((e) => e.portal) } },
  });
  const appMap = new Map(apps.map((a) => [a.name, a.id]));

  await prisma.$transaction(
    parsed.data.entries.map((entry) => {
      const appId = appMap.get(entry.portal);
      if (!appId) throw new Error(`App not found: ${entry.portal}`);
      return prisma.employeeAppAccess.upsert({
        where: { employeeId_appId: { employeeId: empId, appId } },
        update: {
          role: entry.role,
        },
        create: {
          employeeId: empId,
          appId,
          role: entry.role,
        },
      });
    }),
  );

  void logActivity({
    userId: session.user.id,
    action: "PERMISSION_CHANGE",
    entity: "Employee",
    entityId: String(empId),
    description: `Updated portal access for employee #${empId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { updated: parsed.data.entries.length } });
}
