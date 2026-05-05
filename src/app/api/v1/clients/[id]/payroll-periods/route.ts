// src/app/api/v1/clients/[id]/payroll-periods/route.ts
//
// GET /api/v1/clients/{id}/payroll-periods
// Returns payroll periods for the client with aggregated totals.
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

  const periods = await prisma.payrollPeriod.findMany({
    where: { clientId },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      payrollSchedule: { select: { id: true, name: true, frequency: true } },
      _count: { select: { payslips: true } },
      payslips: {
        select: { grossPay: true, netPay: true, totalDeductions: true },
      },
    },
  });

  const data = periods.map((p) => ({
    id: p.id,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
    payrollSchedule: p.payrollSchedule,
    payslipCount: p._count.payslips,
    totals: {
      grossPay: p.payslips.reduce((sum, s) => sum + Number(s.grossPay), 0),
      netPay: p.payslips.reduce((sum, s) => sum + Number(s.netPay), 0),
      totalDeductions: p.payslips.reduce((sum, s) => sum + Number(s.totalDeductions), 0),
    },
  }));

  return NextResponse.json({ data });
}
