// src/app/api/hr/coa-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";

/**
 * GET /api/hr/coa-requests
 * Returns all COA (Correction of Attendance) requests for the session's client.
 *
 * Query params:
 *   - status: PENDING | APPROVED | REJECTED | CANCELLED | All
 *   - search: string (matches employee name)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";

  const validStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
  type CoaStatus = (typeof validStatuses)[number];

  const statusFilter =
    status && status !== "All" && (validStatuses as readonly string[]).includes(status)
      ? (status as CoaStatus)
      : undefined;

  const requests = await prisma.coaRequest.findMany({
    where: {
      clientId,
      employee: { userId: { not: null }, clientUserId: null, softDelete: false },
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search
        ? {
            OR: [
              { employee: { firstName: { contains: search, mode: "insensitive" } } },
              { employee: { lastName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employments: {
            where: { employmentStatus: "ACTIVE" },
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { department: { select: { name: true } } },
          },
        },
      },
      approvedBy: { select: { name: true } },
    },
  });

  // Batch-fetch timesheet records for all (employeeId, dateAffected) pairs
  const timesheetKeys = requests.map((r) => ({
    employeeId: r.employeeId,
    date: r.dateAffected,
  }));

  const timesheets = await prisma.timesheet.findMany({
    where: {
      OR: timesheetKeys.map((k) => ({
        employeeId: k.employeeId,
        date: k.date,
      })),
    },
    select: {
      employeeId: true,
      date: true,
      timeIn: true,
      lunchStart: true,
      lunchEnd: true,
      timeOut: true,
    },
  });

  // Index by "employeeId_dateISO" for O(1) lookup
  const timesheetMap = new Map(
    timesheets.map((t) => [
      `${t.employeeId}_${t.date.toISOString().split("T")[0]}`,
      t,
    ]),
  );

  const toTimeStr = (dt: Date | null): string | null => {
    if (!dt) return null;
    return dt.toISOString();
  };

  const data = requests.map((r) => {
    const dateKey = `${r.employeeId}_${r.dateAffected.toISOString().split("T")[0]}`;
    const ts = timesheetMap.get(dateKey);

    return {
      id: r.id,
      employeeId: r.employeeId,
      employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
      department: r.employee.employments[0]?.department?.name ?? "—",
      dateAffected: r.dateAffected.toISOString().split("T")[0],
      actionType: r.actionType,
      timeValue: r.timeValue instanceof Date ? r.timeValue.toISOString() : r.timeValue,
      reason: r.reason,
      status: r.status,
      reviewedBy: r.approvedBy?.name ?? null,
      approvedAt: r.approvedAt?.toISOString().split("T")[0] ?? null,
      rejectionReason: r.rejectionReason ?? null,
      createdAt: r.createdAt.toISOString().split("T")[0],
      timesheetOnDate: ts
        ? {
            timeIn: toTimeStr(ts.timeIn),
            lunchStart: toTimeStr(ts.lunchStart),
            lunchEnd: toTimeStr(ts.lunchEnd),
            timeOut: toTimeStr(ts.timeOut),
          }
        : null,
    };
  });

  return NextResponse.json({ data });
}
