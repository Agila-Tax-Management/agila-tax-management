// src/app/api/hr/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const createLinkedUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
});

/**
 * GET /api/hr/users
 * Returns users that are NOT yet linked to any employee (available for linking).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
      employee: null, // not linked to any employee
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ data: users });
}

/**
 * POST /api/hr/users
 * Creates a User + Account only (no employee record).
 * Used when HR wants to create portal access inline during employee onboarding.
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

  const parsed = createLinkedUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, role, active: true, emailVerified: false },
    });
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
    description: `Created portal user account for ${name} (${email})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}
