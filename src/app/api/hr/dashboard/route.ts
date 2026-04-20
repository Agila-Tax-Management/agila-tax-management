// src/app/api/hr/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * GET /api/hr/dashboard
 * Aggregates all HR KPI data in a single round-trip for the dashboard.
 *
 * Returns:
 *  - employees:        { total, active, byDepartment }
 *  - pendingRequests:  { leaveCount, overtimeCount, coaCount, total, items[] }
 *  - todayAttendance:  { present, late, absent, onLeave, total }
 *  - latestPayrollPeriod: period object or null
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const [
    allEmployees,
    departments,
    pendingLeaves,
    pendingOT,
    pendingCoa,
    todayTimesheets,
    payrollPeriods,
    totalEmployeeCount,
  ] = await Promise.all([
    // Active employee count
    prisma.employee.count({
      where: {
        softDelete: false,
        active: true,
        employments: { some: { clientId, employmentStatus: 'ACTIVE', isPastRole: false } },
      },
    }),

    // Departments with headcount
    prisma.department.findMany({
      where: { clientId },
      select: {
        name: true,
        _count: { select: { employments: { where: { employmentStatus: 'ACTIVE', isPastRole: false } } } },
      },
      orderBy: { name: 'asc' },
    }),

    // Pending leave requests — up to 5 for action panel
    prisma.leaveRequest.findMany({
      where: { clientId, status: 'PENDING' },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    }),

    // Pending overtime requests — up to 5
    prisma.overtimeRequest.findMany({
      where: { clientId, status: 'PENDING' },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    }),

    // Pending COA requests — up to 5
    prisma.coaRequest.findMany({
      where: { clientId, status: 'PENDING' },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    }),

    // Today's timesheets for attendance stats (aggregated by status)
    prisma.timesheet.groupBy({
      by: ['status'],
      where: { clientId, date: todayUtc },
      _count: { status: true },
      _sum: { lateMinutes: true },
    }),

    // Latest payroll period (most recent, non-CLOSED)
    prisma.payrollPeriod.findMany({
      where: { clientId },
      orderBy: { startDate: 'desc' },
      take: 5,
      include: {
        payrollSchedule: { select: { name: true, frequency: true } },
        _count: { select: { payslips: true } },
        payslips: { select: { netPay: true, grossPay: true, approvedAt: true } },
      },
    }),

    // Total employee count (including inactive, for KPI denominator)
    prisma.employee.count({
      where: {
        softDelete: false,
        employments: { some: { clientId, isPastRole: false } },
      },
    }),
  ]);

  // ── Pending request counts ──────────────────────────────────────────────────
  const [pendingLeaveCount, pendingOTCount, pendingCoaCount] = await Promise.all([
    prisma.leaveRequest.count({ where: { clientId, status: 'PENDING' } }),
    prisma.overtimeRequest.count({ where: { clientId, status: 'PENDING' } }),
    prisma.coaRequest.count({ where: { clientId, status: 'PENDING' } }),
  ]);

  // Merge pending items for Action Required panel (max 5 total, prioritise leaves first)
  const actionItems: { id: string; type: string; employeeName: string; description: string; date: string }[] = [];

  for (const r of pendingLeaves) {
    if (actionItems.length >= 5) break;
    actionItems.push({
      id: r.id,
      type: 'Leave',
      employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
      description: `${r.leaveType.name} Leave — ${fmtDate(r.startDate)} to ${fmtDate(r.endDate)}`,
      date: fmtDate(r.createdAt),
    });
  }
  for (const r of pendingOT) {
    if (actionItems.length >= 5) break;
    actionItems.push({
      id: r.id,
      type: 'Overtime',
      employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
      description: `${r.type} — ${fmtDate(r.date)} (${parseFloat(r.hours.toString())}h)`,
      date: fmtDate(r.createdAt),
    });
  }
  for (const r of pendingCoa) {
    if (actionItems.length >= 5) break;
    actionItems.push({
      id: r.id,
      type: 'Attendance Correction',
      employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
      description: `${r.actionType.replace(/_/g, ' ')} correction — ${fmtDate(r.dateAffected)}`,
      date: fmtDate(r.createdAt),
    });
  }

  // ── Today's attendance (aggregated from groupBy results) ────────────────────
  let present = 0, late = 0, absent = 0, onLeave = 0;
  for (const group of todayTimesheets) {
    const count = group._count.status;
    switch (group.status) {
      case 'PRESENT':
        // Split PRESENT into late vs on-time based on sum of lateMinutes
        if ((group._sum.lateMinutes ?? 0) > 0) {
          late += count;
        } else {
          present += count;
        }
        break;
      case 'ABSENT':
      case 'INCOMPLETE':
        absent += count;
        break;
      case 'PAID_LEAVE':
      case 'UNPAID_LEAVE':
        onLeave += count;
        break;
      default:
        break;
    }
  }

  // ── Latest payroll period ────────────────────────────────────────────────────
  const latestPeriod = payrollPeriods[0] ?? null;
  const latestPayrollPeriod = latestPeriod
    ? {
        id: latestPeriod.id,
        startDate: fmtDate(latestPeriod.startDate),
        endDate: fmtDate(latestPeriod.endDate),
        payoutDate: fmtDate(latestPeriod.payoutDate),
        status: latestPeriod.status,
        scheduleName: latestPeriod.payrollSchedule?.name ?? null,
        employeeCount: latestPeriod._count.payslips,
        grossPayTotal: latestPeriod.payslips.reduce((s, p) => s + Number(p.grossPay), 0),
        netPayTotal: latestPeriod.payslips.reduce((s, p) => s + Number(p.netPay), 0),
        approvedCount: latestPeriod.payslips.filter((p) => p.approvedAt !== null).length,
        pendingCount: latestPeriod.payslips.filter((p) => p.approvedAt === null).length,
      }
    : null;

  // ── Department headcount ────────────────────────────────────────────────────
  const byDepartment = departments
    .map((d) => ({ name: d.name, count: d._count.employments }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    data: {
      employees: {
        active: allEmployees,
        total: totalEmployeeCount,
        byDepartment,
      },
      pendingRequests: {
        leaveCount: pendingLeaveCount,
        overtimeCount: pendingOTCount,
        coaCount: pendingCoaCount,
        total: pendingLeaveCount + pendingOTCount + pendingCoaCount,
        items: actionItems,
      },
      todayAttendance: {
        present,
        late,
        absent,
        onLeave,
        total: present + late + absent + onLeave,
      },
      latestPayrollPeriod,
    },
  });
}
