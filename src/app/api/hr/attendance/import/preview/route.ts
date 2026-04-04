// src/app/api/hr/attendance/import/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { z } from 'zod';
import { computeTimesheetFields } from '@/lib/timesheet-calc';

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const rowSchema = z.object({
  rowNum: z.number().int().positive(),
  employeeNo: z.string().min(1),
  date: z.string().regex(dateRegex),
  timeIn: z.string().regex(timeRegex),
  timeOut: z.string().regex(timeRegex),
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
 *
 * Dry-run of the import: validates employees, resolves work-schedule lunch
 * breaks, computes hours and daily gross, and flags rows that would overwrite
 * an existing timesheet record. Does NOT write to the database.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body = await request.json() as unknown;
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { rows } = parsed.data;

  // ── Batch: employee lookup ────────────────────────────────────────────────
  const uniqueEmpNos = [...new Set(rows.map(r => r.employeeNo))];

  const employees = await prisma.employee.findMany({
    where: {
      employeeNo: { in: uniqueEmpNos },
      softDelete: false,
      employments: { some: { clientId, employmentStatus: 'ACTIVE', isPastRole: false } },
    },
    select: { id: true, employeeNo: true },
  });

  const empByNo = new Map<string, number>(
    employees
      .filter((e): e is typeof e & { employeeNo: string } => e.employeeNo !== null)
      .map(e => [e.employeeNo, e.id]),
  );

  // ── Batch: existing timesheet check ──────────────────────────────────────
  const pairsToCheck = rows
    .filter(r => empByNo.has(r.employeeNo))
    .map(r => ({
      employeeId: empByNo.get(r.employeeNo)!,
      date: new Date(`${r.date}T00:00:00.000Z`),
    }));

  const existingTimesheets = pairsToCheck.length > 0
    ? await prisma.timesheet.findMany({
        where: {
          clientId,
          OR: pairsToCheck.map(p => ({ employeeId: p.employeeId, date: p.date })),
        },
        select: { employeeId: true, date: true },
      })
    : [];

  const existingSet = new Set(
    existingTimesheets.map(t => `${t.employeeId}|${t.date.toISOString().slice(0, 10)}`),
  );

  // ── Per-row: schedule + compensation lookup + compute ─────────────────────
  const results: PreviewRowResult[] = await Promise.all(
    rows.map(async (row): Promise<PreviewRowResult> => {
      const base: PreviewRowResult = {
        rowNum: row.rowNum,
        lunchStart: row.lunchStart ?? null,
        lunchEnd: row.lunchEnd ?? null,
        lunchFromSchedule: false,
        regularHours: 0,
        otHours: 0,
        lateMinutes: 0,
        dailyGrossPay: 0,
        willOverwrite: false,
      };

      const employeeId = empByNo.get(row.employeeNo);
      if (!employeeId) {
        return { ...base, error: 'Employee not found or inactive' };
      }

      const targetDate = new Date(`${row.date}T00:00:00.000Z`);
      const dayOfWeek = targetDate.getUTCDay();
      const willOverwrite = existingSet.has(`${employeeId}|${row.date}`);

      try {
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
                select: { days: { where: { dayOfWeek }, take: 1 } },
              },
            },
          }),
          prisma.employeeCompensation.findFirst({
            where: {
              isActive: true,
              contract: {
                employment: { employeeId, clientId, isPastRole: false },
              },
            },
            select: { calculatedDailyRate: true, payType: true },
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

        const otHours = parseFloat(
          (
            computed.regOtHours +
            computed.rdOtHours +
            computed.shOtHours +
            computed.shRdOtHours +
            computed.rhOtHours +
            computed.rhRdOtHours
          ).toFixed(2),
        );

        return {
          rowNum: row.rowNum,
          lunchStart,
          lunchEnd,
          lunchFromSchedule,
          regularHours: computed.regularHours,
          otHours,
          lateMinutes: computed.lateMinutes,
          dailyGrossPay: computed.dailyGrossPay,
          willOverwrite,
        };
      } catch {
        return { ...base, willOverwrite, error: 'Error computing attendance fields' };
      }
    }),
  );

  return NextResponse.json({ data: results });
}
