// src/app/api/hr/overtime-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { computeTimesheetFields, type DayType } from "@/lib/timesheet-calc";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

/**
 * PATCH /api/hr/overtime-requests/[id]
 * Approves or rejects a pending overtime request.
 *
 * On APPROVE (Option 1 — update timesheet):
 *   - Regular Day OT → increments timesheet.regOtHours for that date
 *   - Rest Day OT    → upserts timesheet with rdHours = hours, status = PRESENT
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.overtimeRequest.findFirst({
    where: { id, clientId },
    include: {
      employee: { select: { firstName: true, lastName: true, userId: true } },
    },
  });
  if (!existing) return NextResponse.json({ error: "Overtime request not found" }, { status: 404 });

  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending requests can be approved or rejected." },
      { status: 409 },
    );
  }

  const body = (await request.json()) as unknown;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { action } = parsed.data;
  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.overtimeRequest.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById: session.user.id,
        approvedAt: new Date(),
        ...(action === "REJECT" ? { } : {}),
      },
    });

    if (action === "APPROVE") {
      const hours = parseFloat(existing.hours.toString());
      const isRestDay = existing.type.toLowerCase().includes("rest");

      if (isRestDay) {
        // Rest Day OT: upsert timesheet — sets rdHours for the day
        const existingTs = await tx.timesheet.findUnique({
          where: { employeeId_date: { employeeId: existing.employeeId, date: existing.date } },
        });

        if (existingTs) {
          const currentRdHours = parseFloat(existingTs.rdHours.toString());
          const currentRdOtHours = parseFloat(existingTs.rdOtHours.toString());
          // First 8 hours go into rdHours, remainder into rdOtHours
          const totalRd = currentRdHours + hours;
          const newRdHours = Math.min(totalRd, 8);
          const newRdOtHours = currentRdOtHours + Math.max(0, totalRd - 8);

          await tx.timesheet.update({
            where: { employeeId_date: { employeeId: existing.employeeId, date: existing.date } },
            data: {
              rdHours: newRdHours,
              rdOtHours: newRdOtHours,
              status: "PRESENT",
            },
          });
        } else {
          // No timesheet for this day — create one
          const rdHours = Math.min(hours, 8);
          const rdOtHours = Math.max(0, hours - 8);
          await tx.timesheet.create({
            data: {
              employeeId: existing.employeeId,
              clientId: existing.clientId,
              date: existing.date,
              status: "PRESENT",
              rdHours,
              rdOtHours,
            },
          });
        }
      } else {
        // Regular Day OT: increment regOtHours on the existing timesheet
        const existingTs = await tx.timesheet.findUnique({
          where: { employeeId_date: { employeeId: existing.employeeId, date: existing.date } },
        });

        if (existingTs) {
          const currentRegOt = parseFloat(existingTs.regOtHours.toString());
          await tx.timesheet.update({
            where: { employeeId_date: { employeeId: existing.employeeId, date: existing.date } },
            data: { regOtHours: currentRegOt + hours },
          });
        } else {
          // No timesheet for this day — create a minimal record
          await tx.timesheet.create({
            data: {
              employeeId: existing.employeeId,
              clientId: existing.clientId,
              date: existing.date,
              status: "ABSENT",
              regOtHours: hours,
            },
          });
        }
      }
    }
  });

  void logActivity({
    userId: session.user.id,
    action: action === "APPROVE" ? "APPROVED" : "REJECTED",
    entity: "OvertimeRequest",
    entityId: id,
    description: `${action === "APPROVE" ? "Approved" : "Rejected"} overtime request for ${existing.employee.firstName} ${existing.employee.lastName}`,
    ...getRequestMeta(request),
  });

  // After approving, recompute dailyGrossPay on the affected timesheet so the
  // payslip daily breakdown reflects the premium pay immediately (before Refresh).
  if (action === "APPROVE") {
    const BASE_MULT: Record<DayType, number> = {
      REGULAR: 1.00, REST_DAY: 1.30, SPECIAL_HOLIDAY: 1.30,
      SPECIAL_HOLIDAY_REST: 1.50, REGULAR_HOLIDAY: 2.00, REGULAR_HOLIDAY_REST: 2.60,
    };

    const [updatedTs, empComp, holidayRec] = await Promise.all([
      prisma.timesheet.findUnique({
        where: { employeeId_date: { employeeId: existing.employeeId, date: existing.date } },
      }),
      prisma.employeeCompensation.findFirst({
        where: {
          isActive: true,
          contract: {
            status: 'ACTIVE',
            employments: { some: { employeeId: existing.employeeId, employmentStatus: 'ACTIVE' } },
          },
        },
        select: {
          calculatedDailyRate: true,
          payType: true,
          contract: { select: { schedule: { select: { days: true } } } },
        },
      }),
      prisma.holiday.findFirst({
        where: { clientId: existing.clientId, date: existing.date },
        select: { type: true },
      }),
    ]);

    if (updatedTs && empComp) {
      const dow = (existing.date as Date).getDay();
      const schedule = empComp.contract.schedule;
      const restDaySet = new Set(
        schedule?.days.filter((d) => !d.isWorkingDay).map((d) => d.dayOfWeek) ?? [],
      );
      const isRestDay = restDaySet.has(dow);
      const holidayType = holidayRec?.type ?? null;

      let dayType: DayType = isRestDay ? 'REST_DAY' : 'REGULAR';
      if (holidayType === 'REGULAR') {
        dayType = isRestDay ? 'REGULAR_HOLIDAY_REST' : 'REGULAR_HOLIDAY';
      } else if (holidayType === 'SPECIAL_NON_WORKING' || holidayType === 'LOCAL_HOLIDAY') {
        dayType = isRestDay ? 'SPECIAL_HOLIDAY_REST' : 'SPECIAL_HOLIDAY';
      }

      const dailyRate = Number(empComp.calculatedDailyRate);
      let newDailyGrossPay: number;

      if (updatedTs.timeIn && updatedTs.timeOut) {
        // Has time punches — run full compute so all fields are consistent
        const scheduleDay = schedule?.days.find((d) => d.dayOfWeek === dow) ?? null;
        const computed = computeTimesheetFields(
          updatedTs.timeIn,
          updatedTs.timeOut,
          updatedTs.lunchStart,
          updatedTs.lunchEnd,
          scheduleDay,
          { calculatedDailyRate: empComp.calculatedDailyRate.toString(), payType: empComp.payType },
          dayType,
        );
        // Unpaid leave earns no base pay
        newDailyGrossPay = updatedTs.status === 'UNPAID_LEAVE' ? 0 : computed.dailyGrossPay;
      } else {
        // Rest-day or holiday OT only — no punch; base premium pay for being present
        // Pro-rate by actual approved hours (up to 8) — no punch means we use the request hours
        const otBaseHrs = Math.min(parseFloat(existing.hours.toString()), 8);
        newDailyGrossPay = dayType === 'REGULAR' ? 0 : (dailyRate / 8) * otBaseHrs * BASE_MULT[dayType];
      }

      await prisma.timesheet.update({
        where: { id: updatedTs.id },
        data: { dailyGrossPay: parseFloat(newDailyGrossPay.toFixed(2)) },
      });
    }
  }

  return NextResponse.json({ data: { id, status: newStatus } });
}
