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
 * GET /api/admin/settings/client-users
 * Returns client portal users. Pass ?role=OWNER to filter to owners only.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = request.nextUrl.searchParams.get("role");

  const users = await prisma.clientUser.findMany({
    where: role
      ? { assignments: { some: { role: role as "OWNER" | "ADMIN" | "EMPLOYEE" | "VIEWER" } } }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: CLIENT_USER_INCLUDE,
  });

  return NextResponse.json({ data: users.map(mapUser) });
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
        create: clientIds.map((clientId) => ({ clientId, role: "OWNER" as const })),
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

  return NextResponse.json({ data: mapUser(clientUser) }, { status: 201 });
}
