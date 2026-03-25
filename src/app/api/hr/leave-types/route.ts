// src/app/api/hr/leave-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const createLeaveTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isPaid: z.boolean().default(true),
  defaultDays: z.number().min(0).default(0),
  carryOverLimit: z.number().min(0).default(0),
  resetMonth: z.number().int().min(1).max(12).nullable().optional(),
  resetDay: z.number().int().min(1).max(31).nullable().optional(),
});

/**
 * GET /api/hr/leave-types
 * Returns all leave types scoped to the session user's client.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const leaveTypes = await prisma.leaveType.findMany({
    where: { clientId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: leaveTypes });
}

/**
 * POST /api/hr/leave-types
 * Creates a new leave type for the client.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const body = await request.json() as unknown;
  const parsed = createLeaveTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, isPaid, defaultDays, carryOverLimit, resetMonth, resetDay } = parsed.data;

  const existing = await prisma.leaveType.findUnique({
    where: { clientId_name: { clientId, name } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `A leave type named "${name}" already exists.` },
      { status: 409 },
    );
  }

  const leaveType = await prisma.leaveType.create({
    data: {
      clientId,
      name,
      isPaid,
      defaultDays,
      carryOverLimit,
      resetMonth: resetMonth ?? null,
      resetDay: resetDay ?? null,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "LeaveType",
    entityId: String(leaveType.id),
    description: `Created leave type "${leaveType.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: leaveType }, { status: 201 });
}
