// src/app/api/hr/employees/[id]/file-leave/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  leaveTypeId: z.number().int().positive("Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  creditUsed: z.number().positive("Credit used must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  attachmentUrl: z.string().url().optional(),
});

/**
 * POST /api/hr/employees/[id]/file-leave
 * Allows HR/Admin to file a leave request on behalf of an employee.
 * Skips balance validation — HR is responsible for accuracy.
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

  const { leaveTypeId, startDate, endDate, creditUsed, reason, attachmentUrl } = parsed.data;

  if (new Date(endDate) < new Date(startDate)) {
    return NextResponse.json({ error: "End date cannot be before start date." }, { status: 400 });
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      employeeId,
      clientId,
      leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      creditUsed,
      reason: `[Filed by HR] ${reason}`,
      attachmentUrl: attachmentUrl ?? null,
      status: "PENDING",
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "LeaveRequest",
    entityId: leaveRequest.id,
    description: `HR filed leave request on behalf of ${employee.firstName} ${employee.lastName} (${creditUsed} day(s))`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: leaveRequest }, { status: 201 });
}
