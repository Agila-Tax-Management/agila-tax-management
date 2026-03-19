// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { updateProfileSchema } from "@/lib/schemas/profile";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import prisma from "@/lib/db";

/**
 * GET /api/profile
 * Returns the current user's profile: user fields + linked employee + active employment.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, image: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      username: true,
      employeeNo: true,
      email: true,
      phone: true,
      address: true,
      gender: true,
      birthDate: true,
      employments: {
        where: { employmentStatus: "ACTIVE" },
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
        },
      },
    },
  });

  const employment = employee?.employments[0] ?? null;

  return NextResponse.json({
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
      employee: employee
        ? {
            id: employee.id,
            firstName: employee.firstName,
            middleName: employee.middleName,
            lastName: employee.lastName,
            username: employee.username,
            employeeNo: employee.employeeNo,
            email: employee.email,
            phone: employee.phone,
            address: employee.address,
            gender: employee.gender,
            birthDate: employee.birthDate.toISOString(),
          }
        : null,
      employment: employment
        ? {
            department: employment.department,
            position: employment.position,
          }
        : null,
    },
  });
}

/**
 * PUT /api/profile
 * Updates the current user's employee personal info and/or username.
 * Also syncs user.name when the display name changes.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }

  const {
    firstName,
    middleName,
    lastName,
    email,
    phone,
    address,
    gender,
    birthDate,
    username,
  } = parsed.data;

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!employee) {
    return NextResponse.json(
      { error: "No employee record linked to this account" },
      { status: 404 },
    );
  }

  const employeeUpdate: Record<string, unknown> = {};
  if (firstName !== undefined) employeeUpdate.firstName = firstName;
  if (middleName !== undefined) employeeUpdate.middleName = middleName;
  if (lastName !== undefined) employeeUpdate.lastName = lastName;
  if (email !== undefined) employeeUpdate.email = email;
  if (phone !== undefined) employeeUpdate.phone = phone;
  if (address !== undefined) employeeUpdate.address = address;
  if (gender !== undefined) employeeUpdate.gender = gender;
  if (birthDate !== undefined) employeeUpdate.birthDate = new Date(birthDate);
  if (username !== undefined) employeeUpdate.username = username;

  const [updatedEmployee] = await prisma.$transaction([
    prisma.employee.update({
      where: { id: employee.id },
      data: employeeUpdate,
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        username: true,
        employeeNo: true,
        email: true,
        phone: true,
        address: true,
        gender: true,
        birthDate: true,
      },
    }),
    // Keep user.name in sync with the employee's display name.
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: [
          firstName ?? employee.firstName,
          lastName ?? employee.lastName,
        ].join(" "),
      },
    }),
  ]);

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Employee",
    entityId: String(employee.id),
    description: `Updated profile for ${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      ...updatedEmployee,
      birthDate: updatedEmployee.birthDate.toISOString(),
    },
  });
}
