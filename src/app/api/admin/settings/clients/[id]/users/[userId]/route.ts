// src/app/api/admin/settings/clients/[id]/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string; userId: string }> };

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["OWNER", "ADMIN", "EMPLOYEE", "VIEWER"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

/**
 * PATCH /api/admin/settings/clients/[id]/users/[userId]
 * Updates user info (name, email, optional password, status) and their role for this client.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, userId } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const [existingUser, assignment] = await Promise.all([
    prisma.clientUser.findUnique({ where: { id: userId } }),
    prisma.clientUserAssignment.findUnique({
      where: { clientUserId_clientId: { clientUserId: userId, clientId } },
    }),
  ]);

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!assignment) {
    return NextResponse.json({ error: "User is not assigned to this client" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { name, email, password, role, status } = parsed.data;

  // Email uniqueness check (excluding self)
  if (email !== existingUser.email) {
    const taken = await prisma.clientUser.findUnique({ where: { email } });
    if (taken) {
      return NextResponse.json(
        { error: "A client user with this email already exists" },
        { status: 409 }
      );
    }
  }

  // Update password if provided
  if (password) {
    const hashedPassword = await hashPassword(password);
    const credAccount = await prisma.clientAccount.findFirst({
      where: { userId, providerId: "credential" },
    });
    if (credAccount) {
      await prisma.clientAccount.update({
        where: { id: credAccount.id },
        data: { password: hashedPassword },
      });
    }
  }

  // Update user fields and assignment role in parallel
  const [updatedUser] = await Promise.all([
    prisma.clientUser.update({
      where: { id: userId },
      data: { name, email, active: status === "ACTIVE", status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        active: true,
        createdAt: true,
      },
    }),
    prisma.clientUserAssignment.update({
      where: { clientUserId_clientId: { clientUserId: userId, clientId } },
      data: { role },
    }),
  ]);

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "ClientUser",
    entityId: userId,
    description: `Updated portal user ${email} in client ${clientId}`,
    metadata: {
      before: { name: existingUser.name, email: existingUser.email, status: existingUser.status },
      after: { name, email, status, role },
    },
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      status: updatedUser.status,
      active: updatedUser.active,
      role,
      createdAt: updatedUser.createdAt.toISOString(),
      employee: null,
    },
  });
}

/**
 * DELETE /api/admin/settings/clients/[id]/users/[userId]
 * Removes the user's assignment from this client.
 * If no other assignments remain, the ClientUser account is deleted entirely.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, userId } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const [existingUser, assignment] = await Promise.all([
    prisma.clientUser.findUnique({ where: { id: userId } }),
    prisma.clientUserAssignment.findUnique({
      where: { clientUserId_clientId: { clientUserId: userId, clientId } },
    }),
  ]);

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!assignment) {
    return NextResponse.json({ error: "User is not assigned to this client" }, { status: 404 });
  }

  await prisma.clientUserAssignment.delete({
    where: { clientUserId_clientId: { clientUserId: userId, clientId } },
  });

  const remainingCount = await prisma.clientUserAssignment.count({
    where: { clientUserId: userId },
  });

  if (remainingCount === 0) {
    await prisma.clientUser.delete({ where: { id: userId } });
  }

  void logActivity({
    userId: session.user.id,
    action: "UNASSIGNED",
    entity: "ClientUser",
    entityId: userId,
    description: `Removed user ${existingUser.email} from client ${clientId}${remainingCount === 0 ? " (account deleted)" : ""}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: { userId, clientId, accountDeleted: remainingCount === 0 },
  });
}
