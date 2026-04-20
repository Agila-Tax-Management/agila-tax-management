// src/app/api/hr/payroll-schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { SalaryFrequency } from "@/generated/prisma/client";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  frequency: z.enum(["ONCE_A_MONTH", "TWICE_A_MONTH", "WEEKLY"]),
  firstPeriodStartDay: z.number().int().min(1).max(31),
  firstPeriodEndDay: z.number().int().min(1).max(31),
  firstPayoutDay: z.number().int().min(1).max(31),
  secondPeriodStartDay: z.number().int().min(1).max(31).nullable().optional(),
  secondPeriodEndDay: z.number().int().min(1).max(31).nullable().optional(),
  secondPayoutDay: z.number().int().min(1).max(31).nullable().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/hr/payroll-schedules
 * Returns all payroll schedules for the current client.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const schedules = await prisma.payrollSchedule.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { compensations: true, payrollPeriods: true } },
    },
  });

  return NextResponse.json({ data: schedules });
}

/**
 * POST /api/hr/payroll-schedules
 * Creates a new payroll schedule.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

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
      { status: 400 },
    );
  }

  const d = parsed.data;
  const schedule = await prisma.payrollSchedule.create({
    data: {
      clientId,
      name: d.name,
      frequency: d.frequency as SalaryFrequency,
      firstPeriodStartDay: d.firstPeriodStartDay,
      firstPeriodEndDay: d.firstPeriodEndDay,
      firstPayoutDay: d.firstPayoutDay,
      secondPeriodStartDay: d.secondPeriodStartDay ?? null,
      secondPeriodEndDay: d.secondPeriodEndDay ?? null,
      secondPayoutDay: d.secondPayoutDay ?? null,
      isActive: d.isActive,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "PayrollSchedule",
    entityId: schedule.id,
    description: `Created payroll schedule "${schedule.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: schedule }, { status: 201 });
}
