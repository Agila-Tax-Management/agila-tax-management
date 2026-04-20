// src/app/api/employee/coa-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const COA_ACTION_TYPES = ["TIME_IN", "LUNCH_START", "LUNCH_END", "TIME_OUT"] as const;

const createCoaRequestSchema = z.object({
  dateAffected: z.string().min(1, "Date affected is required"),
  actionType: z.enum(COA_ACTION_TYPES, { message: "Invalid action type" }),
  timeValue: z.string().min(1, "Correct time is required"),
  reason: z.string().min(1, "Reason is required"),
});

/**
 * GET /api/employee/coa-requests
 * Returns the logged-in employee's own COA (Correction of Attendance) requests.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 403 });
  }

  const requests = await prisma.coaRequest.findMany({
    where: { employeeId: session.employee.id },
    orderBy: { createdAt: "desc" },
    include: {
      approvedBy: { select: { name: true } },
    },
  });

  const data = requests.map((r) => ({
    id: r.id,
    dateAffected: r.dateAffected.toISOString().split("T")[0],
    actionType: r.actionType,
    timeValue: r.timeValue instanceof Date ? r.timeValue.toISOString() : r.timeValue,
    reason: r.reason,
    status: r.status,
    reviewedBy: r.approvedBy?.name ?? null,
    approvedAt: r.approvedAt?.toISOString() ?? null,
    rejectionReason: r.rejectionReason ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/employee/coa-requests
 * Submits a new Certificate of Attendance / missed punch correction.
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
  const parsed = createCoaRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { dateAffected, actionType, timeValue, reason } = parsed.data;

  // Combine dateAffected + timeValue into a proper DateTime for the @db.Time field.
  // The employee enters local PHT time (UTC+8), so subtract 8 hours to store as UTC.
  const baseDate = new Date(dateAffected);
  const [h, m] = timeValue.split(":").map(Number);
  const timeDt = new Date(baseDate);
  timeDt.setUTCHours((h ?? 0) - 8, m ?? 0, 0, 0);

  const coaRequest = await prisma.coaRequest.create({
    data: {
      employeeId: session.employee.id,
      clientId,
      dateAffected: new Date(dateAffected),
      actionType,
      timeValue: timeDt,
      reason,
      status: "PENDING",
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "CoaRequest",
    entityId: coaRequest.id,
    description: `${session.employee.firstName} ${session.employee.lastName} submitted a COA request for ${dateAffected} (${actionType})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: coaRequest }, { status: 201 });
}
