// src/app/api/hr/payslips/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/hr/payslips/[id]/approve
 * HR individually approves a payslip, setting approvedById + approvedAt.
 * Once approved the payslip becomes visible on the employee's dashboard.
 * Requires ADMIN or SUPER_ADMIN. Period must be DRAFT or PROCESSING.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;

  const payslip = await prisma.payslip.findFirst({
    where: { id, payrollPeriod: { clientId } },
    select: {
      id: true,
      approvedAt: true,
      employee: { select: { firstName: true, lastName: true } },
      payrollPeriod: { select: { status: true } },
    },
  });

  if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (payslip.approvedAt) {
    return NextResponse.json({ error: "This payslip has already been approved" }, { status: 409 });
  }

  if (!["DRAFT", "PROCESSING"].includes(payslip.payrollPeriod.status)) {
    return NextResponse.json(
      { error: "Payslip can only be approved when the period is in Draft or Processing status" },
      { status: 409 },
    );
  }

  const updated = await prisma.payslip.update({
    where: { id },
    data: {
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "APPROVED",
    entity: "Payslip",
    entityId: id,
    description: `Approved payslip for ${payslip.employee.firstName} ${payslip.employee.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
