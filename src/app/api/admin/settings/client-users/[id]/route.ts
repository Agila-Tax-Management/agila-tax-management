// src/app/api/admin/settings/client-users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { updateTag } from "next/cache";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  clientIds: z
    .array(z.number().int().positive())
    .min(1, "At least one client must be assigned"),
});

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

/** Shared include for client user + assignments */
const CLIENT_USER_INCLUDE = {
  assignments: {
    include: {
      client: {
        select: {
          id: true,
          clientNo: true,
          businessName: true,
          companyCode: true,
          portalName: true,
          active: true,
        },
      },
    },
  },
} as const;

function mapUser(u: {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignments: Array<{
    role: string;
    client: {
      id: number;
      clientNo: string | null;
      businessName: string | null;
      companyCode: string | null;
      portalName: string | null;
      active: boolean;
    };
  }>;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    active: u.active,
    status: u.status,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    assignments: u.assignments.map((a) => ({
      clientId: a.client.id,
      clientNo: a.client.clientNo,
      businessName: a.client.businessName,
      companyCode: a.client.companyCode,
      portalName: a.client.portalName,
      active: a.client.active,
      role: a.role,
    })),
  };
}

/**
 * PUT /api/admin/settings/client-users/[id]
 * Full update: name, email, optional password, status, and client assignments.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const existing = await prisma.clientUser.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Client user not found" }, { status: 404 });
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

  const { name, email, password, status, clientIds } = parsed.data;

  // Check email uniqueness (excluding current record)
  if (email !== existing.email) {
    const emailTaken = await prisma.clientUser.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json(
        { error: "A client user with this email already exists" },
        { status: 409 }
      );
    }
  }

  // Update password if provided
  if (password) {
    const hashedPassword = await hashPassword(password);
    const credentialAccount = await prisma.clientAccount.findFirst({
      where: { userId: id, providerId: "credential" },
    });
    if (credentialAccount) {
      await prisma.clientAccount.update({
        where: { id: credentialAccount.id },
        data: { password: hashedPassword },
      });
    }
  }

  // Replace all assignments atomically (always OWNER for this management page)
  await prisma.clientUserAssignment.deleteMany({ where: { clientUserId: id } });

  const updated = await prisma.clientUser.update({
    where: { id },
    data: {
      name,
      email,
      active: status === "ACTIVE",
      status,
      assignments: {
        create: clientIds.map((clientId) => ({ clientId, role: "OWNER" as const })),
      },
    },
    include: CLIENT_USER_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "ClientUser",
    entityId: id,
    description: `Updated client portal user ${name} (${email})`,
    metadata: {
      before: { name: existing.name, email: existing.email, status: existing.status },
      after: { name, email, status },
    },
    ...getRequestMeta(request),
  });

  updateTag("admin-client-users-list");

  return NextResponse.json({ data: mapUser(updated) });
}

/**
 * PATCH /api/admin/settings/client-users/[id]
 * Quick status update only.
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

  const { id } = await context.params;

  const existing = await prisma.clientUser.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Client user not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  const updated = await prisma.clientUser.update({
    where: { id },
    data: { status, active: status === "ACTIVE" },
  });

  void logActivity({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entity: "ClientUser",
    entityId: id,
    description: `Changed client portal user ${existing.email} status to ${status}`,
    metadata: { before: existing.status, after: status },
    ...getRequestMeta(request),
  });

  updateTag("admin-client-users-list");

  return NextResponse.json({ data: { id: updated.id, status: updated.status, active: updated.active } });
}

/**
 * DELETE /api/admin/settings/client-users/[id]
 * Deletes a client portal user (cascades to accounts, sessions, assignments).
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

  const { id } = await context.params;

  const existing = await prisma.clientUser.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Client user not found" }, { status: 404 });
  }

  await prisma.clientUser.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "ClientUser",
    entityId: id,
    description: `Deleted client portal user ${existing.email}`,
    ...getRequestMeta(request),
  });

  updateTag("admin-client-users-list");

  return NextResponse.json({ data: { id } });
}