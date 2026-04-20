// src/app/api/employee/payslips/[id]/acknowledge/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/employee/payslips/[id]/acknowledge
 * The logged-in employee acknowledges their own payslip.
 * Guards:
 *  - Must own the payslip (employeeId = session.employee.id)
 *  - Period must be APPROVED or PAID
 *  - Payslip must not already be acknowledged
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 403 });
  }

  const { id } = await params;

  const payslip = await prisma.payslip.findFirst({
    where: { id, employeeId: session.employee.id },
    include: {
      payrollPeriod: { select: { id: true, status: true } },
    },
  });

  if (!payslip) return NextResponse.json({ error: "Payslip not found" }, { status: 404 });

  if (!payslip.approvedAt) {
    return NextResponse.json(
      { error: "Payslip must be approved by HR before it can be acknowledged." },
      { status: 409 },
    );
  }

  if (payslip.acknowledgedAt !== null) {
    return NextResponse.json({ error: "Payslip has already been acknowledged." }, { status: 409 });
  }

  const updated = await prisma.payslip.update({
    where: { id },
    data: {
      acknowledgedById: session.user.id,
      acknowledgedAt: new Date(),
    },
    select: { id: true, acknowledgedAt: true, acknowledgedBy: { select: { name: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "APPROVED",
    entity: "Payslip",
    entityId: id,
    description: `Employee acknowledged payslip`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
