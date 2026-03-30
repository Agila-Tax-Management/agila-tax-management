// src/app/api/hr/payslips/[id]/acknowledge/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/hr/payslips/[id]/acknowledge
 * HR-side manual acknowledgment — used when an employee acknowledges on behalf of
 * a physical signature or HR needs to record it administratively.
 * Requires ADMIN or SUPER_ADMIN.
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
      acknowledgedAt: true,
      payrollPeriod: { select: { status: true } },
    },
  });

  if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (payslip.acknowledgedAt) {
    return NextResponse.json({ error: "Payslip has already been acknowledged" }, { status: 409 });
  }

  if (!["APPROVED", "PAID"].includes(payslip.payrollPeriod.status)) {
    return NextResponse.json(
      { error: "Payslip must be in an Approved or Paid period before acknowledging" },
      { status: 409 },
    );
  }

  const updated = await prisma.payslip.update({
    where: { id },
    data: {
      acknowledgedById: session.user.id,
      acknowledgedAt: new Date(),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Payslip",
    entityId: id,
    description: `HR acknowledged payslip ${id} on behalf of employee`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
