// src/app/api/v1/clients/[id]/leave-requests/route.ts
//
// GET   /api/v1/clients/{id}/leave-requests               — List leave requests
// PATCH /api/v1/clients/{id}/leave-requests/{requestId}   — Approve/reject (OWNER/ADMIN only)
//   handled by [requestId]/route.ts
//
// Query params:
//   - status: PENDING | APPROVED | REJECTED | CANCELLED
//
// Auth: Bearer <ATMS_API_KEY> + X-Client-User-Id header

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyClientAccess } from "@/lib/verify-client-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
type LeaveStatus = (typeof VALID_STATUSES)[number];

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID." }, { status: 400 });

  const access = await verifyClientAccess(request, clientId);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusParam = request.nextUrl.searchParams.get("status");
  const statusFilter =
    statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as LeaveStatus)
      : undefined;

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      clientId,
      employee: { softDelete: false },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      creditUsed: true,
      reason: true,
      createdAt: true,
      leaveType: { select: { id: true, name: true } },
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
        },
      },
    },
  });

  return NextResponse.json({ data: leaves });
}
