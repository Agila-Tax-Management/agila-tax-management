// src/app/api/admin/settings/client-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  clientIds: z
    .array(z.number().int().positive())
    .min(1, "At least one client must be assigned"),
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

/**
 * GET /api/admin/settings/client-users
 * Returns all client portal users with their assigned clients.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.clientUser.findMany({
    orderBy: { createdAt: "desc" },
    include: CLIENT_USER_INCLUDE,
  });

  const data = users.map((u) => ({
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
    })),
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/admin/settings/client-users
 * Creates a new client portal user with a hashed password and client assignments.
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { name, email, password, status, clientIds } = parsed.data;

  const existing = await prisma.clientUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A client user with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await hashPassword(password);

  const clientUser = await prisma.clientUser.create({
    data: {
      name,
      email,
      active: status === "ACTIVE",
      status,
      emailVerified: false,
      accounts: {
        create: {
          id: `credential-cu-${Date.now()}`,
          accountId: email,
          providerId: "credential",
          password: hashedPassword,
        },
      },
      assignments: {
        create: clientIds.map((clientId) => ({ clientId })),
      },
    },
    include: CLIENT_USER_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "ClientUser",
    entityId: clientUser.id,
    description: `Created client portal user ${name} (${email}) with ${clientIds.length} client assignment(s)`,
    ...getRequestMeta(request),
  });

  return NextResponse.json(
    {
      data: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        active: clientUser.active,
        status: clientUser.status,
        emailVerified: clientUser.emailVerified,
        createdAt: clientUser.createdAt.toISOString(),
        updatedAt: clientUser.updatedAt.toISOString(),
        assignments: clientUser.assignments.map((a) => ({
          clientId: a.client.id,
          clientNo: a.client.clientNo,
          businessName: a.client.businessName,
          companyCode: a.client.companyCode,
          portalName: a.client.portalName,
          active: a.client.active,
        })),
      },
    },
    { status: 201 }
  );
}
