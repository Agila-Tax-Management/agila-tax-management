// src/app/api/hr/overtime-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";

/**
 * GET /api/hr/overtime-requests
 * Returns all overtime requests for the session's client.
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
  type OTStatus = (typeof validStatuses)[number];

  const statusFilter =
    status && status !== "All" && (validStatuses as readonly string[]).includes(status)
      ? (status as OTStatus)
      : undefined;

  const requests = await prisma.overtimeRequest.findMany({
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

  const data = requests.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
    department: r.employee.employments[0]?.department?.name ?? "—",
    date: r.date.toISOString().split("T")[0],
    type: r.type,
    timeFrom: r.timeFrom instanceof Date ? r.timeFrom.toISOString() : r.timeFrom,
    timeTo: r.timeTo instanceof Date ? r.timeTo.toISOString() : r.timeTo,
    hours: parseFloat(r.hours.toString()),
    reason: r.reason,
    status: r.status,
    reviewedBy: r.approvedBy?.name ?? null,
    approvedAt: r.approvedAt?.toISOString().split("T")[0] ?? null,
    createdAt: r.createdAt.toISOString().split("T")[0],
  }));

  return NextResponse.json({ data });
}
