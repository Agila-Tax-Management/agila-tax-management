// src/app/api/hr/work-schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { createWorkScheduleSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

/**
 * GET /api/hr/work-schedules
 * Returns all reusable work schedule templates.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const schedules = await prisma.workSchedule.findMany({
    where: { clientId },
    orderBy: { name: "asc" },
    include: { days: { orderBy: { dayOfWeek: "asc" } } },
  });

  return NextResponse.json({ data: schedules });
}

/**
 * POST /api/hr/work-schedules
 * Creates a new work schedule template with its day configurations.
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

  const parsed = createWorkScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const schedule = await prisma.workSchedule.create({
    data: {
      clientId,
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      days: {
        create: parsed.data.days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          breakStart: d.breakStart ?? null,
          breakEnd: d.breakEnd ?? null,
          isWorkingDay: d.isWorkingDay,
        })),
      },
    },
    include: { days: { orderBy: { dayOfWeek: "asc" } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "WorkSchedule",
    entityId: String(schedule.id),
    description: `Created work schedule "${schedule.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: schedule }, { status: 201 });
}
