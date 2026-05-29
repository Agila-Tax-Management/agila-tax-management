// src/app/api/hr/work-schedules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateWorkScheduleSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/hr/work-schedules/[id]
 * Updates a work schedule name and/or replaces all day configurations.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "ADMIN" &&
    !session.portalAccess?.HR?.canWrite
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const scheduleId = parseInt(id, 10);
  if (isNaN(scheduleId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateWorkScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const existing = await prisma.workSchedule.findUnique({ where: { id: scheduleId } });
  if (!existing) return NextResponse.json({ error: "Work schedule not found" }, { status: 404 });

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const conflict = await prisma.workSchedule.findUnique({
      where: { clientId_name: { clientId: existing.clientId, name: parsed.data.name } },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "A schedule with this name already exists" },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.days) {
      await tx.workScheduleDay.deleteMany({ where: { scheduleId } });
      await tx.workScheduleDay.createMany({
        data: parsed.data.days.map((d) => ({
          scheduleId,
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime ?? null,
          endTime: d.endTime ?? null,
          breakStart: d.breakStart ?? null,
          breakEnd: d.breakEnd ?? null,
          isWorkingDay: d.isWorkingDay,
          locationType: d.locationType ?? "OFFICE",
          isFlexible: d.isFlexible ?? false,
          requiredHours: d.requiredHours ?? null,
        })),
      });
    }
    return tx.workSchedule.update({
      where: { id: scheduleId },
      data: {
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.timezone ? { timezone: parsed.data.timezone } : {}),
      },
      include: { days: { orderBy: { dayOfWeek: "asc" } } },
    });
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "WorkSchedule",
    entityId: String(scheduleId),
    description: `Updated work schedule "${updated.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/work-schedules/[id]
 * Deletes a work schedule and all its day configurations.
 * Blocked if the schedule is assigned to any employee contracts.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "ADMIN" &&
    !session.portalAccess?.HR?.canWrite
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const scheduleId = parseInt(id, 10);
  if (isNaN(scheduleId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.workSchedule.findUnique({
    where: { id: scheduleId },
    include: { _count: { select: { contracts: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Work schedule not found" }, { status: 404 });

  if (existing._count.contracts > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — this schedule is assigned to ${existing._count.contracts} contract(s). Reassign them first.`,
      },
      { status: 409 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.workScheduleDay.deleteMany({ where: { scheduleId } });
    await tx.workSchedule.delete({ where: { id: scheduleId } });
  });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "WorkSchedule",
    entityId: String(scheduleId),
    description: `Deleted work schedule "${existing.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: scheduleId } });
}
