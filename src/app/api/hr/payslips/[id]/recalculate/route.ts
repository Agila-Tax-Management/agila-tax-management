// src/app/api/hr/payslips/[id]/recalculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { computeTimesheetFields, type DayType } from '@/lib/timesheet-calc';
import { resolveHrSettingFlags, applyHrSettingGuards } from '@/lib/hr-settings-guard';
import {
  getSSSEmployeeDeduction,
  getPhilHealthEmployeeDeduction,
  getPagibigEmployeeDeduction,
} from '@/lib/government-contributions';
import { computeDoleOvertimePay } from '@/lib/dole-overtime';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/hr/payslips/[id]/recalculate
 *
 * Refreshes all derived fields for a payslip's timesheet records and returns
 * suggested earning values aligned with the generation logic.
 *
 * Steps performed:
 *  1. Re-run computeTimesheetFields on every timesheet row in the period that has
 *     both timeIn + timeOut but still shows regularHours = 0 (e.g. the row was
 *     created/patched by a COA approval AFTER payroll generation).
 *  2. Aggregate approved OvertimeRequest hours for the period → suggest overtimePay.
 *  3. Aggregate approved paid LeaveRequest credits for the period → suggest paidLeavePay.
 *  4. Recompute basicPay and allowance from current compensation (matching generation logic).
 *  5. Recompute government deductions from current compensation flags.
 *  6. Return updated timesheets + all suggestions + audit meta.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { id } = await params;

  // ── Load payslip with everything needed for recalculation ────────────────
  const payslip = await prisma.payslip.findFirst({
    where: { id, payrollPeriod: { clientId } },
    select: {
      id: true,
      approvedAt: true,
      employeeId: true,
      payrollPeriod: { select: { startDate: true, endDate: true, payrollScheduleId: true } },
      employee: {
        select: {
          employments: {
            where: { employmentStatus: 'ACTIVE', isPastRole: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              contracts: {
                where: { status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  schedule: { select: { days: true } },
                  compensations: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payslip) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (payslip.approvedAt !== null) {
    return NextResponse.json(
      { error: 'Approved payslips cannot be recalculated.' },
      { status: 409 },
    );
  }

  const { startDate, endDate } = payslip.payrollPeriod;
  const employeeId = payslip.employeeId;
  const activeContract = payslip.employee.employments[0]?.contracts[0] ?? null;
  const schedule = activeContract?.schedule ?? null;
  const compensation = activeContract?.compensations[0] ?? null;

  // ── 1. Load all timesheets for the period ────────────────────────────────
  const timesheets = await prisma.timesheet.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  // ── 2. Load holiday calendar for the period ───────────────────────────────
  const holidays = await prisma.holiday.findMany({
    where: {
      clientId,
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true, type: true },
  });

  // Build a lookup: ISO date string → holiday type
  const holidayMap = new Map<string, string>(
    holidays.map((h) => [h.date.toISOString().slice(0, 10), h.type]),
  );

  // Build rest-day set from schedule (days where isWorkingDay = false)
  const restDaySet = new Set<number>(
    schedule?.days.filter((d) => !d.isWorkingDay).map((d) => d.dayOfWeek) ?? [],
  );

  // ── Pre-fetch approved OT requests for the period ────────────────────────
  // Fetched early so the recalc loop can preserve approved OT hours rather than
  // overwriting them with punch-derived values.
  const otRequests = await prisma.overtimeRequest.findMany({
    where: {
      employeeId,
      clientId,
      status: 'APPROVED',
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true, type: true, hours: true },
  });

  // Build a map: dateKey → accumulated approved OT info for fast lookup
  type ApprovedOtEntry = { regOtHours: number; hasRestDayOt: boolean };
  const approvedOtMap = new Map<string, ApprovedOtEntry>();
  for (const otr of otRequests) {
    const key = otr.date.toISOString().slice(0, 10);
    const isRdOt = otr.type.toLowerCase().includes('rest');
    const hrs = parseFloat(otr.hours.toString());
    const prev = approvedOtMap.get(key);
    if (!prev) {
      approvedOtMap.set(key, { regOtHours: isRdOt ? 0 : hrs, hasRestDayOt: isRdOt });
    } else {
      approvedOtMap.set(key, {
        regOtHours: prev.regOtHours + (isRdOt ? 0 : hrs),
        hasRestDayOt: prev.hasRestDayOt || isRdOt,
      });
    }
  }

  // Pre-compute daily rate (used in punch-row recalc and OT-only row handling below)
  const dailyRate = Number(compensation?.calculatedDailyRate ?? 0);

  // ── Load HrSetting guard flags for this employee ─────────────────────────
  // Strict OT: zeros punch-derived OT buckets; approved OT requests merge back in after.
  // Disable late/undertime: zeros lateMinutes + undertimeMinutes and restores dailyGrossPay.
  const guardFlags = await resolveHrSettingFlags(clientId, employeeId);
  const isVariable = (compensation?.payType ?? 'FIXED_PAY') === 'VARIABLE_PAY';

  // ── 3. Recalculate ALL rows that have timeIn + timeOut ───────────────────
  // Covers: COA-corrected rows added after generation, rows where dailyGrossPay
  // was never computed (e.g. punched before this field existed), rows where
  // compensation changed since last compute, and rows on rest/holiday days.
  const recalcMessages: string[] = [];
  let recalcCount = 0;

  for (const ts of timesheets) {
    if (!ts.timeIn || !ts.timeOut) continue;

    const dow = ts.date.getDay();
    const dateKey = ts.date.toISOString().slice(0, 10);
    const scheduleDay = schedule?.days.find((d) => d.dayOfWeek === dow) ?? null;
    const isRestDay = restDaySet.has(dow);
    const holidayType = holidayMap.get(dateKey) ?? null;

    // Determine DOLE day type
    let dayType: DayType = 'REGULAR';
    if (holidayType === 'REGULAR') {
      dayType = isRestDay ? 'REGULAR_HOLIDAY_REST' : 'REGULAR_HOLIDAY';
    } else if (holidayType === 'SPECIAL_NON_WORKING' || holidayType === 'LOCAL_HOLIDAY') {
      dayType = isRestDay ? 'SPECIAL_HOLIDAY_REST' : 'SPECIAL_HOLIDAY';
    } else if (holidayType === 'SPECIAL_WORKING') {
      // Special working day: treated as regular (no premium pay)
      dayType = 'REGULAR';
    } else if (isRestDay) {
      dayType = 'REST_DAY';
    }

    const computed = computeTimesheetFields(
      ts.timeIn,
      ts.timeOut,
      ts.lunchStart,
      ts.lunchEnd,
      scheduleDay,
      compensation
        ? {
            calculatedDailyRate: compensation.calculatedDailyRate.toString(),
            payType: compensation.payType,
          }
        : null,
      dayType,
    );

    // Apply HR setting guards:
    //  - strictOvertimeApproval → zeroes punch-derived OT (approved OT merges in after)
    //  - disableLateUndertimeGlobal → zeroes late/undertime minutes + adjusts dailyGrossPay
    const guarded = applyHrSettingGuards(computed, guardFlags, dailyRate, isVariable);

    // ── Merge approved OT hours with punch-derived values ──────────────────
    // Approved OT requests are the authoritative source for OT hour counts.
    // Regular OT: take the max of guarded vs approved (approved OT overrides strict mode).
    // Rest-day OT: preserve rdHours/rdOtHours already written by the OT approval handler.
    const approvedOt = approvedOtMap.get(dateKey);
    const writeRegOtHours = approvedOt && !approvedOt.hasRestDayOt
      ? Math.max(guarded.regOtHours, approvedOt.regOtHours)
      : guarded.regOtHours;
    const writeRdHours   = approvedOt?.hasRestDayOt ? Number(ts.rdHours)   : guarded.rdHours;
    const writeRdOtHours = approvedOt?.hasRestDayOt ? Number(ts.rdOtHours) : guarded.rdOtHours;

    // Unpaid leave: employee is punched (COA-corrected) but earns no base pay for the day
    const writeDailyGrossPay = ts.status === 'UNPAID_LEAVE' ? 0 : guarded.dailyGrossPay;

    await prisma.timesheet.update({
      where: { id: ts.id },
      data: {
        regularHours:     guarded.regularHours,
        lateMinutes:      guarded.lateMinutes,
        undertimeMinutes: guarded.undertimeMinutes,
        regOtHours:       writeRegOtHours,
        rdHours:          writeRdHours,
        rdOtHours:        writeRdOtHours,
        shHours:          guarded.shHours,
        shOtHours:        guarded.shOtHours,
        shRdHours:        guarded.shRdHours,
        shRdOtHours:      guarded.shRdOtHours,
        rhHours:          guarded.rhHours,
        rhOtHours:        guarded.rhOtHours,
        rhRdHours:        guarded.rhRdHours,
        rhRdOtHours:      guarded.rhRdOtHours,
        dailyGrossPay:    writeDailyGrossPay,
      },
    });

    recalcMessages.push(
      `${dateKey} [${dayType}]: regularHours=${guarded.regularHours}h rdHours=${guarded.rdHours}h dailyGross=₱${guarded.dailyGrossPay}`,
    );
    recalcCount++;
  }

  // ── 3b. Compute dailyGrossPay for OT-only rows (no punch) ────────────────
  // Rows created by rest-day/holiday OT approvals have premium hour buckets set
  // but no timeIn/timeOut, so they are skipped by the loop above. Set their
  // dailyGrossPay to the base premium portion so holidayPay and basicPay are accurate.
  const OT_BASE_MULT: Record<DayType, number> = {
    REGULAR:              1.00,
    REST_DAY:             1.30,
    SPECIAL_HOLIDAY:      1.30,
    SPECIAL_HOLIDAY_REST: 1.50,
    REGULAR_HOLIDAY:      2.00,
    REGULAR_HOLIDAY_REST: 2.60,
  };

  for (const ts of timesheets) {
    if (ts.timeIn || ts.timeOut) continue; // punch rows already handled above

    const hasPremiumHours =
      Number(ts.rdHours)    > 0 || Number(ts.rdOtHours)    > 0 ||
      Number(ts.shHours)    > 0 || Number(ts.shOtHours)    > 0 ||
      Number(ts.shRdHours)  > 0 || Number(ts.shRdOtHours)  > 0 ||
      Number(ts.rhHours)    > 0 || Number(ts.rhOtHours)    > 0 ||
      Number(ts.rhRdHours)  > 0 || Number(ts.rhRdOtHours)  > 0;

    if (!hasPremiumHours) continue;

    const otDateKey    = ts.date.toISOString().slice(0, 10);
    const otDow        = ts.date.getDay();
    const otIsRestDay  = restDaySet.has(otDow);
    const otHolidayType = holidayMap.get(otDateKey) ?? null;

    let otDayType: DayType = 'REST_DAY';
    if (otHolidayType === 'REGULAR') {
      otDayType = otIsRestDay ? 'REGULAR_HOLIDAY_REST' : 'REGULAR_HOLIDAY';
    } else if (otHolidayType === 'SPECIAL_NON_WORKING' || otHolidayType === 'LOCAL_HOLIDAY') {
      otDayType = otIsRestDay ? 'SPECIAL_HOLIDAY_REST' : 'SPECIAL_HOLIDAY';
    } else if (otIsRestDay) {
      otDayType = 'REST_DAY';
    }

    // Pro-rate base premium pay by actual hours in the premium bucket (up to 8)
    const baseHoursOnRow =
      Number(ts.rdHours)   + Number(ts.shHours)   +
      Number(ts.shRdHours) + Number(ts.rhHours)   + Number(ts.rhRdHours);
    const otOnlyGrossPay = dailyRate > 0 && baseHoursOnRow > 0
      ? parseFloat(((dailyRate / 8) * baseHoursOnRow * OT_BASE_MULT[otDayType]).toFixed(2))
      : 0;

    await prisma.timesheet.update({
      where: { id: ts.id },
      data: { dailyGrossPay: otOnlyGrossPay },
    });
  }

  // ── 4. Re-fetch updated timesheets ───────────────────────────────────────
  const updatedTimesheets = await prisma.timesheet.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  // ── 5. OT requests already fetched before the recalc loop ────────────────
  // ── 6. Approved paid leave requests that overlap the period ─────────────
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      clientId,
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      leaveType: { isPaid: true },
    },
    select: {
      startDate: true,
      endDate: true,
      creditUsed: true,
      leaveType: { select: { name: true, isPaid: true } },
    },
  });

  // ── 7. Compute all suggested values ─────────────────────────────────────
  // ── Determine first-cutoff status for allowance split ─────────────────
  let isFirstCutoff = true;
  if (payslip.payrollPeriod.payrollScheduleId) {
    const ps = await prisma.payrollSchedule.findFirst({
      where: { id: payslip.payrollPeriod.payrollScheduleId },
      select: { firstPeriodStartDay: true },
    });
    if (ps) isFirstCutoff = startDate.getUTCDate() === ps.firstPeriodStartDay;
  }

  const monthlyRate = Number(compensation?.calculatedMonthlyRate ?? 0);
  const allowanceRate = Number(compensation?.allowanceRate ?? 0);
  const payType = compensation?.payType ?? 'FIXED_PAY';
  const freq = (compensation?.frequency ?? 'TWICE_A_MONTH') as 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
  const freqDiv = freq === 'ONCE_A_MONTH' ? 1 : freq === 'TWICE_A_MONTH' ? 2 : 4;

  // Basic pay:
  //   FIXED_PAY  → full periodic salary regardless of attendance.
  //   VARIABLE_PAY → sum actual dailyGrossPay from timesheet (reflects absences
  //                  and late/undertime deductions; absent days have no row).
  const basicPay =
    payType === 'FIXED_PAY'
      ? monthlyRate / freqDiv
      : updatedTimesheets.reduce((s, t) => s + Number(t.dailyGrossPay), 0);

  // Allowance: respect allowanceOnFirstCutoffOnly flag
  const allowanceOnFirstCutoffOnly = compensation?.allowanceOnFirstCutoffOnly ?? true;
  let allowance: number;
  if (allowanceOnFirstCutoffOnly && freq !== 'ONCE_A_MONTH') {
    allowance = isFirstCutoff ? allowanceRate : 0;
  } else {
    allowance = allowanceRate / freqDiv;
  }

  // Helper to parse "HH:MM" → minutes since midnight (local to this scope)
  const parseHHMM = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };

  // Holiday premium pay: basicPay now sums dailyGrossPay which already embeds all
  // holiday and rest-day multipliers via computeTimesheetFields(). No separate component
  // needed — setting to 0 prevents double-counting for all pay types.
  const holidayPay = 0;

  // Late / undertime deduction: per-minute penalty on punched days only.
  //   VARIABLE_PAY → already baked into dailyGrossPay per row (0 here).
  //   FIXED_PAY    → (lateMin + undertimeMin) / scheduledWorkMin × dailyRate per punched row.
  // Absent days and UNPAID_LEAVE days are already excluded from basicPay
  // (no row / dailyGrossPay = 0), so no additional full-day deduction is needed.
  const lateUndertimeDeduction = (() => {
    if (payType === 'VARIABLE_PAY') return 0;
    let total = 0;
    for (const t of updatedTimesheets) {
      if (!t.timeIn || !t.timeOut) continue;
      const deductMin = Number(t.lateMinutes) + Number(t.undertimeMinutes);
      if (deductMin <= 0) continue;
      const tDow = (t.date as Date).getDay();
      const sd = schedule?.days.find((d) => d.dayOfWeek === tDow) ?? null;
      const sStart = sd ? parseHHMM(sd.startTime) : 8 * 60;
      const sEnd   = sd ? parseHHMM(sd.endTime)   : 17 * 60;
      const brkMin =
        sd?.breakStart && sd?.breakEnd
          ? parseHHMM(sd.breakEnd) - parseHHMM(sd.breakStart)
          : 60;
      const schedMin = Math.max(1, sEnd - sStart - brkMin);
      total += (deductMin / schedMin) * dailyRate;
    }
    return total;
  })();

  // Overtime pay: DOLE-compliant per OT type using approved timesheet OT hours
  const overtimePay = computeDoleOvertimePay(updatedTimesheets, dailyRate);

  // Paid leave pay: sum of approved paid leave credits used × dailyRate
  const paidLeavePay = leaveRequests.reduce(
    (s, lr) => s + Number(lr.creditUsed) * dailyRate,
    0,
  );

  // Government contributions from current compensation flags
  const sssDeduction = compensation?.deductSss
    ? getSSSEmployeeDeduction(monthlyRate, freq)
    : 0;
  const philhealthDeduction = compensation?.deductPhilhealth
    ? getPhilHealthEmployeeDeduction(monthlyRate, freq)
    : 0;
  const pagibigDeduction = compensation?.deductPagibig
    ? getPagibigEmployeeDeduction(
        monthlyRate,
        compensation.pagibigType as 'REGULAR' | 'MINIMUM',
        freq,
      )
    : 0;

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'Payslip',
    entityId: id,
    description: `Recalculated payslip ${id}: ${recalcCount} timesheet row(s) updated, ${otRequests.length} OT request(s), ${leaveRequests.length} leave request(s)`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      timesheets: updatedTimesheets,
      suggestions: {
        basicPay:                parseFloat(basicPay.toFixed(2)),
        holidayPay:              parseFloat(holidayPay.toFixed(2)),
        allowance:               parseFloat(allowance.toFixed(2)),
        overtimePay:             parseFloat(overtimePay.toFixed(2)),
        paidLeavePay:            parseFloat(paidLeavePay.toFixed(2)),
        lateUndertimeDeduction:  parseFloat(lateUndertimeDeduction.toFixed(2)),
        sssDeduction:            parseFloat(sssDeduction.toFixed(2)),
        philhealthDeduction:     parseFloat(philhealthDeduction.toFixed(2)),
        pagibigDeduction:        parseFloat(pagibigDeduction.toFixed(2)),
      },
      meta: {
        recalcCount,
        recalcMessages,
        otRequestCount: otRequests.length,
        leaveRequestCount: leaveRequests.length,
      },
    },
  });
}
