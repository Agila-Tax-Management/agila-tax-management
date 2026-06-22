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
import { computeDoleOvertimePay, computeHolidayPay } from '@/lib/dole-overtime';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/hr/payslips/[id]/recalculate
 *
 * Refreshes all derived fields for a payslip's timesheet records and returns
 * suggested earning values aligned with the generation logic.
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

  const holidayMap = new Map<string, string>(
    holidays.map((h) => [h.date.toISOString().slice(0, 10), h.type]),
  );

  const restDaySet = new Set<number>(
    schedule?.days.filter((d) => !d.isWorkingDay).map((d) => d.dayOfWeek) ?? [],
  );

  const otRequests = await prisma.overtimeRequest.findMany({
    where: {
      employeeId,
      clientId,
      status: 'APPROVED',
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true, type: true, hours: true },
  });

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

  const dailyRate = Number(compensation?.calculatedDailyRate ?? 0);
  const guardFlags = await resolveHrSettingFlags(clientId, employeeId);
  const isVariable = (compensation?.payType ?? 'FIXED_PAY') === 'VARIABLE_PAY';

  // ── 3. Recalculate ALL rows that have timeIn + timeOut ───────────────────
  const recalcMessages: string[] = [];
  let recalcCount = 0;

  for (const ts of timesheets) {
    if (!ts.timeIn || !ts.timeOut) continue;

    const dow = ts.date.getDay();
    const dateKey = ts.date.toISOString().slice(0, 10);
    const scheduleDay = schedule?.days.find((d) => d.dayOfWeek === dow) ?? null;
    const isRestDay = restDaySet.has(dow);
    const holidayType = holidayMap.get(dateKey) ?? null;

    let dayType: DayType = 'REGULAR';
    if (holidayType === 'REGULAR') {
      dayType = isRestDay ? 'REGULAR_HOLIDAY_REST' : 'REGULAR_HOLIDAY';
    } else if (holidayType === 'SPECIAL_NON_WORKING' || holidayType === 'LOCAL_HOLIDAY') {
      dayType = isRestDay ? 'SPECIAL_HOLIDAY_REST' : 'SPECIAL_HOLIDAY';
    } else if (holidayType === 'SPECIAL_WORKING') {
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

    const guarded = applyHrSettingGuards(computed, guardFlags, dailyRate, isVariable);

    const approvedOt = approvedOtMap.get(dateKey);
    const writeRegOtHours = approvedOt && !approvedOt.hasRestDayOt
      ? Math.max(guarded.regOtHours, approvedOt.regOtHours)
      : guarded.regOtHours;
    const writeRdHours   = approvedOt?.hasRestDayOt ? Number(ts.rdHours)   : guarded.rdHours;
    const writeRdOtHours = approvedOt?.hasRestDayOt ? Number(ts.rdOtHours) : guarded.rdOtHours;

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
  const OT_BASE_MULT: Record<DayType, number> = {
    REGULAR:        1.00,
    REST_DAY:       1.30,
    SPECIAL_HOLIDAY:      1.30,
    SPECIAL_HOLIDAY_REST: 1.50,
    REGULAR_HOLIDAY:      2.00,
    REGULAR_HOLIDAY_REST: 2.60,
  };

  for (const ts of timesheets) {
    if (ts.timeIn || ts.timeOut) continue;

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
    } else if (otHolidayType === 'SPECIAL_NON_WORKSPACE' || otHolidayType === 'SPECIAL_NON_WORKING' || otHolidayType === 'LOCAL_HOLIDAY') {
      otDayType = otIsRestDay ? 'SPECIAL_HOLIDAY_REST' : 'SPECIAL_HOLIDAY';
    } else if (otIsRestDay) {
      otDayType = 'REST_DAY';
    }

    const baseHoursOnRow =
      Number(ts.rdHours)    + Number(ts.shHours)    +
      Number(ts.shRdHours) + Number(ts.rhHours)    + Number(ts.rhRdHours);
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

  const basicPay =
    payType === 'FIXED_PAY'
      ? monthlyRate / freqDiv
      : updatedTimesheets.reduce(
          (s, t) => (Number(t.regularHours) > 0 ? s + Number(t.dailyGrossPay) : s),
          0,
        );

  const allowanceOnFirstCutoffOnly = compensation?.allowanceOnFirstCutoffOnly ?? true;
  let allowance: number;
  if (allowanceOnFirstCutoffOnly && freq !== 'ONCE_A_MONTH') {
    allowance = isFirstCutoff ? allowanceRate : 0;
  } else {
    allowance = allowanceRate / freqDiv;
  }

  const parseHHMM = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };

  const holidayPay = computeHolidayPay(
    updatedTimesheets,
    holidayMap,
    payType,
    dailyRate,
    startDate,
    endDate,
  );

  // ── Late / Undertime Deduction Splitting Loop ────────────────────────────
  let regularLateUnder = 0;
  let regularHolidayLateUnder = 0;
  let specialHolidayLateUnder = 0;

  if (payType !== 'VARIABLE_PAY' && !guardFlags.disableLateUndertimeGlobal) {
    for (const t of updatedTimesheets) {
      if (!t.timeIn || !t.timeOut) continue;
      const deductMin = Number(t.lateMinutes) + Number(t.undertimeMinutes);
      if (deductMin <= 0) continue;

      const tDow = (t.date as Date).getDay();
      const sd = schedule?.days.find((d) => d.dayOfWeek === tDow) ?? null;
      const sStart = sd?.startTime ? parseHHMM(sd.startTime) : 9 * 60; // 9am standard shift base
      const sEnd   = sd?.endTime   ? parseHHMM(sd.endTime)   : 17 * 60; // 5pm standard shift base
      const brkMin = sd?.breakStart && sd?.breakEnd
          ? parseHHMM(sd.breakEnd) - parseHHMM(sd.breakStart)
          : 60;
          
      const schedMin = Math.max(1, sEnd - sStart - brkMin);
      const rowDeduct = (deductMin / schedMin) * dailyRate;

      const dateKey = t.date.toISOString().slice(0, 10);
      const hType = holidayMap.get(dateKey) ?? null;

      if (hType === 'REGULAR') {
        regularHolidayLateUnder += rowDeduct;
      } else if (hType === 'SPECIAL_NON_WORKING' || hType === 'LOCAL_HOLIDAY') {
        specialHolidayLateUnder += rowDeduct;
      } else {
        regularLateUnder += rowDeduct;
      }
    }
  }

  const lateUndertimeDeduction = regularLateUnder + regularHolidayLateUnder + specialHolidayLateUnder;
  const overtimePay = computeDoleOvertimePay(updatedTimesheets, dailyRate);

  const paidLeavePay = leaveRequests.reduce((s, lr) => {
    // Clamp the leave range to this payroll period — a leave of Jun 15–18 on a
    // Jun 1–15 payroll should only count Jun 15 (1 day), not the full 4 days.
    const overlapStart = new Date(Math.max(lr.startDate.getTime(), startDate.getTime()));
    const overlapEnd   = new Date(Math.min(lr.endDate.getTime(),   endDate.getTime()));

    // Count working days in the overlap (skip rest days per the employee's schedule)
    let days = 0;
    const cursor = new Date(overlapStart);
    while (cursor <= overlapEnd) {
      if (!restDaySet.has(cursor.getUTCDay())) days++;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return s + days * dailyRate;
  }, 0);

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

  const suggestions = {
    basicPay:               parseFloat(basicPay.toFixed(2)),
    holidayPay:             parseFloat(holidayPay.toFixed(2)),
    allowance:              parseFloat(allowance.toFixed(2)),
    overtimePay:            parseFloat(overtimePay.toFixed(2)),
    paidLeavePay:           parseFloat(paidLeavePay.toFixed(2)),
    lateUndertimeDeduction: parseFloat(lateUndertimeDeduction.toFixed(2)),
    regularLateUndertime:   parseFloat(regularLateUnder.toFixed(2)),
    regularHolidayLateUnder: parseFloat(regularHolidayLateUnder.toFixed(2)),
    specialHolidayLateUnder: parseFloat(specialHolidayLateUnder.toFixed(2)),
    sssDeduction:           parseFloat(sssDeduction.toFixed(2)),
    philhealthDeduction:    parseFloat(philhealthDeduction.toFixed(2)),
    pagibigDeduction:       parseFloat(pagibigDeduction.toFixed(2)),
  };

  // ── apply=true: commit suggestions directly to the payslip ─────────────
  const { searchParams } = new URL(request.url);
  const shouldApply = searchParams.get('apply') === 'true';

  if (shouldApply) {
    const existing = await prisma.payslip.findUnique({
      where: { id },
      select: { pagibigLoan: true, sssLoan: true, cashAdvanceRepayment: true },
    });

    const pagibigLoan      = Number(existing?.pagibigLoan ?? 0);
    const sssLoan          = Number(existing?.sssLoan ?? 0);
    const cashAdvRepayment = Number(existing?.cashAdvanceRepayment ?? 0);

    const totalDeductions =
      suggestions.sssDeduction +
      suggestions.philhealthDeduction +
      suggestions.pagibigDeduction +
      suggestions.lateUndertimeDeduction +
      pagibigLoan +
      sssLoan +
      cashAdvRepayment;

    const grossPay = suggestions.basicPay + suggestions.holidayPay + suggestions.overtimePay + suggestions.paidLeavePay + suggestions.allowance;
    const netPay = Math.max(0, grossPay - totalDeductions);

    await prisma.payslip.update({
      where: { id },
      data: {
        basicPay:               suggestions.basicPay,
        holidayPay:             suggestions.holidayPay,
        allowance:              suggestions.allowance,
        overtimePay:            suggestions.overtimePay,
        paidLeavePay:           suggestions.paidLeavePay,
        lateUndertimeDeduction: suggestions.lateUndertimeDeduction,
        sssDeduction:           suggestions.sssDeduction,
        philhealthDeduction:    suggestions.philhealthDeduction,
        pagibigDeduction:       suggestions.pagibigDeduction,
        grossPay,
        totalDeductions,
        netPay,
      },
    });
  }

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'Payslip',
    entityId: id,
    description: `Recalculated payslip ${id}${shouldApply ? ' and applied' : ''}: ${recalcCount} timesheet row(s) updated, ${otRequests.length} OT request(s), ${leaveRequests.length} leave request(s)`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      timesheets: updatedTimesheets,
      suggestions,
      applied: shouldApply,
      meta: {
        recalcCount,
        recalcMessages,
        otRequestCount: otRequests.length,
        leaveRequestCount: leaveRequests.length,
      },
    },
  });
}