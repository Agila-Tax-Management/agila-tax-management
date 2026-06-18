// src/app/api/hr/employees/[id]/file-overtime/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.string().min(1, "Overtime type is required"),
  timeFrom: z.string().min(1, "Start time is required"),
  timeTo: z.string().min(1, "End time is required"),
  hours: z.number().positive("Hours must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
});

/**
 * POST /api/hr/employees/[id]/file-overtime
 * Allows HR/Admin to file an overtime request on behalf of an employee.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "ADMIN" &&
    !session.portalAccess?.HR?.canWrite
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const employeeId = parseInt(id, 10);
  if (isNaN(employeeId)) return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, softDelete: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employments: {
        where: { employmentStatus: "ACTIVE" },
        take: 1,
        select: { clientId: true },
      },
    },
  });

  if (!employee || employee.employments[0]?.clientId !== clientId) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { date, type, timeFrom, timeTo, hours, reason } = parsed.data;

  const baseDate = new Date(date);
  const [fromH, fromM] = timeFrom.split(":").map(Number);
  const [toH, toM] = timeTo.split(":").map(Number);

  const fromDt = new Date(baseDate);
  fromDt.setUTCHours((fromH ?? 0) - 8, fromM ?? 0, 0, 0);

  const toDt = new Date(baseDate);
  toDt.setUTCHours((toH ?? 0) - 8, toM ?? 0, 0, 0);

  const overtimeRequest = await prisma.overtimeRequest.create({
    data: {
      employeeId,
      clientId,
      date: new Date(date),
      type,
      timeFrom: fromDt,
      timeTo: toDt,
      hours,
      reason: `[Filed by HR] ${reason}`,
      status: "PENDING",
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "OvertimeRequest",
    entityId: overtimeRequest.id,
    description: `HR filed overtime request on behalf of ${employee.firstName} ${employee.lastName} for ${date} (${hours}h)`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: overtimeRequest }, { status: 201 });
}
