// src/app/api/hr/attendance/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { z } from 'zod';
import { computeTimesheetFields } from '@/lib/timesheet-calc';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const rowSchema = z.object({
  employeeNo: z.string().min(1),
  date: z.string().regex(dateRegex, 'Must be YYYY-MM-DD'),
  timeIn: z.string().regex(timeRegex, 'Must be HH:MM'),
  timeOut: z.string().regex(timeRegex, 'Must be HH:MM'),
  lunchStart: z.string().regex(timeRegex).nullable().optional(),
  lunchEnd: z.string().regex(timeRegex).nullable().optional(),
});

const importSchema = z.object({
  rows: z
    .array(rowSchema)
    .min(1, 'At least one row is required')
    .max(500, 'Maximum 500 rows per import'),
});

function buildUtcDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

/**
 * POST /api/hr/attendance/import
 *
 * Bulk-upserts Timesheet records from CSV / Excel upload.
 * Each row must include employeeNo, date (YYYY-MM-DD), timeIn, timeOut.
 * If lunchStart / lunchEnd are omitted the employee's work schedule
 * break times are used automatically.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body = await request.json() as unknown;
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { rows } = parsed.data;

  let imported = 0;
  let skipped = 0;
  const errors: { row: number; employeeNo: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    try {
      // Resolve employee by employeeNo within this client
      const employee = await prisma.employee.findFirst({
        where: {
          employeeNo: row.employeeNo,
          softDelete: false,
          employments: {
            some: { clientId, employmentStatus: 'ACTIVE', isPastRole: false },
          },
        },
        select: { id: true },
      });

      if (!employee) {
        errors.push({ row: i + 1, employeeNo: row.employeeNo, error: 'Employee not found or inactive' });
        skipped++;
        continue;
      }

      const targetDate = new Date(`${row.date}T00:00:00.000Z`);
      const dayOfWeek = targetDate.getUTCDay();

      // Look up the employee's active contract + work schedule for this day
      const contract = await prisma.employeeContract.findFirst({
        where: {
          employment: {
            employeeId: employee.id,
            clientId,
            isPastRole: false,
            employmentStatus: 'ACTIVE',
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          schedule: {
            select: {
              days: {
                where: { dayOfWeek },
                take: 1,
              },
            },
          },
        },
      });

      const scheduleDay = contract?.schedule?.days[0] ?? null;

      // Resolve lunch: use provided value first; fall back to schedule break
      let lunchStart = row.lunchStart ?? null;
      let lunchEnd = row.lunchEnd ?? null;
      if (!lunchStart && scheduleDay?.breakStart) lunchStart = scheduleDay.breakStart;
      if (!lunchEnd && scheduleDay?.breakEnd) lunchEnd = scheduleDay.breakEnd;

      // Look up active compensation
      const compensation = await prisma.employeeCompensation.findFirst({
        where: {
          isActive: true,
          contract: {
            employment: {
              employeeId: employee.id,
              clientId,
              isPastRole: false,
            },
          },
        },
        select: { calculatedDailyRate: true, payType: true },
        orderBy: { createdAt: 'desc' },
      });

      const timeInDate = buildUtcDate(row.date, row.timeIn);
      const timeOutDate = buildUtcDate(row.date, row.timeOut);
      const lunchStartDate = lunchStart ? buildUtcDate(row.date, lunchStart) : null;
      const lunchEndDate = lunchEnd ? buildUtcDate(row.date, lunchEnd) : null;

      const computed = computeTimesheetFields(
        timeInDate,
        timeOutDate,
        lunchStartDate,
        lunchEndDate,
        scheduleDay,
        compensation
          ? {
              calculatedDailyRate: compensation.calculatedDailyRate.toString(),
              payType: compensation.payType,
            }
          : null,
      );

      await prisma.timesheet.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: targetDate,
          },
        },
        create: {
          employeeId: employee.id,
          clientId,
          date: targetDate,
          status: 'PRESENT',
          timeIn: timeInDate,
          lunchStart: lunchStartDate,
          lunchEnd: lunchEndDate,
          timeOut: timeOutDate,
          lateMinutes: computed.lateMinutes,
          undertimeMinutes: computed.undertimeMinutes,
          regularHours: computed.regularHours,
          regOtHours: computed.regOtHours,
          rdHours: computed.rdHours,
          rdOtHours: computed.rdOtHours,
          shHours: computed.shHours,
          shOtHours: computed.shOtHours,
          shRdHours: computed.shRdHours,
          shRdOtHours: computed.shRdOtHours,
          rhHours: computed.rhHours,
          rhOtHours: computed.rhOtHours,
          rhRdHours: computed.rhRdHours,
          rhRdOtHours: computed.rhRdOtHours,
          dailyGrossPay: computed.dailyGrossPay,
        },
        update: {
          status: 'PRESENT',
          timeIn: timeInDate,
          lunchStart: lunchStartDate,
          lunchEnd: lunchEndDate,
          timeOut: timeOutDate,
          lateMinutes: computed.lateMinutes,
          undertimeMinutes: computed.undertimeMinutes,
          regularHours: computed.regularHours,
          regOtHours: computed.regOtHours,
          rdHours: computed.rdHours,
          rdOtHours: computed.rdOtHours,
          shHours: computed.shHours,
          shOtHours: computed.shOtHours,
          shRdHours: computed.shRdHours,
          shRdOtHours: computed.shRdOtHours,
          rhHours: computed.rhHours,
          rhOtHours: computed.rhOtHours,
          rhRdHours: computed.rhRdHours,
          rhRdOtHours: computed.rhRdOtHours,
          dailyGrossPay: computed.dailyGrossPay,
        },
      });

      imported++;
    } catch {
      errors.push({
        row: i + 1,
        employeeNo: row.employeeNo,
        error: 'Unexpected error processing row',
      });
      skipped++;
    }
  }

  void logActivity({
    userId: session.user.id,
    action: 'IMPORTED',
    entity: 'Timesheet',
    entityId: clientId.toString(),
    description: `Bulk imported ${imported} attendance records (${skipped} skipped)`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { imported, skipped, errors } });
}
