// src/app/api/hr/overtime-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

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

  return NextResponse.json({ data: { id, status: newStatus } });
}
