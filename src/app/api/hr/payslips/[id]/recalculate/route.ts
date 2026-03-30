// src/app/api/hr/payslips/[id]/recalculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { computeTimesheetFields } from '@/lib/timesheet-calc';
import {
  getSSSEmployeeDeduction,
  getPhilHealthEmployeeDeduction,
  getPagibigEmployeeDeduction,
} from '@/lib/government-contributions';
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
      payrollPeriod: { select: { startDate: true, endDate: true } },
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

  // ── 2. Recalculate rows that have timeIn + timeOut but regularHours = 0 ──
  // This covers COA-corrected rows that were patched after payroll generation,
  // or clock-outs that happened before the calculation utility was in place.
  const recalcMessages: string[] = [];
  let recalcCount = 0;

  for (const ts of timesheets) {
    if (!ts.timeIn || !ts.timeOut) continue;
    if (Number(ts.regularHours) > 0) continue; // already computed correctly

    const dow = ts.date.getDay();
    const scheduleDay = schedule?.days.find((d) => d.dayOfWeek === dow) ?? null;

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

    recalcMessages.push(
      `${ts.date.toISOString().slice(0, 10)}: regularHours fixed to ${computed.regularHours}h`,
    );
    recalcCount++;
  }

  // ── 3. Re-fetch updated timesheets ───────────────────────────────────────
  const updatedTimesheets = await prisma.timesheet.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  // ── 4. Approved OT requests for the period ───────────────────────────────
  const otRequests = await prisma.overtimeRequest.findMany({
    where: {
      employeeId,
      clientId,
      status: 'APPROVED',
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true, type: true, hours: true },
  });

  // ── 5. Approved paid leave requests that overlap the period ─────────────
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

  // ── 6. Compute all suggested values ─────────────────────────────────────
  const dailyRate   = Number(compensation?.calculatedDailyRate ?? 0);
  const monthlyRate = Number(compensation?.calculatedMonthlyRate ?? 0);
  const allowanceRate = Number(compensation?.allowanceRate ?? 0);
  const payType = compensation?.payType ?? 'FIXED_PAY';
  const freq = (compensation?.frequency ?? 'TWICE_A_MONTH') as 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
  const freqDiv = freq === 'ONCE_A_MONTH' ? 1 : freq === 'TWICE_A_MONTH' ? 2 : 4;

  // Basic pay: VARIABLE_PAY sums actual per-day earnings; FIXED_PAY uses prorated monthly
  const basicPay =
    payType === 'VARIABLE_PAY'
      ? updatedTimesheets.reduce((s, t) => s + Number(t.dailyGrossPay), 0)
      : monthlyRate / freqDiv;

  // Allowance: always prorated
  const allowance = allowanceRate / freqDiv;

  // Overtime pay: approved OT hours × (dailyRate / 8) × 1.25 (DOLE regular-day OT rate)
  const hourlyRate = dailyRate / 8;
  const overtimePay = otRequests.reduce(
    (s, ot) => s + Number(ot.hours) * hourlyRate * 1.25,
    0,
  );

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
        basicPay: parseFloat(basicPay.toFixed(2)),
        allowance: parseFloat(allowance.toFixed(2)),
        overtimePay: parseFloat(overtimePay.toFixed(2)),
        paidLeavePay: parseFloat(paidLeavePay.toFixed(2)),
        sssDeduction: parseFloat(sssDeduction.toFixed(2)),
        philhealthDeduction: parseFloat(philhealthDeduction.toFixed(2)),
        pagibigDeduction: parseFloat(pagibigDeduction.toFixed(2)),
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
