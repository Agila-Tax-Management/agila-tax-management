// src/app/api/dashboard/timesheet/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * GET /api/dashboard/timesheet/me
 *
 * Returns the logged-in employee's:
 *  - Basic profile info (name, role, department, employeeNo, position, email)
 *  - Whether they have an active contract + active compensation (payroll guard)
 *  - Today's timesheet record (null if not clocked in yet today)
 *  - Historical timesheet records (last 120 days)
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, softDelete: false },
    include: {
      employments: {
        where: { employmentStatus: 'ACTIVE', isPastRole: false },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
          contracts: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              compensations: {
                where: { isActive: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
  }

  const activeEmployment = employee.employments[0] ?? null;
  const activeContract = activeEmployment?.contracts[0] ?? null;
  const activeCompensation = activeContract?.compensations[0] ?? null;

  const hasActiveContract = activeContract !== null;
  const hasActiveCompensation = activeCompensation !== null;

  // Build today as UTC midnight of the LOCAL calendar date.
  // Using Date.UTC with local date parts ensures the UTC representation matches
  // the intended date, regardless of server timezone. Without this, pg serialises
  // the Date via toISOString() (UTC), which shifts the date back by the UTC offset
  // (e.g. UTC+8 would write "2026-03-24" when the local date is "2026-03-25").
  const _now = new Date();
  const today = new Date(Date.UTC(_now.getFullYear(), _now.getMonth(), _now.getDate()));

  // Get today's timesheet record
  const todayRecord = await prisma.timesheet.findUnique({
    where: {
      employeeId_date: {
        employeeId: employee.id,
        date: today,
      },
    },
  });

  // Get historical records — last 120 days
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 120);
  const records = await prisma.timesheet.findMany({
    where: {
      employeeId: employee.id,
      date: { gte: cutoff },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({
    data: {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        middleName: employee.middleName,
        lastName: employee.lastName,
        nameExtension: employee.nameExtension,
        employeeNo: employee.employeeNo,
        email: employee.email,
        department: activeEmployment?.department?.name ?? null,
        position: activeEmployment?.position?.title ?? null,
        clientId: activeEmployment?.clientId ?? null,
      },
      hasActiveContract,
      hasActiveCompensation,
      todayRecord: todayRecord
        ? {
            id: todayRecord.id,
            isoDate: todayRecord.date.toISOString().slice(0, 10),
            status: todayRecord.status,
            timeIn: todayRecord.timeIn?.toISOString() ?? null,
            lunchStart: todayRecord.lunchStart?.toISOString() ?? null,
            lunchEnd: todayRecord.lunchEnd?.toISOString() ?? null,
            timeOut: todayRecord.timeOut?.toISOString() ?? null,
            regularHours: todayRecord.regularHours.toString(),
          }
        : null,
      records: records.map((r) => ({
        id: r.id,
        isoDate: r.date.toISOString().slice(0, 10),
        status: r.status,
        timeIn: r.timeIn?.toISOString() ?? null,
        lunchStart: r.lunchStart?.toISOString() ?? null,
        lunchEnd: r.lunchEnd?.toISOString() ?? null,
        timeOut: r.timeOut?.toISOString() ?? null,
        regularHours: r.regularHours.toString(),
      })),
    },
  });
}

/**
 * POST /api/dashboard/timesheet/me
 *
 * Records a clock action for the logged-in employee.
 * Body: { action: 'IN' | 'OUT' | 'LUNCH_START' | 'LUNCH_END' }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { action?: string };
  const action = body.action;
  if (!['IN', 'OUT', 'LUNCH_START', 'LUNCH_END'].includes(action ?? '')) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, softDelete: false },
    include: {
      employments: {
        where: { employmentStatus: 'ACTIVE', isPastRole: false },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            take: 1,
            include: { compensations: { where: { isActive: true }, take: 1 } },
          },
        },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
  }

  const activeEmployment = employee.employments[0] ?? null;
  if (!activeEmployment) {
    return NextResponse.json({ error: 'No active employment record found' }, { status: 422 });
  }

  const activeContract = activeEmployment.contracts[0] ?? null;
  const hasActiveCompensation = (activeContract?.compensations ?? []).length > 0;

  if (!activeContract || !hasActiveCompensation) {
    return NextResponse.json(
      { error: 'No active contract and compensation. Please contact your administrator.' },
      { status: 422 },
    );
  }

  const now = new Date();
  // Same UTC-aligned date construction as in GET — prevents date shifting on UTC+ servers.
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  let record = await prisma.timesheet.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (action === 'IN') {
    if (record?.timeIn) {
      return NextResponse.json({ error: 'Already clocked in today' }, { status: 409 });
    }
    record = await prisma.timesheet.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
      create: {
        employeeId: employee.id,
        clientId: activeEmployment.clientId,
        date: today,
        status: 'PRESENT',
        timeIn: now,
      },
      update: {
        status: 'PRESENT',
        timeIn: now,
      },
    });
  } else if (action === 'LUNCH_START') {
    if (!record?.timeIn || record.timeOut) {
      return NextResponse.json({ error: 'Not currently clocked in' }, { status: 409 });
    }
    if (record.lunchStart) {
      return NextResponse.json({ error: 'Lunch already started' }, { status: 409 });
    }
    record = await prisma.timesheet.update({
      where: { id: record.id },
      data: { lunchStart: now },
    });
  } else if (action === 'LUNCH_END') {
    if (!record?.lunchStart || record.lunchEnd) {
      return NextResponse.json({ error: 'Lunch has not started or already ended' }, { status: 409 });
    }
    record = await prisma.timesheet.update({
      where: { id: record.id },
      data: { lunchEnd: now },
    });
  } else if (action === 'OUT') {
    if (!record?.timeIn) {
      return NextResponse.json({ error: 'Not clocked in today' }, { status: 409 });
    }
    if (record.timeOut) {
      return NextResponse.json({ error: 'Already clocked out today' }, { status: 409 });
    }
    if (record.lunchStart && !record.lunchEnd) {
      return NextResponse.json({ error: 'Please end your lunch break first' }, { status: 409 });
    }

    // Calculate regular hours: (timeOut - timeIn) minus lunch break
    const lunchMs =
      record.lunchStart && record.lunchEnd
        ? record.lunchEnd.getTime() - record.lunchStart.getTime()
        : 0;
    const workMs = now.getTime() - record.timeIn.getTime() - lunchMs;
    const regularHours = Math.max(0, workMs / 3600000);

    record = await prisma.timesheet.update({
      where: { id: record.id },
      data: {
        timeOut: now,
        regularHours: parseFloat(regularHours.toFixed(2)),
        status: 'PRESENT',
      },
    });
  }

  return NextResponse.json({
    data: {
      id: record!.id,
      isoDate: record!.date.toISOString().slice(0, 10),
      status: record!.status,
      timeIn: record!.timeIn?.toISOString() ?? null,
      lunchStart: record!.lunchStart?.toISOString() ?? null,
      lunchEnd: record!.lunchEnd?.toISOString() ?? null,
      timeOut: record!.timeOut?.toISOString() ?? null,
      regularHours: record!.regularHours.toString(),
    },
  });
}
