// src/app/api/hr/settings/employee-levels/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.number().int().positive("Position must be a positive integer"),
  description: z.string().optional(),
});

/**
 * GET /api/hr/settings/employee-levels
 * Returns all employee levels ordered by position ascending.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const levels = await prisma.employeeLevel.findMany({
    where: { clientId },
    orderBy: { position: "asc" },
    select: { id: true, name: true, position: true, description: true },
  });

  return NextResponse.json({ data: levels });
}

/**
 * POST /api/hr/settings/employee-levels
 * Creates a new employee level.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, position, description } = parsed.data;

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const existingName = await prisma.employeeLevel.findFirst({ where: { clientId, name } });
  if (existingName) {
    return NextResponse.json({ error: "Level name already exists." }, { status: 409 });
  }

  const existingPosition = await prisma.employeeLevel.findFirst({ where: { clientId, position } });
  if (existingPosition) {
    return NextResponse.json({ error: "Position number already taken." }, { status: 409 });
  }

  const level = await prisma.employeeLevel.create({
    data: { clientId, name, position, description },
    select: { id: true, name: true, position: true, description: true },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "EmployeeLevel",
    entityId: String(level.id),
    description: `Created employee level "${level.name}" at position ${level.position}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: level }, { status: 201 });
}
