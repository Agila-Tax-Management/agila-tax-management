// src/app/api/hr/attendance/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { z } from 'zod';
import { computeTimesheetFields } from '@/lib/timesheet-calc';
import { resolveHrSettingFlags, applyHrSettingGuards } from '@/lib/hr-settings-guard';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const timeRegex = /^\d{2}:\d{2}$/;

const patchSchema = z.object({
  timeIn:     z.string().regex(timeRegex, 'Must be HH:MM').nullable().optional(),
  lunchStart: z.string().regex(timeRegex, 'Must be HH:MM').nullable().optional(),
  lunchEnd:   z.string().regex(timeRegex, 'Must be HH:MM').nullable().optional(),
  timeOut:    z.string().regex(timeRegex, 'Must be HH:MM').nullable().optional(),
});

/** Build a full UTC Date from a YYYY-MM-DD string and a HH:MM time string. */
function buildUtcDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/hr/attendance/[id]
 * Edit time punch fields on a Timesheet row.
 * Recalculates derived fields (regularHours, lateMinutes, etc.) when
 * both timeIn and timeOut are present after the update.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { id } = await params;

  const body = await request.json() as unknown;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { timeIn: tiStr, lunchStart: lsStr, lunchEnd: leStr, timeOut: toStr } = parsed.data;

  // Verify the timesheet belongs to this client
  const existing = await prisma.timesheet.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      employeeId: true,
      date: true,
      timeIn: true,
      lunchStart: true,
      lunchEnd: true,
      timeOut: true,
      status: true,
    },
  });

  if (!existing) return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
  if (existing.clientId !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const dateStr = existing.date.toISOString().slice(0, 10);

  // Build new datetime values (undefined input = keep existing; null string = clear)
  const newTimeIn     = tiStr !== undefined ? (tiStr ? buildUtcDate(dateStr, tiStr) : null) : existing.timeIn;
  const newLunchStart = lsStr !== undefined ? (lsStr ? buildUtcDate(dateStr, lsStr) : null) : existing.lunchStart;
  const newLunchEnd   = leStr !== undefined ? (leStr ? buildUtcDate(dateStr, leStr) : null) : existing.lunchEnd;
  const newTimeOut    = toStr !== undefined ? (toStr ? buildUtcDate(dateStr, toStr) : null) : existing.timeOut;

  // Determine updated attendance status
  let newStatus = existing.status;
  if (newTimeIn && newTimeOut) newStatus = 'PRESENT';
  else if (newTimeIn ?? newTimeOut) newStatus = 'INCOMPLETE';

  // Fetch employee compensation for recalculation
  // Chain: EmployeeCompensation → EmployeeContract → EmployeeEmployment (employeeId + clientId)
  const compensation = await prisma.employeeCompensation.findFirst({
    where: {
      isActive: true,
      contract: {
        employment: {
          employeeId: existing.employeeId,
          clientId,
          isPastRole: false,
        },
      },
    },
    select: { calculatedDailyRate: true, payType: true },
    orderBy: { createdAt: 'desc' },
  });

  type UpdateInput = {
    timeIn: Date | null;
    lunchStart: Date | null;
    lunchEnd: Date | null;
    timeOut: Date | null;
    status: typeof newStatus;
    regularHours?: number;
    lateMinutes?: number;
    undertimeMinutes?: number;
    regOtHours?: number;
    dailyGrossPay?: number;
  };

  const updateData: UpdateInput = {
    timeIn: newTimeIn,
    lunchStart: newLunchStart,
    lunchEnd: newLunchEnd,
    timeOut: newTimeOut,
    status: newStatus,
  };

  // Recalculate derived fields if we have a full punch pair
  if (newTimeIn && newTimeOut) {
    const computed = computeTimesheetFields(
      newTimeIn,
      newTimeOut,
      newLunchStart,
      newLunchEnd,
      null, // use default schedule (08:00–17:00)
      compensation
        ? { calculatedDailyRate: compensation.calculatedDailyRate.toString(), payType: compensation.payType }
        : null,
    );

    const guardFlags = await resolveHrSettingFlags(clientId, existing.employeeId);
    const guarded = applyHrSettingGuards(
      computed,
      guardFlags,
      parseFloat((compensation?.calculatedDailyRate ?? 0).toString()),
      compensation?.payType === 'VARIABLE_PAY',
    );

    updateData.regularHours     = guarded.regularHours;
    updateData.lateMinutes      = guarded.lateMinutes;
    updateData.undertimeMinutes = guarded.undertimeMinutes;
    updateData.regOtHours       = guarded.regOtHours;
    updateData.dailyGrossPay    = guarded.dailyGrossPay;
  }

  const updated = await prisma.timesheet.update({ where: { id }, data: updateData });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'Timesheet',
    entityId: updated.id,
    description: `Updated attendance punches for employee ${existing.employeeId} on ${dateStr}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: updated.id } });
}

/**
 * DELETE /api/hr/attendance/[id]
 * Deletes a Timesheet row by ID.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.timesheet.findUnique({
    where: { id },
    select: { id: true, clientId: true, employeeId: true, date: true },
  });

  if (!existing) return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
  if (existing.clientId !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.timesheet.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'Timesheet',
    entityId: id,
    description: `Deleted attendance record for employee ${existing.employeeId} on ${existing.date.toISOString().slice(0, 10)}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id } });
}
