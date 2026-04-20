// src/app/api/employee/payslips/[id]/timesheet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/employee/payslips/[id]/timesheet
 * Returns the timesheet records for the logged-in employee within the payroll period.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: 'No employee profile found' }, { status: 403 });
  }

  const { id } = await params;

  const payslip = await prisma.payslip.findFirst({
    where: {
      id,
      employeeId: session.employee.id,
      approvedAt: { not: null },
    },
    select: {
      employeeId: true,
      payrollPeriod: { select: { startDate: true, endDate: true } },
    },
  });

  if (!payslip) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const timesheets = await prisma.timesheet.findMany({
    where: {
      employeeId: payslip.employeeId,
      date: {
        gte: payslip.payrollPeriod.startDate,
        lte: payslip.payrollPeriod.endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json({ data: timesheets });
}
