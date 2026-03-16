// src/app/api/hr/employees/[id]/employment/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createEmploymentSchema, updateEmploymentSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { EmploymentStatus } from "@/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hr/employees/[id]/employment
 * Returns all employment records for the employee.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const employments = await prisma.employeeEmployment.findMany({
    where: { employeeId: empId },
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
      team: { select: { id: true, name: true } },
      employeeLevel: { select: { id: true, name: true, position: true } },
      reportingManager: { select: { id: true, firstName: true, lastName: true } },
      client: { select: { id: true, businessName: true } },
    },
  });

  return NextResponse.json({ data: employments });
}

/**
 * POST /api/hr/employees/[id]/employment
 * Creates a new employment record for the employee.
 * Any previous ACTIVE record is set to a different status if applicable.
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

  const parsed = createEmploymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const d = parsed.data;

  const employment = await prisma.employeeEmployment.create({
    data: {
      employeeId: empId,
      clientId: d.clientId,
      departmentId: d.departmentId ?? null,
      positionId: d.positionId ?? null,
      teamId: d.teamId ?? null,
      employmentType: d.employmentType ?? null,
      employmentStatus: (d.employeeStatus as EmploymentStatus) ?? "ACTIVE",
      employeeLevelId: d.employeeLevelId ?? null,
      hireDate: d.hireDate ? new Date(d.hireDate) : null,
      regularizationDate: d.regularizationDate ? new Date(d.regularizationDate) : null,
      endDate: d.endDate ? new Date(d.endDate) : null,
      reportingManagerId: d.reportingManagerId ?? null,
    },
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "EmployeeEmployment",
    entityId: String(employment.id),
    description: `Created employment record for employee #${empId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: employment }, { status: 201 });
}

/**
 * PATCH /api/hr/employees/[id]/employment
 * Updates the most recent ACTIVE employment record.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const url = new URL(request.url);
  const employmentIdParam = url.searchParams.get("employmentId");
  const targetEmployment = employmentIdParam
    ? await prisma.employeeEmployment.findFirst({
        where: { id: parseInt(employmentIdParam, 10), employeeId: empId },
      })
    : await prisma.employeeEmployment.findFirst({
        where: { employeeId: empId, employmentStatus: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });
  if (!targetEmployment) {
    return NextResponse.json({ error: "Employment record not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateEmploymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const d = parsed.data;

  const updated = await prisma.employeeEmployment.update({
    where: { id: targetEmployment.id },
    data: {
      clientId: d.clientId,
      departmentId: d.departmentId,
      positionId: d.positionId,
      teamId: d.teamId,
      employmentType: d.employmentType ?? undefined,
      employmentStatus: d.employeeStatus ? (d.employeeStatus as EmploymentStatus) : undefined,
      employeeLevelId: d.employeeLevelId,
      hireDate: d.hireDate ? new Date(d.hireDate) : undefined,
      regularizationDate: d.regularizationDate ? new Date(d.regularizationDate) : undefined,
      endDate: d.endDate ? new Date(d.endDate) : undefined,
      reportingManagerId: d.reportingManagerId,
    },
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "EmployeeEmployment",
    entityId: String(targetEmployment.id),
    description: `Updated employment record for employee #${empId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/employees/[id]/employment?employmentId=
 * Deletes a specific employment record.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const employmentIdParam = searchParams.get("employmentId");
  const employmentId = employmentIdParam ? parseInt(employmentIdParam, 10) : NaN;
  if (isNaN(employmentId)) return NextResponse.json({ error: "employmentId query param is required" }, { status: 400 });

  const existing = await prisma.employeeEmployment.findFirst({
    where: { id: employmentId, employeeId: empId },
  });
  if (!existing) return NextResponse.json({ error: "Employment record not found for this employee" }, { status: 404 });

  await prisma.employeeEmployment.delete({ where: { id: employmentId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "EmployeeEmployment",
    entityId: String(employmentId),
    description: `Deleted employment record #${employmentId} for employee #${empId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: employmentId } });
}
