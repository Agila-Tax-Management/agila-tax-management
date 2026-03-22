// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createUserSchema } from "@/lib/schemas/user-management";
import { hashPassword } from "better-auth/crypto";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { UserRecord } from "@/lib/schemas/user-management";

/**
 * GET /api/admin/users
 *
 * Returns all users (excluding CLIENT role) with their employee
 * profile, employment details, and portal access entries.
 * Restricted to SUPER_ADMIN and ADMIN.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          employeeNo: true,
          phone: true,
          birthDate: true,
          gender: true,
          appAccess: {
            select: {
              canRead: true,
              canWrite: true,
              canEdit: true,
              canDelete: true,
              app: { select: { name: true } },
            },
          },
          employments: {
            where: { employmentStatus: "ACTIVE" },
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              employmentType: true,
              employmentStatus: true,
              employeeLevel: { select: { id: true, name: true, position: true } },
              hireDate: true,
              department: { select: { name: true } },
              position: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  const data: UserRecord[] = users.map((u) => {
    const emp = u.employee;
    const employment = emp?.employments?.[0] ?? null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      employee: emp
        ? {
            id: emp.id,
            firstName: emp.firstName,
            middleName: emp.middleName,
            lastName: emp.lastName,
            employeeNo: emp.employeeNo,
            phone: emp.phone,
            birthDate: emp.birthDate.toISOString(),
            gender: emp.gender,
            employment: employment
              ? {
                  department: employment.department?.name ?? null,
                  position: employment.position?.title ?? null,
                  employmentType: employment.employmentType,
                  employmentStatus: employment.employmentStatus,
                  employeeLevel: employment.employeeLevel?.name ?? null,
                  employeeLevelId: employment.employeeLevel?.id ?? null,
                  hireDate: employment.hireDate?.toISOString() ?? null,
                }
              : null,
          }
        : null,
      portalAccess: emp
        ? emp.appAccess.map((a) => ({
            portal: a.app.name,
            canRead: a.canRead,
            canWrite: a.canWrite,
            canEdit: a.canEdit,
            canDelete: a.canDelete,
          }))
        : [],
    };
  });

  return NextResponse.json({ data });
}

/**
 * POST /api/admin/users
 *
 * Creates a new User + Account (BetterAuth credential) + Employee +
 * EmployeeEmployment (linked to ATMS client) + EmployeeAppAccess.
 * All internal users are employees of the ATMS company.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const {
    name, email, password, role, active,
    firstName, middleName, lastName, phone, birthDate, gender,
    portalAccess, employeeLevelId,
  } = parsed.data;

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  // Find the ATMS client (internal company)
  const atmsClient = await prisma.client.findUnique({
    where: { companyCode: "atms" },
  });
  if (!atmsClient) {
    return NextResponse.json(
      { error: "ATMS company client not found. Please run the seed." },
      { status: 500 }
    );
  }

  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          role,
          active,
          emailVerified: false,
        },
      });

      // 2. Create credential Account (BetterAuth pattern)
      await tx.account.create({
        data: {
          id: `credential:${newUser.id}`,
          accountId: newUser.id,
          providerId: "credential",
          userId: newUser.id,
          password: hashedPassword,
        },
      });

      // 3. Generate employee number
      const lastEmployee = await tx.employee.findFirst({
        orderBy: { id: "desc" },
        select: { id: true },
      });
      const nextNo = (lastEmployee?.id ?? 0) + 1;
      const employeeNo = `EMP-${String(nextNo).padStart(5, "0")}`;

      // 4. Create Employee record linked to user
      const employee = await tx.employee.create({
        data: {
          userId: newUser.id,
          firstName,
          middleName: middleName || null,
          lastName,
          employeeNo,
          email,
          birthDate: new Date(birthDate),
          gender,
          phone,
          active: true,
        },
      });

      // 5. Create EmployeeEmployment (linked to ATMS client)
      await tx.employeeEmployment.create({
        data: {
          employeeId: employee.id,
          clientId: atmsClient.id,
          employmentType: "REGULAR",
          employmentStatus: "ACTIVE",
          employeeLevelId: employeeLevelId ?? undefined,
          hireDate: new Date(),
        },
      });

      // 6. Create EmployeeGovernmentIds placeholder
      await tx.employeeGovernmentIds.create({
        data: { employeeId: employee.id },
      });

      // 7. Create EmployeeAppAccess entries
      if (portalAccess && portalAccess.length > 0) {
        const apps = await tx.app.findMany({
          where: { name: { in: portalAccess.map((p) => p.portal) } },
        });
        const appMap = new Map(apps.map((a) => [a.name, a.id]));

        const accessData = portalAccess
          .filter((p) => appMap.has(p.portal))
          .map((p) => ({
            employeeId: employee.id,
            appId: appMap.get(p.portal)!,
            canRead: p.canRead,
            canWrite: p.canWrite,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
          }));

        if (accessData.length > 0) {
          await tx.employeeAppAccess.createMany({ data: accessData });
        }
      }

      return newUser;
    });

    void logActivity({
      userId: session.user.id,
      action: "CREATED",
      entity: "User",
      entityId: user.id,
      description: `Created user ${name} (${email}) with role ${role}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: { id: user.id } }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/admin/users] Error:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
