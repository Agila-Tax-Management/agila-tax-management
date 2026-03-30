// src/app/api/employee/overtime-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const createOvertimeRequestSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.string().min(1, "Overtime type is required"),
  timeFrom: z.string().min(1, "Start time is required"),
  timeTo: z.string().min(1, "End time is required"),
  hours: z.number().positive("Hours must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
});

/**
 * GET /api/employee/overtime-requests
 * Returns the logged-in employee's own overtime requests.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 403 });
  }

  const requests = await prisma.overtimeRequest.findMany({
    where: { employeeId: session.employee.id },
    orderBy: { createdAt: "desc" },
    include: {
      approvedBy: { select: { name: true } },
    },
  });

  const data = requests.map((r) => ({
    id: r.id,
    date: r.date.toISOString().split("T")[0],
    type: r.type,
    timeFrom: r.timeFrom instanceof Date ? r.timeFrom.toISOString() : r.timeFrom,
    timeTo: r.timeTo instanceof Date ? r.timeTo.toISOString() : r.timeTo,
    hours: parseFloat(r.hours.toString()),
    reason: r.reason,
    status: r.status,
    reviewedBy: r.approvedBy?.name ?? null,
    approvedAt: r.approvedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/employee/overtime-requests
 * Submits a new overtime request.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const body = (await request.json()) as unknown;
  const parsed = createOvertimeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { date, type, timeFrom, timeTo, hours, reason } = parsed.data;

  // Build full DateTime for timeFrom/timeTo using the provided date.
  // The employee enters local PHT time (UTC+8), so subtract 8 hours to store as UTC.
  const baseDate = new Date(date);
  const [fromH, fromM] = timeFrom.split(":").map(Number);
  const [toH, toM] = timeTo.split(":").map(Number);

  const fromDt = new Date(baseDate);
  fromDt.setUTCHours((fromH ?? 0) - 8, fromM ?? 0, 0, 0);

  const toDt = new Date(baseDate);
  toDt.setUTCHours((toH ?? 0) - 8, toM ?? 0, 0, 0);

  const overtimeRequest = await prisma.overtimeRequest.create({
    data: {
      employeeId: session.employee.id,
      clientId,
      date: new Date(date),
      type,
      timeFrom: fromDt,
      timeTo: toDt,
      hours,
      reason,
      status: "PENDING",
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "OvertimeRequest",
    entityId: overtimeRequest.id,
    description: `${session.employee.firstName} ${session.employee.lastName} submitted an overtime request for ${date} (${hours}h)`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: overtimeRequest }, { status: 201 });
}
