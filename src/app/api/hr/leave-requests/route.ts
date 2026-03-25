// src/app/api/hr/leave-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";

/**
 * GET /api/hr/leave-requests
 * Returns all leave requests for internal employees scoped to the session's client.
 *
 * Query params:
 *   - status: PENDING | APPROVED | REJECTED | CANCELLED | All
 *   - search: string (matches employee name or leave type)
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
  type LeaveStatus = (typeof validStatuses)[number];

  const statusFilter =
    status && status !== "All" && (validStatuses as readonly string[]).includes(status)
      ? (status as LeaveStatus)
      : undefined;

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      clientId,
      // Internal employees only: linked to a User account, not a ClientUser portal account
      employee: {
        userId: { not: null },
        clientUserId: null,
        softDelete: false,
      },
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search
        ? {
            OR: [
              { employee: { firstName: { contains: search, mode: "insensitive" } } },
              { employee: { lastName: { contains: search, mode: "insensitive" } } },
              { leaveType: { name: { contains: search, mode: "insensitive" } } },
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
            select: {
              department: { select: { name: true } },
            },
          },
        },
      },
      leaveType: { select: { id: true, name: true } },
      approvedBy: { select: { name: true } },
    },
  });

  const data = leaves.map((l) => ({
    id: l.id,
    employeeId: l.employeeId,
    employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
    department: l.employee.employments[0]?.department?.name ?? "—",
    leaveTypeId: l.leaveTypeId,
    leaveType: l.leaveType.name,
    startDate: l.startDate.toISOString().split("T")[0],
    endDate: l.endDate.toISOString().split("T")[0],
    creditUsed: parseFloat(l.creditUsed.toString()),
    reason: l.reason,
    status: l.status,
    attachmentUrl: l.attachmentUrl ?? null,
    appliedDate: l.createdAt.toISOString().split("T")[0],
    reviewedBy: l.approvedBy?.name ?? null,
    reviewedDate: l.approvedAt?.toISOString().split("T")[0] ?? null,
    rejectionReason: l.rejectionReason ?? null,
  }));

  return NextResponse.json({ data });
}
