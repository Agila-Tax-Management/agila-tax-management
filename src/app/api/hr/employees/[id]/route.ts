// src/app/api/hr/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateEmployeeSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hr/employees/[id]
 * Returns full employee profile including gov IDs, employments, contracts, access.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const employee = await prisma.employee.findFirst({
    where: { id: empId, softDelete: false },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, active: true } },
      governmentIds: true,
      requirements: true,
      appAccess: {
        include: { app: { select: { name: true, label: true } } },
      },
      employments: {
        orderBy: { createdAt: "desc" },
        include: {
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
          team: { select: { id: true, name: true } },
          employeeLevel: { select: { id: true, name: true, position: true } },
          reportingManager: { select: { id: true, firstName: true, lastName: true } },
          contracts: {
            orderBy: { createdAt: "desc" },
            include: { schedule: { include: { days: true } } },
          },
        },
      },
    },
  });

  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  return NextResponse.json({ data: employee });
}

/**
 * PATCH /api/hr/employees/[id]
 * Updates employee identity fields. Employee number uniqueness is enforced.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.employee.findFirst({ where: { id: empId, softDelete: false } });
  if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  // Unique employee number check (exclude self)
  if (parsed.data.employeeNo && parsed.data.employeeNo !== existing.employeeNo) {
    const noConflict = await prisma.employee.findUnique({
      where: { employeeNo: parsed.data.employeeNo },
    });
    if (noConflict && noConflict.id !== empId) {
      return NextResponse.json({ error: "Employee number is already in use" }, { status: 409 });
    }
  }

  // User link validation
  if (parsed.data.userId && parsed.data.userId !== existing.userId) {
    const alreadyLinked = await prisma.employee.findFirst({
      where: { userId: parsed.data.userId, id: { not: empId } },
    });
    if (alreadyLinked) {
      return NextResponse.json({ error: "This user is already linked to another employee" }, { status: 409 });
    }
  }

  const updated = await prisma.employee.update({
    where: { id: empId },
    data: {
      firstName: parsed.data.firstName,
      middleName: parsed.data.middleName,
      lastName: parsed.data.lastName,
      nameExtension: parsed.data.nameExtension,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : undefined,
      placeOfBirth: parsed.data.placeOfBirth,
      gender: parsed.data.gender,
      civilStatus: parsed.data.civilStatus,
      phone: parsed.data.phone,
      personalEmail: parsed.data.personalEmail,
      address: parsed.data.address,
      email: parsed.data.email,
      employeeNo: parsed.data.employeeNo,
      userId: parsed.data.userId,
      active: parsed.data.active,
      educationalBackground: parsed.data.educationalBackground,
      school: parsed.data.school,
      course: parsed.data.course,
      yearGraduated: parsed.data.yearGraduated,
      certifications: parsed.data.certifications,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Employee",
    entityId: String(empId),
    description: `Updated employee ${updated.firstName} ${updated.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/employees/[id]
 * Soft-deletes the employee (sets softDelete = true, active = false).
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

  const existing = await prisma.employee.findFirst({ where: { id: empId, softDelete: false } });
  if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  await prisma.employee.update({
    where: { id: empId },
    data: { softDelete: true, active: false },
  });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Employee",
    entityId: String(empId),
    description: `Soft-deleted employee ${existing.firstName} ${existing.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: empId } });
}
