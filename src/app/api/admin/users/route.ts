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
 * profile and portal access entries.
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
    where: { role: { not: "CLIENT" } },
    orderBy: { createdAt: "desc" },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
          appAccess: {
            select: {
              canRead: true,
              canWrite: true,
              canEdit: true,
              canDelete: true,
              app: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const data: UserRecord[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    employee: u.employee
      ? {
          id: u.employee.id,
          firstName: u.employee.firstName,
          lastName: u.employee.lastName,
          employeeNo: u.employee.employeeNo,
        }
      : null,
    portalAccess: u.employee
      ? u.employee.appAccess.map((a) => ({
          portal: a.app.name,
          canRead: a.canRead,
          canWrite: a.canWrite,
          canEdit: a.canEdit,
          canDelete: a.canDelete,
        }))
      : [],
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/admin/users
 *
 * Creates a new User + Account (credential).
 * If role is EMPLOYEE, also creates an Employee record and
 * EmployeeAppAccess entries for each portal in the payload.
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

  const { name, email, password, role, active } = parsed.data;

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
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

      // 2. Create credential Account
      await tx.account.create({
        data: {
          id: `credential:${newUser.id}`,
          accountId: newUser.id,
          providerId: "credential",
          userId: newUser.id,
          password: hashedPassword,
        },
      });

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
