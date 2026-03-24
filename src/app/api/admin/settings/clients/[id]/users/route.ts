// src/app/api/admin/settings/clients/[id]/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["OWNER", "ADMIN", "EMPLOYEE", "VIEWER"]).default("OWNER"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
});

/**
 * GET /api/admin/settings/clients/[id]/users
 * Returns all users assigned to this specific client.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const clientExists = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!clientExists) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const assignments = await prisma.clientUserAssignment.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    include: {
      clientUser: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          active: true,
          createdAt: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employments: {
                where: { clientId, employmentStatus: "ACTIVE" },
                select: {
                  id: true,
                  employmentType: true,
                  department: { select: { id: true, name: true } },
                  position: { select: { id: true, title: true } },
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const users = assignments.map((a) => ({
    id: a.clientUser.id,
    name: a.clientUser.name,
    email: a.clientUser.email,
    status: a.clientUser.status,
    active: a.clientUser.active,
    role: a.role,
    createdAt: a.clientUser.createdAt.toISOString(),
    employee: a.clientUser.employee
      ? {
          id: a.clientUser.employee.id,
          firstName: a.clientUser.employee.firstName,
          lastName: a.clientUser.employee.lastName,
          employment: a.clientUser.employee.employments[0] ?? null,
        }
      : null,
  }));

  return NextResponse.json({ data: users });
}

/**
 * POST /api/admin/settings/clients/[id]/users
 * Creates a new ClientUser and assigns them to this client.
 * If a ClientUser with the same email already exists, creates only the assignment.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
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

  const { name, email, password, role, status } = parsed.data;

  // If ClientUser already exists for this email, just create the assignment
  const existingUser = await prisma.clientUser.findUnique({ where: { email } });
  if (existingUser) {
    const existingAssignment = await prisma.clientUserAssignment.findUnique({
      where: { clientUserId_clientId: { clientUserId: existingUser.id, clientId } },
    });
    if (existingAssignment) {
      return NextResponse.json(
        { error: "This user is already assigned to this client" },
        { status: 409 }
      );
    }

    const assignment = await prisma.clientUserAssignment.create({
      data: { clientUserId: existingUser.id, clientId, role },
    });

    void logActivity({
      userId: session.user.id,
      action: "ASSIGNED",
      entity: "ClientUser",
      entityId: existingUser.id,
      description: `Assigned existing user ${email} to client ${client.businessName ?? clientId} with role ${role}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json(
      {
        data: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          status: existingUser.status,
          active: existingUser.active,
          role: assignment.role,
          createdAt: existingUser.createdAt.toISOString(),
          employee: null,
        },
      },
      { status: 201 }
    );
  }

  // Create new ClientUser + assignment
  const hashedPassword = await hashPassword(password);
  const newUser = await prisma.clientUser.create({
    data: {
      name,
      email,
      active: status === "ACTIVE",
      status,
      emailVerified: false,
      accounts: {
        create: {
          id: `credential-cu-${crypto.randomUUID()}`,
          accountId: email,
          providerId: "credential",
          password: hashedPassword,
        },
      },
      assignments: {
        create: { clientId, role },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      active: true,
      createdAt: true,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "ClientUser",
    entityId: newUser.id,
    description: `Created portal user ${name} (${email}) for client ${client.businessName ?? clientId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json(
    {
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
        active: newUser.active,
        role,
        createdAt: newUser.createdAt.toISOString(),
        employee: null,
      },
    },
    { status: 201 }
  );
}
