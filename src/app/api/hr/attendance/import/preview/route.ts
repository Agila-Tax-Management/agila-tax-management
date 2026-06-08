// src/app/api/hr/attendance/import/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { z } from 'zod';
import { computeTimesheetFields } from '@/lib/timesheet-calc';
import { loadHrSettingCache, flagsFromCache, applyHrSettingGuards } from '@/lib/hr-settings-guard';

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * UPDATED:
 * timeIn/timeOut are now optional so we can detect ABSENT and INCOMPLETE
 */
const rowSchema = z.object({
  rowNum: z.number().int().positive(),
  employeeNo: z.string().min(1),
  date: z.string().regex(dateRegex),

  timeIn: z.string().regex(timeRegex).optional().nullable(),
  timeOut: z.string().regex(timeRegex).optional().nullable(),

  lunchStart: z.string().regex(timeRegex).nullable().optional(),
  lunchEnd: z.string().regex(timeRegex).nullable().optional(),
});

const previewSchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

function buildUtcDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

export interface PreviewRowResult {
  rowNum: number;
  status: 'ABSENT' | 'INCOMPLETE' | 'COMPLETE';

  lunchStart: string | null;
  lunchEnd: string | null;
  lunchFromSchedule: boolean;

  regularHours: number;
  otHours: number;
  lateMinutes: number;
  dailyGrossPay: number;

  willOverwrite: boolean;
  error?: string;
}

/**
 * POST /api/hr/attendance/import/preview
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body = (await request.json()) as unknown;
  const parsed = previewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { rows } = parsed.data;

  // ── Employee lookup ─────────────────────────────
  const uniqueEmpNos = [...new Set(rows.map(r => r.employeeNo))];

  const employees = await prisma.employee.findMany({
    where: {
      employeeNo: { in: uniqueEmpNos },
      softDelete: false,
      employments: {
        some: {
          clientId,
          employmentStatus: 'ACTIVE',
          isPastRole: false,
        },
      },
    },
    select: { id: true, employeeNo: true },
  });

  const empByNo = new Map<string, number>(
    employees
      .filter((e): e is typeof e & { employeeNo: string } => e.employeeNo !== null)
      .map(e => [e.employeeNo, e.id]),
  );

  // ── Existing timesheets ─────────────────────────
  const pairsToCheck = rows
    .filter(r => empByNo.has(r.employeeNo))
    .map(r => ({
      employeeId: empByNo.get(r.employeeNo)!,
      date: new Date(`${r.date}T00:00:00.000Z`),
    }));

  const existingTimesheets =
    pairsToCheck.length > 0
      ? await prisma.timesheet.findMany({
          where: {
            clientId,
            OR: pairsToCheck.map(p => ({
              employeeId: p.employeeId,
              date: p.date,
            })),
          },
          select: { employeeId: true, date: true },
        })
      : [];

  const existingSet = new Set(
    existingTimesheets.map(
      t => `${t.employeeId}|${t.date.toISOString().slice(0, 10)}`,
    ),
  );

  // ── HR settings cache ───────────────────────────
  const settingCache = await loadHrSettingCache(clientId);

  // ── MAIN PROCESSING ────────────────────────────
  const results: PreviewRowResult[] = await Promise.all(
    rows.map(async row => {
      const employeeId = empByNo.get(row.employeeNo);

      const base: PreviewRowResult = {
        rowNum: row.rowNum,
        status: 'ABSENT',

        lunchStart: row.lunchStart ?? null,
        lunchEnd: row.lunchEnd ?? null,
        lunchFromSchedule: false,

        regularHours: 0,
        otHours: 0,
        lateMinutes: 0,
        dailyGrossPay: 0,

        willOverwrite: false,
      };

      if (!employeeId) {
        return {
          ...base,
          error: 'Employee not found or inactive',
        };
      }

      const hasIn = !!row.timeIn;
      const hasOut = !!row.timeOut;

      const targetDate = new Date(`${row.date}T00:00:00.000Z`);
      const willOverwrite = existingSet.has(
        `${employeeId}|${row.date}`,
      );

      // ── STATUS CLASSIFICATION ───────────────────
      let status: PreviewRowResult['status'];

      if (!hasIn && !hasOut) {
        status = 'ABSENT';
      } else if (!hasIn || !hasOut) {
        status = 'INCOMPLETE';

        return {
          ...base,
          status,
          willOverwrite,
          error: 'Incomplete time-in/time-out',
        };
      } else {
        status = 'COMPLETE';
      }

      try {
        const dayOfWeek = targetDate.getUTCDay();

        const [contract, compensation] = await Promise.all([
          prisma.employeeContract.findFirst({
            where: {
              employment: {
                employeeId,
                clientId,
                isPastRole: false,
                employmentStatus: 'ACTIVE',
              },
            },
            orderBy: { createdAt: 'desc' },
            select: {
              schedule: {
                select: {
                  days: { where: { dayOfWeek }, take: 1 },
                },
              },
            },
          }),

          prisma.employeeCompensation.findFirst({
            where: {
              isActive: true,
              contract: {
                employment: {
                  employeeId,
                  clientId,
                  isPastRole: false,
                },
              },
            },
            select: {
              calculatedDailyRate: true,
              payType: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        const scheduleDay = contract?.schedule?.days[0] ?? null;

        let lunchStart = row.lunchStart ?? null;
        let lunchEnd = row.lunchEnd ?? null;
        let lunchFromSchedule = false;

        if (!lunchStart && scheduleDay?.breakStart) {
          lunchStart = scheduleDay.breakStart;
          lunchFromSchedule = true;
        }

        if (!lunchEnd && scheduleDay?.breakEnd) {
          lunchEnd = scheduleDay.breakEnd;
          lunchFromSchedule = true;
        }

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
                calculatedDailyRate:
                  compensation.calculatedDailyRate.toString(),
                payType: compensation.payType,
              }
            : null,
        );

        const guardFlags = flagsFromCache(settingCache, employeeId);

        const guarded = applyHrSettingGuards(
          computed,
          guardFlags,
          parseFloat(
            (compensation?.calculatedDailyRate ?? 0).toString(),
          ),
          compensation?.payType === 'VARIABLE_PAY',
        );

        const otHours = parseFloat(
          (
            guarded.regOtHours +
            guarded.rdOtHours +
            guarded.shOtHours +
            guarded.shRdOtHours +
            guarded.rhOtHours +
            guarded.rhRdOtHours
          ).toFixed(2),
        );

        return {
          rowNum: row.rowNum,
          status,

          lunchStart,
          lunchEnd,
          lunchFromSchedule,

          regularHours: guarded.regularHours,
          otHours,
          lateMinutes: guarded.lateMinutes,
          dailyGrossPay: guarded.dailyGrossPay,

          willOverwrite,
        };
      } catch {
        return {
          ...base,
          status,
          willOverwrite,
          error: 'Error computing attendance fields',
        };
      }
    }),
  );

  return NextResponse.json({ data: results });
}