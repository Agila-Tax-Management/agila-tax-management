// src/app/api/hr/payslips/[id]/paid/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/hr/payslips/[id]/paid
 * HR marks a specific payslip as paid (disbursedStatus = COMPLETED).
 * Requires ADMIN or SUPER_ADMIN.
 * Guards: payslip must be approved (approvedAt set) AND acknowledged (acknowledgedAt set).
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
      acknowledgedAt: true,
      disbursedStatus: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });

  if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!payslip.approvedAt) {
    return NextResponse.json(
      { error: "Payslip must be approved before it can be marked as paid" },
      { status: 409 },
    );
  }

  if (!payslip.acknowledgedAt) {
    return NextResponse.json(
      { error: "Employee must acknowledge the payslip before it can be marked as paid" },
      { status: 409 },
    );
  }

  if (payslip.disbursedStatus === "COMPLETED") {
    return NextResponse.json({ error: "Payslip has already been marked as paid" }, { status: 409 });
  }

  const updated = await prisma.payslip.update({
    where: { id },
    data: { disbursedStatus: "COMPLETED" },
  });

  void logActivity({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entity: "Payslip",
    entityId: id,
    description: `Marked payslip as paid for ${payslip.employee.firstName} ${payslip.employee.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
