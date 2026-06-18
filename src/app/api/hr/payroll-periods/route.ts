import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { computeTimesheetFields, type DayType } from "@/lib/timesheet-calc";
import { computeDoleOvertimePay, sumOtHours } from "@/lib/dole-overtime";
import { loadHrSettingCache, flagsFromCache, applyHrSettingGuards } from "@/lib/hr-settings-guard";
import { getSSSEmployeeDeduction } from "@/lib/sss-contribution";
import {
  getPhilHealthEmployeeDeduction,
  getPagibigEmployeeDeduction,
} from "@/lib/government-contributions";

function resolveEndDay(year: number, month1based: number, configuredDay: number): number {
  const lastDayOfMonth = new Date(year, month1based, 0).getDate();
  return Math.min(configuredDay, lastDayOfMonth);
}

const generateSchema = z.object({
  payrollScheduleId: z.string().min(1, "Payroll schedule is required"),
  periodNumber: z.union([z.literal(1), z.literal(2)]),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const periods = await prisma.payrollPeriod.findMany({
    where: { clientId },
    orderBy: { startDate: "desc" },
    include: {
      payrollSchedule: { select: { id: true, name: true, frequency: true } },
      _count: { select: { payslips: true } },
      payslips: {
        select: { grossPay: true, netPay: true, totalDeductions: true },
      },
    },
  });

  const result = periods.map((p) => ({
    id: p.id,
    payrollScheduleId: p.payrollScheduleId,
    payrollSchedule: p.payrollSchedule,
    startDate: p.startDate,
    endDate: p.endDate,
    payoutDate: p.payoutDate,
    status: p.status,
    employeeCount: p._count.payslips,
    grossPayTotal: p.payslips.reduce((s, ps) => s + Number(ps.grossPay), 0),
    netPayTotal: p.payslips.reduce((s, ps) => s + Number(ps.netPay), 0),
    totalDeductionsSum: p.payslips.reduce((s, ps) => s + Number(ps.totalDeductions), 0),
  }));

  return NextResponse.json({ data: result });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "ADMIN" &&
    !session.portalAccess?.HR?.canWrite
  ) {
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

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { payrollScheduleId, periodNumber, year, month } = parsed.data;

  const schedule = await prisma.payrollSchedule.findFirst({
    where: { id: payrollScheduleId, clientId, isActive: true },
  });
  if (!schedule) {
    return NextResponse.json(
      { error: "Payroll schedule not found or inactive" },
      { status: 404 },
    );
  }

  const startDay = periodNumber === 1 ? schedule.firstPeriodStartDay : (schedule.secondPeriodStartDay ?? null);
  const endDayConfig = periodNumber === 1 ? schedule.firstPeriodEndDay : (schedule.secondPeriodEndDay ?? null);
  const payoutDayConfig = periodNumber === 1 ? schedule.firstPayoutDay : (schedule.secondPayoutDay ?? null);

  if (startDay === null || endDayConfig === null || payoutDayConfig === null) {
    return NextResponse.json(
      { error: "Second period dates are not configured on this schedule" },
      { status: 400 },
    );
  }

  const resolvedEndDay = resolveEndDay(year, month, endDayConfig);
  const startDate = new Date(Date.UTC(year, month - 1, startDay));
  const endDate = new Date(Date.UTC(year, month - 1, resolvedEndDay));

  let payoutMonth = month;
  let payoutYear = year;
  if (payoutDayConfig < startDay) {
    payoutMonth += 1;
    if (payoutMonth > 12) {
      payoutMonth = 1;
      payoutYear += 1;
    }
  }
  const resolvedPayoutDay = resolveEndDay(payoutYear, payoutMonth, payoutDayConfig);
  const payoutDate = new Date(Date.UTC(payoutYear, payoutMonth - 1, resolvedPayoutDay));

  const existing = await prisma.payrollPeriod.findFirst({
    where: { payrollScheduleId, startDate, endDate },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A payroll period for this date range already exists" },
      { status: 409 },
    );
  }

  // FIX: Employee filter correctly includes mid-period hires (lte: endDate)
  const compensations = await prisma.employeeCompensation.findMany({
    where: {
      payrollScheduleId,
      isActive: true,
      contract: {
        status: 'ACTIVE',
        employment: {
          clientId,
          employmentStatus: 'ACTIVE',
          isPastRole: false,
          employee: { softDelete: false },
          OR: [
            { hireDate: null },
            { hireDate: { lte: endDate } }, 
          ],
        },
      },
    },
    include: {
      contract: {
        include: {
          employment: { select: { employeeId: true } },
          schedule: {
            include: { days: { orderBy: { dayOfWeek: 'asc' } } },
          },
        },
      },
    },
  });

  if (compensations.length === 0) {
    return NextResponse.json(
      { error: "No active employees are assigned to this payroll schedule" },
      { status: 400 },
    );
  }

  const employeeIds = [...new Set(compensations.map((c) => c.contract.employment.employeeId))];

  const hrSettingCache = await loadHrSettingCache(clientId);
  const approvedOtRequests = await prisma.overtimeRequest.findMany({
    where: {
      employeeId: { in: employeeIds },
      clientId,
      status: 'APPROVED',
      date: { gte: startDate, lte: endDate },
    },
    select: { employeeId: true, date: true, type: true, hours: true },
  });

  const approvedOtByEmpDate = new Map<string, number>();
  for (const otr of approvedOtRequests) {
    if (otr.type.toLowerCase().includes('rest')) continue;
    const key = `${otr.employeeId}_${otr.date.toISOString().slice(0, 10)}`;
    approvedOtByEmpDate.set(key, (approvedOtByEmpDate.get(key) ?? 0) + parseFloat(otr.hours.toString()));
  }

  const timesheets = await prisma.timesheet.findMany({
    where: {
      employeeId: { in: employeeIds },
      date: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      employeeId: true,
      date: true,
      timeIn: true,
      timeOut: true,
      lunchStart: true,
      lunchEnd: true,
      regularHours: true,
      regOtHours: true,
      rdOtHours: true,
      shOtHours: true,
      shRdOtHours: true,
      rhOtHours: true,
      rhRdOtHours: true,
      shHours: true,
      rhHours: true,
      lateMinutes: true,
      undertimeMinutes: true,
      dailyGrossPay: true,
    },
  });

  const timesheetsByEmp = new Map<number, typeof timesheets>();
  for (const ts of timesheets) {
    const arr = timesheetsByEmp.get(ts.employeeId) ?? [];
    arr.push(ts);
    timesheetsByEmp.set(ts.employeeId, arr);
  }

  const cashAdvances = await prisma.cashAdvance.findMany({
    where: { employeeId: { in: employeeIds }, status: "ACTIVE" },
  });
  const advancesByEmp = new Map<number, typeof cashAdvances>();
  for (const adv of cashAdvances) {
    const arr = advancesByEmp.get(adv.employeeId) ?? [];
    arr.push(adv);
    advancesByEmp.set(adv.employeeId, arr);
  }

  // FIX: Type-safe holiday query satisfying required Int schema rules
  const periodHolidays = await prisma.holiday.findMany({
    where: { 
      clientId,
      date: { gte: startDate, lte: endDate } 
    },
    select: { date: true, type: true },
  });
  const periodHolidayMap = new Map<string, string>(
    periodHolidays.map((h) => [h.date.toISOString().slice(0, 10), h.type]),
  );

  const compensationByEmpId = new Map(
    compensations.map((c) => [c.contract.employment.employeeId, c]),
  );
  
  let timesheetRecalcCount = 0;
  for (const ts of timesheets) {
    if (!ts.timeIn || !ts.timeOut) continue;

    const emp = compensationByEmpId.get(ts.employeeId);
    const empSchedule = emp?.contract.schedule ?? null;
    const dow = ts.date.getDay();
    const scheduleDay = empSchedule?.days.find((d) => d.dayOfWeek === dow) ?? null;
    const isRestDay = scheduleDay ? !scheduleDay.isWorkingDay : false;
    const dateKey = ts.date.toISOString().slice(0, 10);
    const holidayType = periodHolidayMap.get(dateKey) ?? null;

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
      emp ? { calculatedDailyRate: emp.calculatedDailyRate.toString(), payType: emp.payType } : null,
      dayType,
    );

    const isVarPay = emp?.payType === 'VARIABLE_PAY';
    const dRate = Number(emp?.calculatedDailyRate ?? 0);
    const guardFlags = flagsFromCache(hrSettingCache, ts.employeeId);
    const guarded = applyHrSettingGuards(computed, guardFlags, dRate, isVarPay);
    
    const approvedOtKey = `${ts.employeeId}_${dateKey}`;
    const approvedRegOtHours = approvedOtByEmpDate.get(approvedOtKey) ?? 0;
    const finalRegOtHours = Math.max(guarded.regOtHours, approvedRegOtHours);

    const updatedStatus =
      dayType === 'REGULAR_HOLIDAY' || dayType === 'REGULAR_HOLIDAY_REST' ? ('REGULAR_HOLIDAY' as const)
      : dayType === 'SPECIAL_HOLIDAY' || dayType === 'SPECIAL_HOLIDAY_REST' ? ('SPECIAL_HOLIDAY' as const)
      : undefined;

    await prisma.timesheet.update({
      where: { id: ts.id },
      data: {
        regularHours: guarded.regularHours,
        lateMinutes: guarded.lateMinutes,
        undertimeMinutes: guarded.undertimeMinutes,
        regOtHours: finalRegOtHours,
        rdHours: guarded.rdHours,
        rdOtHours: guarded.rdOtHours,
        shHours: guarded.shHours,
        shOtHours: guarded.shOtHours,
        shRdHours: guarded.shRdHours,
        shRdOtHours: guarded.shRdOtHours,
        rhHours: guarded.rhHours,
        rhOtHours: guarded.rhOtHours,
        rhRdHours: guarded.rhRdHours,
        rhRdOtHours: guarded.rhRdOtHours,
        dailyGrossPay: guarded.dailyGrossPay,
        ...(updatedStatus ? { status: updatedStatus } : {}),
      },
    });
    timesheetRecalcCount++;
  }

  let finalTimesheets = timesheets;
  if (timesheetRecalcCount > 0) {
    finalTimesheets = await prisma.timesheet.findMany({
      where: { employeeId: { in: employeeIds }, date: { gte: startDate, lte: endDate } },
      select: {
        id: true,
        employeeId: true,
        date: true,
        timeIn: true,
        timeOut: true,
        lunchStart: true,
        lunchEnd: true,
        regularHours: true,
        regOtHours: true,
        rdOtHours: true,
        shOtHours: true,
        shRdOtHours: true,
        rhOtHours: true,
        rhRdOtHours: true,
        shHours: true,
        rhHours: true,
        lateMinutes: true,
        undertimeMinutes: true,
        dailyGrossPay: true,
      },
    });
  }

  const finalTimesheetsByEmp = new Map<number, typeof finalTimesheets>();
  for (const ts of finalTimesheets) {
    const arr = finalTimesheetsByEmp.get(ts.employeeId) ?? [];
    arr.push(ts);
    finalTimesheetsByEmp.set(ts.employeeId, arr);
  }

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: employeeIds },
      clientId,
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      leaveType: { isPaid: true },
    },
    select: { employeeId: true, creditUsed: true },
  });

  const leaveByEmp = new Map<number, number>();
  for (const lr of leaveRequests) {
    leaveByEmp.set(lr.employeeId, (leaveByEmp.get(lr.employeeId) ?? 0) + Number(lr.creditUsed));
  }

  const period = await prisma.$transaction(async (tx) => {
    const newPeriod = await tx.payrollPeriod.create({
      data: { clientId, payrollScheduleId, startDate, endDate, payoutDate, status: "DRAFT" },
    });

    for (const comp of compensations) {
      const employeeId = comp.contract.employment.employeeId;
      const empTs = finalTimesheetsByEmp.get(employeeId) ?? [];
      const freq = comp.frequency as 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
      const freqDiv = freq === 'ONCE_A_MONTH' ? 1 : freq === 'TWICE_A_MONTH' ? 2 : 4;
      const monthlyRate = Number(comp.calculatedMonthlyRate);
      const dailyRate = Number(comp.calculatedDailyRate);
      const allowanceRate = Number(comp.allowanceRate);

      const isFirstCutoff = startDate.getUTCDate() === schedule.firstPeriodStartDay;
      const allowanceOnFirstCutoffOnly = comp.allowanceOnFirstCutoffOnly ?? true;
      let allowance: number;
      if (allowanceOnFirstCutoffOnly && freq !== 'ONCE_A_MONTH') {
        allowance = isFirstCutoff ? allowanceRate : 0;
      } else {
        allowance = allowanceRate / freqDiv;
      }

      const basicPay = comp.payType === 'FIXED_PAY'
        ? monthlyRate / freqDiv
        : empTs.reduce((s, ts) => s + Number(ts.dailyGrossPay), 0);

      const overtimePay = computeDoleOvertimePay(empTs, dailyRate);
      const paidLeavePay = (leaveByEmp.get(employeeId) ?? 0) * dailyRate;

      const totalRegularHours = empTs.reduce((s, ts) => s + Number(ts.regularHours), 0);
      const totalOvertimeHours = sumOtHours(empTs);
      const totalHolidayHours = empTs.reduce((s, ts) => s + Number(ts.shHours) + Number(ts.rhHours), 0);
      const totalLateMins = empTs.reduce((s, ts) => s + ts.lateMinutes, 0);
      const totalUndertimeMins = empTs.reduce((s, ts) => s + ts.undertimeMinutes, 0);
      const totalRegularDays = empTs.filter((ts) => Number(ts.regularHours) > 0).length;

      // ── Late / undertime deduction ──────────────────────────────────────────
      // Derive scheduled work minutes from the employee's work schedule (default 480 = 8 h).
      // For FIXED_PAY: late/undertime reduces pay (it is not already baked in).
      // For VARIABLE_PAY: late/undertime is already deducted inside dailyGrossPay —
      //   we only store the value for display; it does NOT reduce grossPay again.
      const empScheduleDays = comp.contract.schedule?.days ?? [];
      const scheduledWorkMinByDow = new Map<number, number>(
        empScheduleDays.map((d) => {
          const start = d.startTime ? Number(d.startTime.split(':')[0]) * 60 + Number(d.startTime.split(':')[1]) : 8 * 60;
          const end = d.endTime ? Number(d.endTime.split(':')[0]) * 60 + Number(d.endTime.split(':')[1]) : 17 * 60;
          const brkS = d.breakStart ? Number(d.breakStart.split(':')[0]) * 60 + Number(d.breakStart.split(':')[1]) : null;
          const brkE = d.breakEnd ? Number(d.breakEnd.split(':')[0]) * 60 + Number(d.breakEnd.split(':')[1]) : null;
          const brk = brkS !== null && brkE !== null && brkE > brkS ? brkE - brkS : 60;
          return [d.dayOfWeek, Math.max(1, end - start - brk)];
        }),
      );

      const lateUndertimeDeduction = Number(
        empTs.reduce((s, ts) => {
          const mins = ts.lateMinutes + ts.undertimeMinutes;
          if (mins <= 0) return s;
          const scheduledMin = scheduledWorkMinByDow.get(ts.date.getDay()) ?? 480;
          return s + (mins / scheduledMin) * dailyRate;
        }, 0).toFixed(2),
      );

      const grossPay = basicPay + allowance + overtimePay + paidLeavePay;

      const sssDeduction = comp.deductSss ? getSSSEmployeeDeduction(monthlyRate, freq) : 0;
      const philhealthDeduction = comp.deductPhilhealth ? getPhilHealthEmployeeDeduction(monthlyRate, freq) : 0;
      const pagibigDeduction = comp.deductPagibig ? getPagibigEmployeeDeduction(monthlyRate, comp.pagibigType as 'REGULAR' | 'MINIMUM', freq) : 0;

      const empAdvances = advancesByEmp.get(employeeId) ?? [];
      const cashAdvanceRepayment = empAdvances.reduce((s, adv) => s + Number(adv.installmentAmount), 0);

      // For FIXED_PAY the late/undertime must reduce net pay explicitly.
      // For VARIABLE_PAY it is already reflected in basicPay (dailyGrossPay sum).
      const lateUndertimeForTotal = comp.payType === 'FIXED_PAY' ? lateUndertimeDeduction : 0;
      const totalDeductions = sssDeduction + philhealthDeduction + pagibigDeduction + cashAdvanceRepayment + lateUndertimeForTotal;
      const netPay = Math.max(0, grossPay - totalDeductions);

      const payslip = await tx.payslip.create({
        data: {
          payrollPeriodId: newPeriod.id,
          employeeId,
          totalRegularDays,
          totalRegularHours,
          totalOvertimeHours,
          totalHolidayHours,
          totalLateMins,
          totalUndertimeMins,
          basicPay,
          allowance,
          overtimePay,
          paidLeavePay,
          grossPay,
          sssDeduction,
          philhealthDeduction,
          pagibigDeduction,
          cashAdvanceRepayment,
          lateUndertimeDeduction,
          totalDeductions,
          netPay,
          preparedById: session.user.id,
          preparedAt: new Date(),
        },
      });

      for (const adv of empAdvances) {
        const amount = Number(adv.installmentAmount);
        await tx.cashAdvanceDeduction.create({
          data: { cashAdvanceId: adv.id, payslipId: payslip.id, amountDeducted: amount },
        });

        const newBalance = Math.max(0, Number(adv.remainingBalance) - amount);
        await tx.cashAdvance.update({
          where: { id: adv.id },
          data: { remainingBalance: newBalance, status: newBalance <= 0 ? "COMPLETED" : "ACTIVE" },
        });
      }
    }

    return newPeriod;
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "PayrollPeriod",
    entityId: String(period.id),
    description: `Generated payroll period ${startDate.toLocaleDateString("en-PH")} – ${endDate.toLocaleDateString("en-PH")} for schedule "${schedule.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: period }, { status: 201 });
}