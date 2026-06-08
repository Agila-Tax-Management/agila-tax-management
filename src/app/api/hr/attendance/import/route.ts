// src/app/api/hr/attendance/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { z } from 'zod';
import { computeTimesheetFields } from '@/lib/timesheet-calc';
import {
  loadHrSettingCache,
  flagsFromCache,
  applyHrSettingGuards,
} from '@/lib/hr-settings-guard';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const rowSchema = z.object({
  employeeNo: z.string().min(1),
  date: z.string().regex(dateRegex, 'Must be YYYY-MM-DD'),

  timeIn: z.string().regex(timeRegex).optional().nullable(),
  timeOut: z.string().regex(timeRegex).optional().nullable(),

  lunchStart: z.string().regex(timeRegex).nullable().optional(),
  lunchEnd: z.string().regex(timeRegex).nullable().optional(),
});

const importSchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

function buildUtcDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

const ZERO_DOLE = {
  regularHours: 0,
  regOtHours: 0,
  rdHours: 0,
  rdOtHours: 0,
  shHours: 0,
  shOtHours: 0,
  shRdHours: 0,
  shRdOtHours: 0,
  rhHours: 0,
  rhOtHours: 0,
  rhRdHours: 0,
  rhRdOtHours: 0,
};

type AttendanceStatus = 'ABSENT' | 'INCOMPLETE' | 'PRESENT';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body = (await request.json()) as unknown;
  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { rows } = parsed.data;

  const settingCache = await loadHrSettingCache(clientId);

  let imported = 0;
  let skipped = 0;
  const errors: { row: number; employeeNo: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;

    try {
      const employee = await prisma.employee.findFirst({
        where: {
          employeeNo: row.employeeNo,
          softDelete: false,
          employments: {
            some: {
              clientId,
              employmentStatus: 'ACTIVE',
              isPastRole: false,
            },
          },
        },
        select: { id: true },
      });

      if (!employee) {
        errors.push({
          row: i + 1,
          employeeNo: row.employeeNo,
          error: 'Employee not found or inactive',
        });
        skipped++;
        continue;
      }

      const targetDate = new Date(`${row.date}T00:00:00.000Z`);
      const dayOfWeek = targetDate.getUTCDay();

      const hasIn = !!row.timeIn;
      const hasOut = !!row.timeOut;

      let status: AttendanceStatus;

      if (!hasIn && !hasOut) status = 'ABSENT';
      else if (!hasIn || !hasOut) status = 'INCOMPLETE';
      else status = 'PRESENT';

      // ─────────────────────────────
      // ABSENT (FULL RESET)
      // ─────────────────────────────
      if (status === 'ABSENT') {
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
            status: 'ABSENT',

            timeIn: null,
            timeOut: null,
            lunchStart: null,
            lunchEnd: null,

            lateMinutes: 0,
            undertimeMinutes: 0,
            dailyGrossPay: 0,

            ...ZERO_DOLE,
          },
          update: {
            status: 'ABSENT',

            timeIn: null,
            timeOut: null,
            lunchStart: null,
            lunchEnd: null,

            lateMinutes: 0,
            undertimeMinutes: 0,
            dailyGrossPay: 0,

            ...ZERO_DOLE,
          },
        });

        imported++;
        continue;
      }

      // ─────────────────────────────
      // INCOMPLETE (SKIP SAFE)
      // ─────────────────────────────
      if (status === 'INCOMPLETE') {
        errors.push({
          row: i + 1,
          employeeNo: row.employeeNo,
          error: 'Incomplete time-in/time-out',
        });
        skipped++;
        continue;
      }

      // ─────────────────────────────
      // PRESENT (FULL COMPUTE)
      // ─────────────────────────────

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

      let lunchStart = row.lunchStart ?? null;
      let lunchEnd = row.lunchEnd ?? null;

      if (!lunchStart && scheduleDay?.breakStart) lunchStart = scheduleDay.breakStart;
      if (!lunchEnd && scheduleDay?.breakEnd) lunchEnd = scheduleDay.breakEnd;

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

      const timeInDate = buildUtcDate(row.date, row.timeIn!);
      const timeOutDate = buildUtcDate(row.date, row.timeOut!);

      const lunchStartDate = lunchStart
        ? buildUtcDate(row.date, lunchStart)
        : null;

      const lunchEndDate = lunchEnd
        ? buildUtcDate(row.date, lunchEnd)
        : null;

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

      const guardFlags = flagsFromCache(settingCache, employee.id);

      const guarded = applyHrSettingGuards(
        computed,
        guardFlags,
        parseFloat((compensation?.calculatedDailyRate ?? 0).toString()),
        compensation?.payType === 'VARIABLE_PAY',
      );

      // 🧠 IMPORTANT: destructure to avoid TS duplicate key error
      const {
        regularHours,
        regOtHours,
        rdHours,
        rdOtHours,
        shHours,
        shOtHours,
        shRdHours,
        shRdOtHours,
        rhHours,
        rhOtHours,
        rhRdHours,
        rhRdOtHours,
        lateMinutes,
        undertimeMinutes,
        dailyGrossPay,
      } = guarded;

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
          timeOut: timeOutDate,
          lunchStart: lunchStartDate,
          lunchEnd: lunchEndDate,

          lateMinutes,
          undertimeMinutes,
          dailyGrossPay,

          regularHours,
          regOtHours,
          rdHours,
          rdOtHours,
          shHours,
          shOtHours,
          shRdHours,
          shRdOtHours,
          rhHours,
          rhOtHours,
          rhRdHours,
          rhRdOtHours,
        },
        update: {
          status: 'PRESENT',

          timeIn: timeInDate,
          timeOut: timeOutDate,
          lunchStart: lunchStartDate,
          lunchEnd: lunchEndDate,

          lateMinutes,
          undertimeMinutes,
          dailyGrossPay,

          regularHours,
          regOtHours,
          rdHours,
          rdOtHours,
          shHours,
          shOtHours,
          shRdHours,
          shRdOtHours,
          rhHours,
          rhOtHours,
          rhRdHours,
          rhRdOtHours,
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

  return NextResponse.json({
    data: { imported, skipped, errors },
  });
}