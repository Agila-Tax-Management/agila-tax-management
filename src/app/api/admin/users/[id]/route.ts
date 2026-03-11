// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateUserSchema } from "@/lib/schemas/user-management";
import { hashPassword } from "better-auth/crypto";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { UserRecord } from "@/lib/schemas/user-management";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/users/[id]
 *
 * Returns a single user with employee profile and portal access.
 */
export async function GET(
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

  const user = await prisma.user.findUnique({
    where: { id },
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

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data: UserRecord = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    employee: user.employee
      ? {
          id: user.employee.id,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          employeeNo: user.employee.employeeNo,
        }
      : null,
    portalAccess: user.employee
      ? user.employee.appAccess.map((a) => ({
          portal: a.app.name,
          canRead: a.canRead,
          canWrite: a.canWrite,
          canEdit: a.canEdit,
          canDelete: a.canDelete,
        }))
      : [],
  };

  return NextResponse.json({ data });
}

/**
 * PUT /api/admin/users/[id]
 *
 * Updates a user's profile, password (optional), role, and
 * portal access entries.
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

  const { name, email, password, role, active, portalAccess } = parsed.data;

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

      // 2. Update password if provided
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

      // 3. Handle Employee + portal access
      if (role === "EMPLOYEE") {
        let employee = await tx.employee.findUnique({
          where: { userId: id },
        });

        if (!employee) {
          const nameParts = name.trim().split(/\s+/);
          const firstName = nameParts[0] ?? name;
          const lastName =
            nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

          employee = await tx.employee.create({
            data: {
              userId: id,
              firstName,
              lastName,
              email,
              birthDate: new Date("2000-01-01"),
              gender: "Not specified",
              phone: "",
              address: "",
            },
          });
        } else {
          // Update employee name to stay in sync
          const nameParts = name.trim().split(/\s+/);
          await tx.employee.update({
            where: { id: employee.id },
            data: {
              firstName: nameParts[0] ?? name,
              lastName:
                nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
              email,
            },
          });
        }

        // Replace portal access: delete all, then re-create
        await tx.employeeAppAccess.deleteMany({
          where: { employeeId: employee.id },
        });

        if (portalAccess && portalAccess.length > 0) {
          const apps = await tx.app.findMany({
            where: { name: { in: portalAccess.map((p) => p.portal) } },
          });
          const appMap = new Map(apps.map((a) => [a.name, a.id]));

          const accessData = portalAccess
            .filter((p) => appMap.has(p.portal))
            .map((p) => ({
              employeeId: employee!.id,
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
      } else {
        // Non-employee role — clear any existing portal access
        const employee = await tx.employee.findUnique({
          where: { userId: id },
          select: { id: true },
        });
        if (employee) {
          await tx.employeeAppAccess.deleteMany({
            where: { employeeId: employee.id },
          });
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
 * Hard-deletes the User record if the caller is SUPER_ADMIN.
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
    // Soft-delete: deactivate user
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
