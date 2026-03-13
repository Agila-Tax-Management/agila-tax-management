// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateUserSchema } from "@/lib/schemas/user-management";
import { hashPassword } from "better-auth/crypto";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { UserRecord } from "@/lib/schemas/user-management";

type RouteContext = { params: Promise<{ id: string }> };

/** Shared include shape for user + employee + employment + access */
const USER_INCLUDE = {
  employee: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      employeeNo: true,
      phone: true,
      address: true,
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
        where: { employmentStatus: "ACTIVE" as const },
        take: 1,
        orderBy: { createdAt: "desc" as const },
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
} as const;

/** Maps raw DB user to API UserRecord shape */
function toUserRecord(u: {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: number;
    firstName: string;
    middleName: string | null;
    lastName: string;
    employeeNo: string | null;
    phone: string;
    address: string;
    birthDate: Date;
    gender: string;
    appAccess: {
      canRead: boolean;
      canWrite: boolean;
      canEdit: boolean;
      canDelete: boolean;
      app: { name: string };
    }[];
    employments: {
      employmentType: string | null;
      employmentStatus: string;
      employeeLevel: { id: number; name: string; position: number } | null;
      hireDate: Date | null;
      department: { name: string } | null;
      position: { title: string } | null;
    }[];
  } | null;
}): UserRecord {
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
          address: emp.address,
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
}

/**
 * GET /api/admin/users/[id]
 *
 * Returns a single user with employee profile, employment, and portal access.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: USER_INCLUDE,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ data: toUserRecord(user) });
}

/**
 * PUT /api/admin/users/[id]
 *
 * Updates a user's profile, employee details, password (optional),
 * role, and portal access entries.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const {
    name, email, password, role, active,
    firstName, middleName, lastName, phone, address, birthDate, gender,
    portalAccess, employeeLevelId,
  } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check email uniqueness (excluding current user)
  if (email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update User record
      await tx.user.update({
        where: { id },
        data: { name, email, role, active },
      });

      // 2. Update password if provided (BetterAuth credential account)
      if (password && password.length > 0) {
        const hashedPassword = await hashPassword(password);
        const account = await tx.account.findFirst({
          where: { userId: id, providerId: "credential" },
        });
        if (account) {
          await tx.account.update({
            where: { id: account.id },
            data: { password: hashedPassword },
          });
        }
      }

      // 3. Update employee profile
      const employee = await tx.employee.findUnique({
        where: { userId: id },
        select: { id: true },
      });

      if (employee) {
        await tx.employee.update({
          where: { id: employee.id },
          data: {
            firstName,
            middleName: middleName || null,
            lastName,
            email,
            phone,
            address: address || "N/A",
            birthDate: new Date(birthDate),
            gender,
          },
        });

        // Update active employment level if provided
        if (employeeLevelId !== undefined) {
          await tx.employeeEmployment.updateMany({
            where: { employeeId: employee.id, employmentStatus: "ACTIVE" },
            data: { employeeLevelId: employeeLevelId ?? null },
          });
        }

        // 4. Sync portal access
        if (portalAccess !== undefined) {
          await tx.employeeAppAccess.deleteMany({
            where: { employeeId: employee.id },
          });

          if (portalAccess.length > 0) {
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
        }
      }
    });

    void logActivity({
      userId: session.user.id,
      action: "UPDATED",
      entity: "User",
      entityId: id,
      description: `Updated user ${name} (${email})`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: { id } });
  } catch (err: unknown) {
    console.error("[PUT /api/admin/users/[id]] Error:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 *
 * Soft-deletes a user by setting active = false.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { active: false },
    });

    void logActivity({
      userId: session.user.id,
      action: "DELETED",
      entity: "User",
      entityId: id,
      description: `Deactivated user ${user.name} (${user.email})`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: { id } });
  } catch (err: unknown) {
    console.error("[DELETE /api/admin/users/[id]] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
