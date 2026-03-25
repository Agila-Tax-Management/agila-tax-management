// src/app/api/hr/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import type { AttendanceStatus } from '@/generated/prisma/client';

// Map DB AttendanceStatus + lateMinutes → UI display string
function mapStatus(
  dbStatus: AttendanceStatus,
  lateMinutes: number,
): string {
  switch (dbStatus) {
    case 'PRESENT':
      return lateMinutes > 0 ? 'Late' : 'Present';
    case 'ABSENT':
      return 'Absent';
    case 'INCOMPLETE':
      return 'Half Day';
    case 'PAID_LEAVE':
    case 'UNPAID_LEAVE':
      return 'On Leave';
    case 'DAY_OFF':
      return 'Day Off';
    case 'REGULAR_HOLIDAY':
    case 'SPECIAL_HOLIDAY':
      return 'Holiday';
    default:
      return 'Absent';
  }
}

function fmtTime(d: Date | null): string | null {
  if (!d) return null;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * GET /api/hr/attendance?date=YYYY-MM-DD&search=&status=
 *
 * Returns attendance records for all active employees on a given date.
 * Employees with no Timesheet row default to Absent.
 *
 * Query params:
 *  - date    (required) ISO date string YYYY-MM-DD
 *  - search  (optional) filter by employee name or department (case-insensitive)
 *  - status  (optional) UI status string: Present | Late | Absent | Half Day | On Leave | Day Off | Holiday
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const search = (searchParams.get('search') ?? '').trim().toLowerCase();
  const statusFilter = (searchParams.get('status') ?? 'All').trim();

  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { error: 'date query parameter is required (YYYY-MM-DD)' },
      { status: 400 },
    );
  }

  // Parse the date as midnight UTC so it matches the DB Date column
  const targetDate = new Date(`${dateParam}T00:00:00.000Z`);

  // Fetch all active employees for this client
  const employees = await prisma.employee.findMany({
    where: {
      softDelete: false,
      employments: {
        some: {
          clientId,
          employmentStatus: 'ACTIVE',
          isPastRole: false,
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      nameExtension: true,
      employments: {
        where: {
          clientId,
          employmentStatus: 'ACTIVE',
          isPastRole: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          department: { select: { name: true } },
        },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  // Fetch all timesheet rows for the target date
  const timesheets = await prisma.timesheet.findMany({
    where: {
      clientId,
      date: targetDate,
    },
  });

  const timesheetMap = new Map(timesheets.map((t) => [t.employeeId, t]));

  // Build unified record list
  const records = employees.map((emp) => {
    const employment = emp.employments[0] ?? null;
    const department = employment?.department?.name ?? 'Unknown';

    const nameParts = [emp.firstName, emp.middleName, emp.lastName, emp.nameExtension].filter(Boolean);
    const employeeName = nameParts.join(' ');

    const ts = timesheetMap.get(emp.id) ?? null;

    const dbStatus: AttendanceStatus = ts?.status ?? 'ABSENT';
    const lateMinutes = ts?.lateMinutes ?? 0;
    const uiStatus = mapStatus(dbStatus, lateMinutes);

    const timeIn = fmtTime(ts?.timeIn ?? null);
    const timeOut = fmtTime(ts?.timeOut ?? null);
    const hoursWorked = ts ? parseFloat(ts.regularHours.toString()) : 0;
    const overtime = ts ? parseFloat(ts.regOtHours.toString()) : 0;
    const notes = ts ? '' : '';

    return {
      id: ts?.id ?? `no-ts-${emp.id}`,
      employeeId: emp.id,
      employeeName,
      department,
      timeIn,
      timeOut,
      hoursWorked,
      overtime,
      status: uiStatus,
      notes,
    };
  });

  // Server-side filtering
  const filtered = records.filter((rec) => {
    const matchSearch =
      search === '' ||
      rec.employeeName.toLowerCase().includes(search) ||
      rec.department.toLowerCase().includes(search);
    const matchStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Compute stats from the full (unfiltered) record set
  const present = records.filter((r) => r.status === 'Present').length;
  const late = records.filter((r) => r.status === 'Late').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const totalHours = records.reduce((s, r) => s + r.hoursWorked, 0);
  const totalOvertime = records.reduce((s, r) => s + r.overtime, 0);

  return NextResponse.json({
    data: {
      records: filtered,
      stats: {
        present,
        late,
        absent,
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalOvertime: parseFloat(totalOvertime.toFixed(2)),
      },
    },
  });
}
