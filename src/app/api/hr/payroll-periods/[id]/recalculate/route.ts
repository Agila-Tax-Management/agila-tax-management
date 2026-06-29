import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { computeTimesheetFields, type DayType } from "@/lib/timesheet-calc";
import { computeDoleOvertimePay, sumOtHours, computeHolidayPay } from "@/lib/dole-overtime";
import { loadHrSettingCache, flagsFromCache, applyHrSettingGuards } from "@/lib/hr-settings-guard";
import { getSSSEmployeeDeduction } from "@/lib/sss-contribution";
import {
  getPhilHealthEmployeeDeduction,
  getPagibigEmployeeDeduction,
} from "@/lib/government-contributions";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const resolvedParams = await params;
  const periodId = parseInt(resolvedParams.id, 10);
  if (isNaN(periodId)) return NextResponse.json({ error: "Invalid period ID" }, { status: 400 });

  try {
    // 1. Fetch the exact period and existing payslips
    const period = await prisma.payrollPeriod.findFirst({
      where: { id: periodId, clientId },
      include: { payrollSchedule: true, payslips: true },
    });

    if (!period || !period.payrollSchedule) {
      return NextResponse.json({ error: "Payroll period or schedule not found" }, { status: 404 });
    }

    if (period.status !== "DRAFT" && period.status !== "PROCESSING") {
      return NextResponse.json({ error: `Cannot recalculate a ${period.status} period` }, { status: 400 });
    }

    const { startDate, endDate, payrollScheduleId } = period;
    const employeeIds = period.payslips.map(p => p.employeeId);

    if (employeeIds.length === 0) {
      return NextResponse.json({ error: "No payslips found to recalculate." }, { status: 400 });
    }

    // 2. Fetch compensations EXACTLY like the generation route
    const compensations = await prisma.employeeCompensation.findMany({
      where: {
        payrollScheduleId,
        isActive: true,
        contract: { employment: { employeeId: { in: employeeIds }, clientId } },
      },
      include: {
        contract: {
          include: {
            employment: { select: { employeeId: true } },
            schedule: { include: { days: { orderBy: { dayOfWeek: 'asc' } } } },
          },
        },
      },
    });

    const compensationByEmpId = new Map(
      compensations.map((c) => [c.contract.employment.employeeId, c])
    );

    // 3. Setup Guards, Holidays, OT, Leaves, and Caches (Identical to Generate)
    const hrSettingCache = await loadHrSettingCache(clientId);
    
    const periodHolidays = await prisma.holiday.findMany({
      where: { clientId, date: { gte: startDate, lte: endDate } },
      select: { date: true, type: true },
    });
    const periodHolidayMap = new Map<string, string>(
      periodHolidays.map((h) => [h.date.toISOString().slice(0, 10), h.type])
    );

    const approvedOtRequests = await prisma.overtimeRequest.findMany({
      where: { employeeId: { in: employeeIds }, clientId, status: 'APPROVED', date: { gte: startDate, lte: endDate } },
      select: { employeeId: true, date: true, type: true, hours: true },
    });

    const approvedOtByEmpDate = new Map<string, number>();
    for (const otr of approvedOtRequests) {
      if (otr.type.toLowerCase().includes('rest')) continue;
      const key = `${otr.employeeId}_${otr.date.toISOString().slice(0, 10)}`;
      approvedOtByEmpDate.set(key, (approvedOtByEmpDate.get(key) ?? 0) + parseFloat(otr.hours.toString()));
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
      select: { employeeId: true, startDate: true, endDate: true },
    });

    // 4. Load all Timesheets
    const timesheets = await prisma.timesheet.findMany({
      where: { employeeId: { in: employeeIds }, date: { gte: startDate, lte: endDate } },
    });

    // Recalculate timesheets based on parameters
    for (const ts of timesheets) {
      if (!ts.timeIn || !ts.timeOut) continue;

      const comp = compensationByEmpId.get(ts.employeeId);
      const empSchedule = comp?.contract.schedule ?? null;
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
        ts.timeIn, ts.timeOut, ts.lunchStart, ts.lunchEnd, scheduleDay,
        comp ? { calculatedDailyRate: comp.calculatedDailyRate.toString(), payType: comp.payType } : null,
        dayType
      );

      const isVarPay = comp?.payType === 'VARIABLE_PAY';
      const dRate = Number(comp?.calculatedDailyRate?.toString() || 0);
      const guardFlags = flagsFromCache(hrSettingCache, ts.employeeId);
      const guarded = applyHrSettingGuards(computed, guardFlags, dRate, isVarPay);
      
      const approvedOtKey = `${ts.employeeId}_${dateKey}`;
      const approvedRegOtHours = approvedOtByEmpDate.get(approvedOtKey) ?? 0;
      const finalRegOtHours = Math.max(guarded.regOtHours, approvedRegOtHours);

      await prisma.timesheet.update({
        where: { id: ts.id },
        data: {
          regularHours: guarded.regularHours, lateMinutes: guarded.lateMinutes, undertimeMinutes: guarded.undertimeMinutes,
          regOtHours: finalRegOtHours, rdHours: guarded.rdHours, rdOtHours: guarded.rdOtHours,
          shHours: guarded.shHours, shOtHours: guarded.shOtHours, shRdHours: guarded.shRdHours,
          shRdOtHours: guarded.shRdOtHours, rhHours: guarded.rhHours, rhOtHours: guarded.rhOtHours,
          rhRdHours: guarded.rhRdHours, rhRdOtHours: guarded.rhRdOtHours, dailyGrossPay: guarded.dailyGrossPay,
        },
      });
    }

    // Pull the refreshed timesheets for the final math
    const finalTimesheets = await prisma.timesheet.findMany({
      where: { employeeId: { in: employeeIds }, date: { gte: startDate, lte: endDate } },
    });
    
    const finalTimesheetsByEmp = new Map<number, typeof finalTimesheets>();
    for (const ts of finalTimesheets) {
      const arr = finalTimesheetsByEmp.get(ts.employeeId) ?? [];
      arr.push(ts);
      finalTimesheetsByEmp.set(ts.employeeId, arr);
    }

    // 5. Execute Exact Payslip Math & Update
    let recalculatedCount = 0;
    
    for (const payslip of period.payslips) {
      const employeeId = payslip.employeeId;
      const comp = compensationByEmpId.get(employeeId);
      
      if (!comp) continue; // Safety skip if profile missing

      const empTs = finalTimesheetsByEmp.get(employeeId) ?? [];
      const freq = comp.frequency as 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
      const freqDiv = freq === 'ONCE_A_MONTH' ? 1 : freq === 'TWICE_A_MONTH' ? 2 : 4;
      
      // Parse Decimals safely
      const monthlyRate = Number(comp.calculatedMonthlyRate?.toString() || 0);
      const dailyRate = Number(comp.calculatedDailyRate?.toString() || 0);
      const allowanceRate = Number(comp.allowanceRate?.toString() || 0);

      const isFirstCutoff = startDate.getUTCDate() === period.payrollSchedule.firstPeriodStartDay;
      const allowanceOnFirstCutoffOnly = comp.allowanceOnFirstCutoffOnly ?? true;
      let allowance: number;
      if (allowanceOnFirstCutoffOnly && freq !== 'ONCE_A_MONTH') {
        allowance = isFirstCutoff ? allowanceRate : 0;
      } else {
        allowance = allowanceRate / freqDiv;
      }

      const basicPay = comp.payType === 'FIXED_PAY'
        ? monthlyRate / freqDiv
        : empTs.reduce((s, ts) => (Number(ts.regularHours) > 0 ? s + Number(ts.dailyGrossPay) : s), 0);

      const holidayPay = computeHolidayPay(empTs, periodHolidayMap, comp.payType, dailyRate, startDate, endDate);
      const overtimePay = computeDoleOvertimePay(empTs, dailyRate);

      // Leave Pay Math
      const empLeaves = leaveRequests.filter(lr => lr.employeeId === employeeId);
      let paidLeaveDays = 0;
      const restDays = new Set<number>(comp.contract.schedule?.days.filter(d => !d.isWorkingDay).map(d => d.dayOfWeek) ?? []);
      for (const lr of empLeaves) {
        const overlapStart = new Date(Math.max(lr.startDate.getTime(), startDate.getTime()));
        const overlapEnd   = new Date(Math.min(lr.endDate.getTime(),   endDate.getTime()));
        const cursor = new Date(overlapStart);
        while (cursor <= overlapEnd) {
          if (!restDays.has(cursor.getDay())) paidLeaveDays++;
          cursor.setDate(cursor.getDate() + 1);
        }
      }
      const paidLeavePay = paidLeaveDays * dailyRate;

      // Late Undertime Math
      const empScheduleDays = comp.contract.schedule?.days ?? [];
      const scheduledWorkMinByDow = new Map<number, number>(
        empScheduleDays.map((d) => {
          const start = d.startTime ? Number(d.startTime.split(':')[0]) * 60 + Number(d.startTime.split(':')[1]) : 8 * 60;
          const end = d.endTime ? Number(d.endTime.split(':')[0]) * 60 + Number(d.endTime.split(':')[1]) : 17 * 60;
          const brkS = d.breakStart ? Number(d.breakStart.split(':')[0]) * 60 + Number(d.breakStart.split(':')[1]) : null;
          const brkE = d.breakEnd ? Number(d.breakEnd.split(':')[0]) * 60 + Number(d.breakEnd.split(':')[1]) : null;
          const brk = brkS !== null && brkE !== null && brkE > brkS ? brkE - brkS : 60;
          return [d.dayOfWeek, Math.max(1, end - start - brk)];
        })
      );

      const lateUndertimeDeduction = Number(
        empTs.reduce((s, ts) => {
          const mins = ts.lateMinutes + ts.undertimeMinutes;
          if (mins <= 0) return s;
          const scheduledMin = scheduledWorkMinByDow.get(ts.date.getDay()) ?? 480;
          return s + (mins / scheduledMin) * dailyRate;
        }, 0).toFixed(2)
      );

      // Final Deductions
      const grossPay = basicPay + holidayPay + allowance + overtimePay + paidLeavePay;

      const sssDeduction = comp.deductSss ? getSSSEmployeeDeduction(monthlyRate, freq) : 0;
      const philhealthDeduction = comp.deductPhilhealth ? getPhilHealthEmployeeDeduction(monthlyRate, freq) : 0;
      const pagibigDeduction = comp.deductPagibig ? getPagibigEmployeeDeduction(monthlyRate, comp.pagibigType as 'REGULAR' | 'MINIMUM', freq) : 0;

      // Keep existing manual inputs / loans
      const withholdingTax = Number(payslip.withholdingTax?.toString() || 0);
      const pagibigLoan = Number(payslip.pagibigLoan?.toString() || 0);
      const sssLoan = Number(payslip.sssLoan?.toString() || 0);
      const cashAdvanceRepayment = Number(payslip.cashAdvanceRepayment?.toString() || 0);
      
      const lateUndertimeForTotal = comp.payType === 'FIXED_PAY' ? lateUndertimeDeduction : 0;
      
      const totalDeductions = sssDeduction + philhealthDeduction + pagibigDeduction + withholdingTax + lateUndertimeForTotal + pagibigLoan + sssLoan + cashAdvanceRepayment;
      const netPay = Math.max(0, grossPay - totalDeductions);

      // Execution updates
      await prisma.payslip.update({
        where: { id: payslip.id },
        data: {
          basicPay,
          holidayPay,
          allowance,
          overtimePay,
          paidLeavePay,
          grossPay,
          sssDeduction,
          philhealthDeduction,
          pagibigDeduction,
          withholdingTax,
          pagibigLoan,
          sssLoan,
          cashAdvanceRepayment,
          lateUndertimeDeduction,
          totalDeductions,
          netPay,
        },
      });

      recalculatedCount++;
    }

    void logActivity({
      userId: session.user.id,
      action: "UPDATED",
      entity: "PayrollPeriod",
      entityId: String(period.id),
      description: `Batch recalculated payroll period (ID: ${period.id}). Refreshed ${recalculatedCount} payslips.`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ success: true, count: recalculatedCount }, { status: 200 });
  } catch (error) {
    console.error("Period recalculation error:", error);
    return NextResponse.json({ error: "An error occurred during recalculation" }, { status: 500 });
  }
}