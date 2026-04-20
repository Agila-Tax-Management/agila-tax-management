// src/app/api/employee/payslips/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/employee/payslips
 * Returns the logged-in employee's payslips (APPROVED, PAID, CLOSED only).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 403 });
  }

  // Show payslips that have been individually approved by HR.
  // This allows employees to see and acknowledge their payslip even when
  // the overall period is still in PROCESSING status.
  const payslips = await prisma.payslip.findMany({
    where: {
      employeeId: session.employee.id,
      approvedAt: { not: null },
    },
    select: {
      id: true,
      grossPay: true,
      netPay: true,
      totalDeductions: true,
      acknowledgedAt: true,
      disbursedStatus: true,
      payrollPeriod: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          payoutDate: true,
          status: true,
          payrollSchedule: { select: { name: true } },
        },
      },
    },
    orderBy: { payrollPeriod: { startDate: "desc" } },
  });

  return NextResponse.json({ data: payslips });
}
