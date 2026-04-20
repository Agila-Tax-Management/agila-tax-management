// src/app/api/hr/coa-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { computeTimesheetFields } from "@/lib/timesheet-calc";
import { AttendanceStatus } from "@/generated/prisma/enums";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

/**
 * PATCH /api/hr/coa-requests/[id]
 * Approves or rejects a pending COA request.
 *
 * On APPROVE:
 *   - Finds (or creates) the timesheet for the affected date
 *   - Patches the specific punch field (timeIn / lunchStart / lunchEnd / timeOut)
 *   - Recalculates attendance status based on presence of timeIn + timeOut
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

  const existing = await prisma.coaRequest.findFirst({
    where: { id, clientId },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employments: {
            where: { employmentStatus: "ACTIVE", isPastRole: false },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              contracts: {
                where: { status: "ACTIVE" },
                take: 1,
                include: {
                  compensations: { where: { isActive: true }, take: 1 },
                  schedule: { include: { days: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!existing) return NextResponse.json({ error: "COA request not found" }, { status: 404 });

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

  const { action, rejectionReason } = parsed.data;
  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.coaRequest.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById: session.user.id,
        approvedAt: new Date(),
        rejectionReason: action === "REJECT" ? (rejectionReason ?? null) : null,
      },
    });

    if (action === "APPROVE") {
      // Combine dateAffected with the stored timeValue (which is @db.Time — epoch date with time only)
      const dateAffected = existing.dateAffected;
      const tv = existing.timeValue as Date;
      const correctedTime = new Date(dateAffected);
      correctedTime.setUTCHours(tv.getUTCHours(), tv.getUTCMinutes(), 0, 0);

      // Determine which field to patch
      const fieldMap: Record<string, string> = {
        TIME_IN: "timeIn",
        LUNCH_START: "lunchStart",
        LUNCH_END: "lunchEnd",
        TIME_OUT: "timeOut",
      };
      const field = fieldMap[existing.actionType];
      if (!field) return; // Defensive — all enum values are covered above

      // Find existing timesheet
      const existingTs = await tx.timesheet.findUnique({
        where: {
          employeeId_date: {
            employeeId: existing.employeeId,
            date: dateAffected,
          },
        },
      });

      if (existingTs) {
        // Patch the specific field
        await tx.timesheet.update({
          where: {
            employeeId_date: {
              employeeId: existing.employeeId,
              date: dateAffected,
            },
          },
          data: { [field]: correctedTime },
        });

        // Determine the fully-merged punch values after applying the correction
        const mergedTimeIn    = field === "timeIn"     ? correctedTime : existingTs.timeIn;
        const mergedTimeOut   = field === "timeOut"    ? correctedTime : existingTs.timeOut;
        const mergedLunchStart = field === "lunchStart" ? correctedTime : existingTs.lunchStart;
        const mergedLunchEnd  = field === "lunchEnd"   ? correctedTime : existingTs.lunchEnd;

        let attendanceStatus: AttendanceStatus;
        if (mergedTimeIn && mergedTimeOut) {
          attendanceStatus = AttendanceStatus.PRESENT;
        } else if (mergedTimeIn || mergedTimeOut) {
          attendanceStatus = AttendanceStatus.INCOMPLETE;
        } else {
          attendanceStatus = existingTs.status as AttendanceStatus;
        }

        // If both punches exist, recompute all derived fields
        if (mergedTimeIn && mergedTimeOut) {
          const activeContract = existing.employee.employments[0]?.contracts[0] ?? null;
          const schedule = activeContract?.schedule ?? null;
          const compensation = activeContract?.compensations[0] ?? null;
          const dow = dateAffected.getDay();
          const scheduleDay = schedule?.days.find((d) => d.dayOfWeek === dow) ?? null;

          const computed = computeTimesheetFields(
            mergedTimeIn,
            mergedTimeOut,
            mergedLunchStart,
            mergedLunchEnd,
            scheduleDay,
            compensation
              ? {
                  calculatedDailyRate: compensation.calculatedDailyRate.toString(),
                  payType: compensation.payType,
                }
              : null,
          );

          await tx.timesheet.update({
            where: {
              employeeId_date: {
                employeeId: existing.employeeId,
                date: dateAffected,
              },
            },
            data: {
              status: attendanceStatus,
              regularHours: computed.regularHours,
              lateMinutes: computed.lateMinutes,
              undertimeMinutes: computed.undertimeMinutes,
              regOtHours: computed.regOtHours,
              dailyGrossPay: computed.dailyGrossPay,
            },
          });
        } else {
          // Only one punch present — just update status, reset computed fields
          await tx.timesheet.update({
            where: {
              employeeId_date: {
                employeeId: existing.employeeId,
                date: dateAffected,
              },
            },
            data: {
              status: attendanceStatus,
              regularHours: 0,
              lateMinutes: 0,
              undertimeMinutes: 0,
              regOtHours: 0,
              dailyGrossPay: 0,
            },
          });
        }
      } else {
        // No timesheet yet — create one with the corrected punch
        const newTimeIn    = field === "timeIn"     ? correctedTime : null;
        const newTimeOut   = field === "timeOut"    ? correctedTime : null;
        const newLunchStart = field === "lunchStart" ? correctedTime : null;
        const newLunchEnd  = field === "lunchEnd"   ? correctedTime : null;

        const attendanceStatus = newTimeIn && newTimeOut ? AttendanceStatus.PRESENT : AttendanceStatus.INCOMPLETE;

        await tx.timesheet.create({
          data: {
            employeeId: existing.employeeId,
            clientId: existing.clientId,
            date: dateAffected,
            status: attendanceStatus,
            timeIn: newTimeIn,
            lunchStart: newLunchStart,
            lunchEnd: newLunchEnd,
            timeOut: newTimeOut,
          },
        });
      }
    }
  });

  void logActivity({
    userId: session.user.id,
    action: action === "APPROVE" ? "APPROVED" : "REJECTED",
    entity: "CoaRequest",
    entityId: id,
    description: `${action === "APPROVE" ? "Approved" : "Rejected"} COA request for ${existing.employee.firstName} ${existing.employee.lastName} (${existing.actionType} on ${existing.dateAffected.toISOString().split("T")[0]})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id, status: newStatus } });
}
