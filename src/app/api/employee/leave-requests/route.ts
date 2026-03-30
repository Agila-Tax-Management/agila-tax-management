// src/app/api/employee/leave-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const createLeaveRequestSchema = z.object({
  leaveTypeId: z.number().int().positive("Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  creditUsed: z.number().positive("Credit used must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  attachmentUrl: z.string().url().optional().nullable(),
});

/**
 * GET /api/employee/leave-requests
 * Returns the logged-in employee's own leave requests.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 403 });
  }

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: session.employee.id },
    orderBy: { createdAt: "desc" },
    include: {
      leaveType: { select: { id: true, name: true, isPaid: true } },
      approvedBy: { select: { name: true } },
    },
  });

  const data = requests.map((r) => ({
    id: r.id,
    leaveTypeId: r.leaveTypeId,
    leaveType: r.leaveType.name,
    isPaid: r.leaveType.isPaid,
    startDate: r.startDate.toISOString().split("T")[0],
    endDate: r.endDate.toISOString().split("T")[0],
    creditUsed: parseFloat(r.creditUsed.toString()),
    reason: r.reason,
    status: r.status,
    attachmentUrl: r.attachmentUrl ?? null,
    reviewedBy: r.approvedBy?.name ?? null,
    reviewedDate: r.approvedAt?.toISOString().split("T")[0] ?? null,
    rejectionReason: r.rejectionReason ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/employee/leave-requests
 * Submits a new leave request. Validates that the employee has sufficient balance.
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
  const parsed = createLeaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { leaveTypeId, startDate, endDate, creditUsed, reason, attachmentUrl } = parsed.data;

  if (new Date(endDate) < new Date(startDate)) {
    return NextResponse.json({ error: "End date cannot be before start date." }, { status: 400 });
  }

  const now = new Date();
  const credit = await prisma.employeeLeaveCredit.findFirst({
    where: {
      employeeId: session.employee.id,
      leaveTypeId,
      isExpired: false,
      validFrom: { lte: now },
      expiresAt: { gte: now },
    },
  });

  if (!credit) {
    return NextResponse.json(
      { error: "No valid leave credit found for this leave type." },
      { status: 422 },
    );
  }

  const balance =
    parseFloat(credit.allocated.toString()) - parseFloat(credit.used.toString());

  if (balance < creditUsed) {
    return NextResponse.json(
      { error: `Insufficient leave balance. Available: ${balance} day(s).` },
      { status: 422 },
    );
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      employeeId: session.employee.id,
      clientId,
      leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      creditUsed,
      reason,
      attachmentUrl: attachmentUrl ?? null,
      status: "PENDING",
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "LeaveRequest",
    entityId: leaveRequest.id,
    description: `${session.employee.firstName} ${session.employee.lastName} submitted a leave request (${creditUsed} day(s))`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: leaveRequest }, { status: 201 });
}
