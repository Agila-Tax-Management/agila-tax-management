// src/app/api/hr/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createEmployeeSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { getClientIdFromSession } from "@/lib/session";

/**
 * GET /api/hr/employees
 * Returns all non-deleted employees linked to the session user's client.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const employees = await prisma.employee.findMany({
    where: {
      softDelete: false,
      employments: { some: { clientId, employmentStatus: "ACTIVE" } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, role: true, active: true } },
      employments: {
        where: { employmentStatus: "ACTIVE" },
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          employmentType: true,
          employmentStatus: true,
          hireDate: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
          employeeLevel: { select: { id: true, name: true, position: true } },
        },
      },
    },
  });

  const data = employees.map((e) => {
    const emp = e.employments[0] ?? null;
    return {
      id: e.id,
      employeeNo: e.employeeNo,
      firstName: e.firstName,
      middleName: e.middleName,
      lastName: e.lastName,
      fullName: [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" "),
      email: e.email,
      phone: e.phone,
      gender: e.gender,
      birthDate: e.birthDate.toISOString(),
      currentStreet: e.currentStreet ?? null,
      currentBarangay: e.currentBarangay ?? null,
      currentCity: e.currentCity ?? null,
      currentProvince: e.currentProvince ?? null,
      currentZip: e.currentZip ?? null,
      permanentStreet: e.permanentStreet ?? null,
      permanentBarangay: e.permanentBarangay ?? null,
      permanentCity: e.permanentCity ?? null,
      permanentProvince: e.permanentProvince ?? null,
      permanentZip: e.permanentZip ?? null,
      active: e.active,
      createdAt: e.createdAt.toISOString(),
      user: e.user
        ? { id: e.user.id, email: e.user.email, role: e.user.role, active: e.user.active }
        : null,
      employment: emp
        ? {
            id: emp.id,
            employmentType: emp.employmentType,
            employmentStatus: emp.employmentStatus,
            hireDate: emp.hireDate?.toISOString() ?? null,
            department: emp.department ?? null,
            position: emp.position ?? null,
            employeeLevel: emp.employeeLevel ?? null,
          }
        : null,
    };
  });

  return NextResponse.json({ data });
}

/**
 * POST /api/hr/employees
 * Creates a new employee (Step 1 — Identity only).
 * Employment, contract, schedule, and access are added via separate endpoints.
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

  const parsed = createEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const {
    firstName, middleName, lastName, nameExtension,
    birthDate, placeOfBirth, gender, civilStatus, citizenship,
    phone, personalEmail, email, employeeNo, userId,
    currentStreet, currentBarangay, currentCity, currentProvince, currentZip,
    permanentStreet, permanentBarangay, permanentCity, permanentProvince, permanentZip,
    educationalBackground, school, course, yearGraduated, certifications,
  } = parsed.data;

  // Unique employee number check
  if (employeeNo) {
    const noConflict = await prisma.employee.findUnique({ where: { employeeNo } });
    if (noConflict) {
      return NextResponse.json({ error: "Employee number is already in use" }, { status: 409 });
    }
  }

  // User link validation
  if (userId) {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const alreadyLinked = await prisma.employee.findUnique({ where: { userId } });
    if (alreadyLinked) {
      return NextResponse.json({ error: "This user is already linked to another employee" }, { status: 409 });
    }
  }

  // Auto-generate employee number if not provided
  let resolvedEmployeeNo = employeeNo ?? null;
  if (!resolvedEmployeeNo) {
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    const nextNo = (lastEmployee?.id ?? 0) + 1;
    resolvedEmployeeNo = `EMP-${String(nextNo).padStart(5, "0")}`;
    // Ensure the auto-generated number doesn't collide
    const autoConflict = await prisma.employee.findUnique({ where: { employeeNo: resolvedEmployeeNo } });
    if (autoConflict) {
      resolvedEmployeeNo = `EMP-${String(nextNo + 1).padStart(5, "0")}`;
    }
  }

  const employee = await prisma.employee.create({
    data: {
      firstName,
      middleName: middleName ?? null,
      lastName,
      nameExtension: nameExtension ?? null,
      birthDate: new Date(birthDate),
      placeOfBirth: placeOfBirth ?? null,
      gender,
      civilStatus: civilStatus ?? null,
      citizenship: citizenship ?? null,
      phone,
      personalEmail: personalEmail ?? null,
      email: email ?? null,
      employeeNo: resolvedEmployeeNo,
      userId: userId ?? null,
      currentStreet: currentStreet ?? null,
      currentBarangay: currentBarangay ?? null,
      currentCity: currentCity ?? null,
      currentProvince: currentProvince ?? null,
      currentZip: currentZip ?? null,
      permanentStreet: permanentStreet ?? null,
      permanentBarangay: permanentBarangay ?? null,
      permanentCity: permanentCity ?? null,
      permanentProvince: permanentProvince ?? null,
      permanentZip: permanentZip ?? null,
      educationalBackground: educationalBackground ?? null,
      school: school ?? null,
      course: course ?? null,
      yearGraduated: yearGraduated ?? null,
      certifications: certifications ?? null,
      active: true,
    },
  });

  // Create government IDs placeholder
  await prisma.employeeGovernmentIds.create({ data: { employeeId: employee.id } });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Employee",
    entityId: String(employee.id),
    description: `Created employee ${firstName} ${lastName} (${resolvedEmployeeNo})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: employee }, { status: 201 });
}
