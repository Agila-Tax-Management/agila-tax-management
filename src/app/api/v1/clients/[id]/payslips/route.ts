// src/app/api/v1/clients/[id]/payslips/route.ts
//
// GET   /api/v1/clients/{id}/payslips         — List payslips for the client
// PATCH /api/v1/clients/{id}/payslips/{payslipId} is handled by [payslipId]/route.ts
//
// Query params:
//   - periodId: number  filter by payroll period
//   - employeeId: number  filter by specific employee
//
// Auth: Bearer <ATMS_API_KEY> + X-Client-User-Id header

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyClientAccess } from "@/lib/verify-client-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID." }, { status: 400 });

  const access = await verifyClientAccess(request, clientId);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const periodIdParam = request.nextUrl.searchParams.get("periodId");
  const employeeIdParam = request.nextUrl.searchParams.get("employeeId");
  const periodId = periodIdParam ? parseInt(periodIdParam, 10) : undefined;
  const employeeId = employeeIdParam ? parseInt(employeeIdParam, 10) : undefined;

  if (periodIdParam && (periodId === undefined || isNaN(periodId))) {
    return NextResponse.json({ error: "Invalid periodId." }, { status: 400 });
  }
  if (employeeIdParam && (employeeId === undefined || isNaN(employeeId))) {
    return NextResponse.json({ error: "Invalid employeeId." }, { status: 400 });
  }

  const payslips = await prisma.payslip.findMany({
    where: {
      payrollPeriod: { clientId },
      ...(periodId !== undefined ? { payrollPeriodId: periodId } : {}),
      ...(employeeId !== undefined ? { employeeId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      disbursedStatus: true,
      grossPay: true,
      netPay: true,
      totalDeductions: true,
      basicPay: true,
      acknowledgedAt: true,
      approvedAt: true,
      payrollPeriod: {
        select: { id: true, startDate: true, endDate: true, status: true },
      },
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

  return NextResponse.json({
    data: payslips.map((p) => ({
      ...p,
      grossPay: Number(p.grossPay),
      netPay: Number(p.netPay),
      totalDeductions: Number(p.totalDeductions),
      basicPay: Number(p.basicPay),
    })),
  });
}
