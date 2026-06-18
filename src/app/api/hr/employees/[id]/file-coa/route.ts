// src/app/api/hr/employees/[id]/file-coa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const COA_ACTION_TYPES = ["TIME_IN", "LUNCH_START", "LUNCH_END", "TIME_OUT"] as const;

const schema = z.object({
  dateAffected: z.string().min(1, "Date affected is required"),
  actionType: z.enum(COA_ACTION_TYPES, { message: "Invalid action type" }),
  timeValue: z.string().min(1, "Correct time is required"),
  reason: z.string().min(1, "Reason is required"),
});

/**
 * POST /api/hr/employees/[id]/file-coa
 * Allows HR/Admin to file a COA (Correction of Attendance) request on behalf of an employee.
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

  // Verify the employee belongs to this client
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

  const { dateAffected, actionType, timeValue, reason } = parsed.data;

  const baseDate = new Date(dateAffected);
  const [h, m] = timeValue.split(":").map(Number);
  const timeDt = new Date(baseDate);
  timeDt.setUTCHours((h ?? 0) - 8, m ?? 0, 0, 0);

  const coaRequest = await prisma.coaRequest.create({
    data: {
      employeeId,
      clientId,
      dateAffected: new Date(dateAffected),
      actionType,
      timeValue: timeDt,
      reason: `[Filed by HR] ${reason}`,
      status: "PENDING",
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "CoaRequest",
    entityId: coaRequest.id,
    description: `HR filed COA request on behalf of ${employee.firstName} ${employee.lastName} for ${dateAffected} (${actionType})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: coaRequest }, { status: 201 });
}
