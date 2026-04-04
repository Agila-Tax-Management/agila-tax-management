// src/app/api/hr/payroll-periods/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { computeTimesheetFields } from "@/lib/timesheet-calc";
import { computeDoleOvertimePay, sumOtHours } from "@/lib/dole-overtime";
import { getSSSEmployeeDeduction } from "@/lib/sss-contribution";
import {
  getPhilHealthEmployeeDeduction,
  getPagibigEmployeeDeduction,
} from "@/lib/government-contributions";

/**
 * Resolves a configured end-of-period day against the actual calendar.
 * Handles EOM: configuredDay=31 → 28/29 for February, 30 for April, etc.
 *
 * @param year        - Calendar year
 * @param month1based - 1-indexed month (1=January … 12=December)
 * @param configuredDay - The day stored in PayrollSchedule (31 = "End of Month")
 */
function resolveEndDay(year: number, month1based: number, configuredDay: number): number {
  // new Date(year, month1based, 0) is day-0 of the next JS-month, which equals
  // the last calendar day of month1based (1-indexed). e.g. new Date(2026, 2, 0) → Feb 28 2026
  const lastDayOfMonth = new Date(year, month1based, 0).getDate();
  return Math.min(configuredDay, lastDayOfMonth);
}

const generateSchema = z.object({
  payrollScheduleId: z.string().min(1, "Payroll schedule is required"),
  periodNumber: z.union([z.literal(1), z.literal(2)]),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

/**
 * GET /api/hr/payroll-periods
 * Returns all payroll periods for the current client with aggregated payslip totals.
 */
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

/**
 * POST /api/hr/payroll-periods
 * Generates a new payroll period and creates DRAFT payslips for all employees
 * assigned to the given schedule. Handles EOM, cash advances, and all
 * DOLE-compliant government deductions in a single atomic transaction.
 *
 * Body: { payrollScheduleId, periodNumber (1|2), year, month }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
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

  // Verify the schedule belongs to this client and is active
  const schedule = await prisma.payrollSchedule.findFirst({
    where: { id: payrollScheduleId, clientId, isActive: true },
  });
  if (!schedule) {
    return NextResponse.json(
      { error: "Payroll schedule not found or inactive" },
      { status: 404 },
    );
  }

  // Resolve the correct start/end/payout day configs for the requested period
  const startDay =
    periodNumber === 1 ? schedule.firstPeriodStartDay : (schedule.secondPeriodStartDay ?? null);
  const endDayConfig =
    periodNumber === 1 ? schedule.firstPeriodEndDay : (schedule.secondPeriodEndDay ?? null);
  const payoutDayConfig =
    periodNumber === 1 ? schedule.firstPayoutDay : (schedule.secondPayoutDay ?? null);

  if (startDay === null || endDayConfig === null || payoutDayConfig === null) {
    return NextResponse.json(
      { error: "Second period dates are not configured on this schedule" },
      { status: 400 },
    );
  }

  // Resolve actual calendar dates, handling EOM
  const resolvedEndDay = resolveEndDay(year, month, endDayConfig);
  const startDate = new Date(Date.UTC(year, month - 1, startDay));
  const endDate = new Date(Date.UTC(year, month - 1, resolvedEndDay));

  // Payout date: if payoutDay < startDay, the payout falls in the next month
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

  // Guard against duplicate periods for the same schedule + date range
  const existing = await prisma.payrollPeriod.findFirst({
    where: { payrollScheduleId, startDate, endDate },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A payroll period for this date range already exists" },
      { status: 409 },
    );
  }

  // Fetch all active compensations linked to this schedule (employees of this client).
  // Only include employees whose hire date is on or before the period start date
  // (employees hired after the period start are excluded from this payroll run).
  const compensations = await prisma.employeeCompensation.findMany({
    where: {
      payrollScheduleId,
      isActive: true,
      contract: {
        employment: {
          clientId,
          OR: [
            { hireDate: null },
            { hireDate: { lte: startDate } },
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

  // Fetch timesheet records for the period
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

  // Index timesheets by employeeId for O(1) lookups
  const timesheetsByEmp = new Map<number, typeof timesheets>();
  for (const ts of timesheets) {
    const arr = timesheetsByEmp.get(ts.employeeId) ?? [];
    arr.push(ts);
    timesheetsByEmp.set(ts.employeeId, arr);
  }

  // Fetch active cash advances for these employees
  const cashAdvances = await prisma.cashAdvance.findMany({
    where: { employeeId: { in: employeeIds }, status: "ACTIVE" },
  });
  const advancesByEmp = new Map<number, typeof cashAdvances>();
  for (const adv of cashAdvances) {
    const arr = advancesByEmp.get(adv.employeeId) ?? [];
    arr.push(adv);
    advancesByEmp.set(adv.employeeId, arr);
  }

  // ── Pre-transaction: re-compute timesheet rows with timeIn+timeOut but regularHours=0 ──
  // This covers COA-corrected punches that were approved after payroll generation.
  const compensationByEmpId = new Map(
    compensations.map((c) => [c.contract.employment.employeeId, c]),
  );
  let timesheetRecalcCount = 0;
  for (const ts of timesheets) {
    if (!ts.timeIn || !ts.timeOut) continue;
    // Skip rows already computed: regularHours > 0 = regular day done;
    // dailyGrossPay > 0 = holiday/rest-day premium row already computed.
    if (Number(ts.regularHours) > 0 || Number(ts.dailyGrossPay) > 0) continue;

    const emp = compensationByEmpId.get(ts.employeeId);
    const empSchedule = emp?.contract.schedule ?? null;
    const dow = ts.date.getDay();
    const scheduleDay = empSchedule?.days.find((d) => d.dayOfWeek === dow) ?? null;

    const computed = computeTimesheetFields(
      ts.timeIn,
      ts.timeOut,
      ts.lunchStart,
      ts.lunchEnd,
      scheduleDay,
      emp ? {
        calculatedDailyRate: emp.calculatedDailyRate.toString(),
        payType: emp.payType,
      } : null,
    );

    await prisma.timesheet.update({
      where: { id: ts.id },
      data: {
        regularHours: computed.regularHours,
        lateMinutes: computed.lateMinutes,
        undertimeMinutes: computed.undertimeMinutes,
        regOtHours: computed.regOtHours,
        dailyGrossPay: computed.dailyGrossPay,
      },
    });
    timesheetRecalcCount++;
  }

  // Re-fetch timesheets if any rows were updated
  let finalTimesheets = timesheets;
  if (timesheetRecalcCount > 0) {
    finalTimesheets = await prisma.timesheet.findMany({
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
  }

  // Re-index final timesheets by employeeId
  const finalTimesheetsByEmp = new Map<number, typeof finalTimesheets>();
  for (const ts of finalTimesheets) {
    const arr = finalTimesheetsByEmp.get(ts.employeeId) ?? [];
    arr.push(ts);
    finalTimesheetsByEmp.set(ts.employeeId, arr);
  }

  // Fetch approved paid leave requests that overlap the period
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: employeeIds },
      clientId,
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      leaveType: { isPaid: true },
    },
    select: {
      employeeId: true,
      creditUsed: true,
    },
  });

  // Index paid leave credits by employeeId
  const leaveByEmp = new Map<number, number>();
  for (const lr of leaveRequests) {
    leaveByEmp.set(lr.employeeId, (leaveByEmp.get(lr.employeeId) ?? 0) + Number(lr.creditUsed));
  }

  // Run in a single atomic transaction
  const period = await prisma.$transaction(async (tx) => {
    const newPeriod = await tx.payrollPeriod.create({
      data: {
        clientId,
        payrollScheduleId,
        startDate,
        endDate,
        payoutDate,
        status: "DRAFT",
      },
    });

    for (const comp of compensations) {
      const employeeId = comp.contract.employment.employeeId;
      const empTs = finalTimesheetsByEmp.get(employeeId) ?? [];
      const freq = comp.frequency as 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
      const freqDiv = freq === 'ONCE_A_MONTH' ? 1 : freq === 'TWICE_A_MONTH' ? 2 : 4;
      const monthlyRate = Number(comp.calculatedMonthlyRate);
      const dailyRate = Number(comp.calculatedDailyRate);
      const allowanceRate = Number(comp.allowanceRate);

      // Allowance: respect allowanceOnFirstCutoffOnly flag
      const isFirstCutoff = startDate.getUTCDate() === schedule.firstPeriodStartDay;
      const allowanceOnFirstCutoffOnly = comp.allowanceOnFirstCutoffOnly ?? true;
      let allowance: number;
      if (allowanceOnFirstCutoffOnly && freq !== 'ONCE_A_MONTH') {
        allowance = isFirstCutoff ? allowanceRate : 0;
      } else {
        allowance = allowanceRate / freqDiv;
      }

      // Basic pay:
      //   FIXED_PAY  → full periodic salary regardless of attendance.
      //   VARIABLE_PAY → sum actual dailyGrossPay from timesheet (reflects absences
      //                  and late/undertime deductions; absent days have no row).
      const basicPay =
        comp.payType === 'FIXED_PAY'
          ? monthlyRate / freqDiv
          : empTs.reduce((s, ts) => s + Number(ts.dailyGrossPay), 0);

      // Overtime pay: DOLE-compliant per OT type using approved timesheet OT hours
      const overtimePay = computeDoleOvertimePay(empTs, dailyRate);

      // Paid leave pay: approved paid leave credits × dailyRate
      const paidLeavePay = (leaveByEmp.get(employeeId) ?? 0) * dailyRate;

      // Frozen hour summaries for the payslip audit trail
      const totalRegularHours = empTs.reduce((s, ts) => s + Number(ts.regularHours), 0);
      const totalOvertimeHours = sumOtHours(empTs);
      const totalHolidayHours = empTs.reduce(
        (s, ts) => s + Number(ts.shHours) + Number(ts.rhHours),
        0,
      );
      const totalLateMins = empTs.reduce((s, ts) => s + ts.lateMinutes, 0);
      const totalUndertimeMins = empTs.reduce((s, ts) => s + ts.undertimeMinutes, 0);
      const totalRegularDays = empTs.filter((ts) => Number(ts.regularHours) > 0).length;

      const grossPay = basicPay + allowance + overtimePay + paidLeavePay;

      // Government deductions (only if enabled on the employee's compensation)
      const sssDeduction = comp.deductSss
        ? getSSSEmployeeDeduction(monthlyRate, freq)
        : 0;
      const philhealthDeduction = comp.deductPhilhealth
        ? getPhilHealthEmployeeDeduction(monthlyRate, freq)
        : 0;
      const pagibigDeduction = comp.deductPagibig
        ? getPagibigEmployeeDeduction(
            monthlyRate,
            comp.pagibigType as 'REGULAR' | 'MINIMUM',
            freq,
          )
        : 0;

      // Cash advance repayment: sum all active installment amounts for this employee
      const empAdvances = advancesByEmp.get(employeeId) ?? [];
      const cashAdvanceRepayment = empAdvances.reduce(
        (s, adv) => s + Number(adv.installmentAmount),
        0,
      );

      const totalDeductions = sssDeduction + philhealthDeduction + pagibigDeduction + cashAdvanceRepayment;
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
          totalDeductions,
          netPay,
          preparedById: session.user.id,
          preparedAt: new Date(),
        },
      });

      // Create the repayment ledger entries and update each advance's remaining balance
      for (const adv of empAdvances) {
        const amount = Number(adv.installmentAmount);
        await tx.cashAdvanceDeduction.create({
          data: {
            cashAdvanceId: adv.id,
            payslipId: payslip.id,
            amountDeducted: amount,
          },
        });

        const newBalance = Math.max(0, Number(adv.remainingBalance) - amount);
        await tx.cashAdvance.update({
          where: { id: adv.id },
          data: {
            remainingBalance: newBalance,
            status: newBalance <= 0 ? "COMPLETED" : "ACTIVE",
          },
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
