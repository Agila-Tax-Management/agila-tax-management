// src/app/api/dashboard/timesheet/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { computeTimesheetFields } from '@/lib/timesheet-calc';
import { resolveHrSettingFlags, applyHrSettingGuards } from '@/lib/hr-settings-guard';

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

  // Get today's timesheet record + approved OT request in parallel
  const [todayRecord, approvedOT] = await Promise.all([
    prisma.timesheet.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    }),
    prisma.overtimeRequest.findFirst({
      where: {
        employeeId: employee.id,
        date: today,
        status: 'APPROVED',
      },
      select: { id: true },
    }),
  ]);

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
            hasApprovedOT: approvedOT !== null,
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
// 1. Session Verification
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Production-Grade Client IP Capture
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  let clientIP = "";
  if (forwarded) {
    clientIP = forwarded.split(",")[0].trim();
  } else if (realIp) {
    clientIP = realIp.trim();
  }

  // Normalize IPv6-mapped IPv4 representations common in production edge environments
  if (clientIP.startsWith("::ffff:")) {
    clientIP = clientIP.substring(7);
  }

  // Bypass checks for local development environments
  const isLocalhost = clientIP === "127.0.0.1" || clientIP === "::1" || clientIP === "localhost";

  if (!isLocalhost) {
    try {
      // 3. Dynamic ISP Verification via API (Bypasses Static IP tracking)
      const ispResponse = await fetch(`http://ip-api.com{clientIP}?fields=status,isp,org`);
      
      if (ispResponse.ok) {
        const ipData = await ispResponse.json() as { status: string; isp: string; org: string };

        if (ipData.status === "success") {
          const providerInfo = `${ipData.isp} ${ipData.org}`.toLowerCase();
          
          // Match standard string identities for PLDT and Converge ICT networks
          const isPLDT = providerInfo.includes("pldt") || providerInfo.includes("philippine long distance");
          const isConverge = providerInfo.includes("converge") || providerInfo.includes("comclark");

          if (!isPLDT && !isConverge) {
            return NextResponse.json(
              {
                error: "Time in/out is only allowed from office WiFi (PLDT/Converge)",
                detectedIsp: ipData.isp,
                ip: clientIP,
              },
              { status: 403 }
            );
          }
        }
      }
    } catch (error) {
      // Fail-secure or Fail-safe: choose whether to block or allow if the third-party lookup API fails
      console.error("ISP verification failed:", error);
      // return NextResponse.json({ error: "Network verification unavailable" }, { status: 500 });
    }
  }

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
            include: {
              compensations: { where: { isActive: true }, take: 1 },
              schedule: {
                include: { days: true },
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

  // Shift real UTC time to Philippine local time (UTC+8) and store as "fake UTC"
  // so that fmtTime (which reads .getUTCHours()) returns the correct PH clock time.
  // This matches the buildUtcDate convention used for manually-entered times.
  // Philippines does not observe DST so the +8 offset is always fixed.
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  // Use UTC accessors on the shifted value to get the Philippine date.
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let record = await prisma.timesheet.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  // Cross-midnight fallback: if today has no open punch, check yesterday.
  // Handles night-shift employees whose clock-out crosses midnight into the next day.
  // Applies to LUNCH_START, LUNCH_END, and OUT — not IN (which always creates today's record).
  if (action !== 'IN' && (!record?.timeIn || record.timeOut)) {
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const prevRecord = await prisma.timesheet.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: yesterday } },
    });
    if (prevRecord?.timeIn && !prevRecord.timeOut) {
      record = prevRecord;
    }
  }

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

    // Resolve work schedule day from the clock-in date (record.date), not the
    // current clock-out time. This matters for cross-midnight shifts where the
    // clock-out falls on the next calendar day.
    const schedule = activeContract.schedule;
    const recordDow = record.date.getUTCDay();
    const scheduleDayRaw = schedule?.days.find((d) => d.dayOfWeek === recordDow) ?? null;
    const scheduleDay = scheduleDayRaw
      ? {
          startTime: scheduleDayRaw.startTime,
          endTime: scheduleDayRaw.endTime,
          breakStart: scheduleDayRaw.breakStart,
          breakEnd: scheduleDayRaw.breakEnd,
          isWorkingDay: scheduleDayRaw.isWorkingDay,
          isFlexible: scheduleDayRaw.isFlexible,
          requiredHours: scheduleDayRaw.requiredHours,
        }
      : null;

    const compensation = activeContract.compensations[0] ?? null;

    // Detect holiday on the record's date to apply correct DOLE day premiums
    const holidayOnDate = await prisma.holiday.findFirst({
      where: { clientId: activeEmployment.clientId, date: record.date },
      select: { type: true },
    });
    const isRestDaySchedule = scheduleDayRaw ? !scheduleDayRaw.isWorkingDay : false;
    const clockOutHolidayType = holidayOnDate?.type ?? null;
    let clockOutDayType: 'REGULAR' | 'REST_DAY' | 'SPECIAL_HOLIDAY' | 'SPECIAL_HOLIDAY_REST' | 'REGULAR_HOLIDAY' | 'REGULAR_HOLIDAY_REST' = 'REGULAR';
    if (clockOutHolidayType === 'REGULAR') {
      clockOutDayType = isRestDaySchedule ? 'REGULAR_HOLIDAY_REST' : 'REGULAR_HOLIDAY';
    } else if (clockOutHolidayType === 'SPECIAL_NON_WORKING' || clockOutHolidayType === 'LOCAL_HOLIDAY') {
      clockOutDayType = isRestDaySchedule ? 'SPECIAL_HOLIDAY_REST' : 'SPECIAL_HOLIDAY';
    } else if (clockOutHolidayType === 'SPECIAL_WORKING') {
      clockOutDayType = 'REGULAR';
    } else if (isRestDaySchedule) {
      clockOutDayType = 'REST_DAY';
    }

    const computed = computeTimesheetFields(
      record.timeIn,
      now,
      record.lunchStart,
      record.lunchEnd,
      scheduleDay,
      compensation
        ? {
            calculatedDailyRate: compensation.calculatedDailyRate.toString(),
            payType: compensation.payType,
          }
        : null,
      clockOutDayType,
    );

    const isVariable = (compensation?.payType ?? '') === 'VARIABLE_PAY';
    const dailyRateNum = Number(compensation?.calculatedDailyRate ?? 0);
    const guardFlags = await resolveHrSettingFlags(activeEmployment.clientId, employee.id);
    const guarded = applyHrSettingGuards(computed, guardFlags, dailyRateNum, isVariable);

    // Map DOLE day type to the correct AttendanceStatus
    const clockOutStatus: 'PRESENT' | 'REGULAR_HOLIDAY' | 'SPECIAL_HOLIDAY' =
      clockOutDayType === 'REGULAR_HOLIDAY' || clockOutDayType === 'REGULAR_HOLIDAY_REST'
        ? 'REGULAR_HOLIDAY'
        : clockOutDayType === 'SPECIAL_HOLIDAY' || clockOutDayType === 'SPECIAL_HOLIDAY_REST'
          ? 'SPECIAL_HOLIDAY'
          : 'PRESENT';

    record = await prisma.timesheet.update({
      where: { id: record.id },
      data: {
        timeOut: now,
        regularHours: guarded.regularHours,
        lateMinutes: guarded.lateMinutes,
        undertimeMinutes: guarded.undertimeMinutes,
        regOtHours: guarded.regOtHours,
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
        status: clockOutStatus,
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