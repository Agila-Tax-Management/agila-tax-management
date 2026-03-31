// src/app/api/hr/payslips/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  basicPay: z.number().min(0).optional(),
  holidayPay: z.number().min(0).optional(),
  overtimePay: z.number().min(0).optional(),
  paidLeavePay: z.number().min(0).optional(),
  allowance: z.number().min(0).optional(),
  sssDeduction: z.number().min(0).optional(),
  philhealthDeduction: z.number().min(0).optional(),
  pagibigDeduction: z.number().min(0).optional(),
  withholdingTax: z.number().min(0).optional(),
  lateUndertimeDeduction: z.number().min(0).optional(),
  pagibigLoan: z.number().min(0).optional(),
  sssLoan: z.number().min(0).optional(),
  cashAdvanceRepayment: z.number().min(0).optional(),
});

/**
 * GET /api/hr/payslips/[id]
 * Returns a full payslip with employee details, period info, and audit trail.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;

  const payslip = await prisma.payslip.findFirst({
    where: { id, payrollPeriod: { clientId } },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
          employments: {
            where: { employmentStatus: 'ACTIVE', isPastRole: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              hireDate: true,
              department: { select: { name: true } },
              position: { select: { title: true } },
              contracts: {
                where: { status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  schedule: {
                    select: {
                      id: true,
                      name: true,
                      timezone: true,
                      days: {
                        orderBy: { dayOfWeek: 'asc' },
                        select: {
                          dayOfWeek: true,
                          startTime: true,
                          endTime: true,
                          isWorkingDay: true,
                          breakStart: true,
                          breakEnd: true,
                        },
                      },
                    },
                  },
                  compensations: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                      baseRate: true,
                      allowanceRate: true,
                      payType: true,
                      rateType: true,
                      frequency: true,
                      calculatedDailyRate: true,
                      calculatedMonthlyRate: true,
                      deductSss: true,
                      deductPhilhealth: true,
                      deductPagibig: true,
                      pagibigType: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      payrollPeriod: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          payoutDate: true,
          status: true,
          payrollSchedule: { select: { name: true, frequency: true } },
        },
      },
      preparedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      acknowledgedBy: { select: { id: true, name: true } },
    },
  });

  if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: payslip });
}

/**
 * PATCH /api/hr/payslips/[id]
 * Updates deduction amounts on a payslip and auto-recalculates totals.
 * Only allowed when the parent period is DRAFT or PROCESSING.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.payslip.findFirst({
    where: { id, payrollPeriod: { clientId } },
    select: {
      id: true,
      approvedAt: true,
      basicPay: true,
      holidayPay: true,
      overtimePay: true,
      paidLeavePay: true,
      allowance: true,
      sssDeduction: true,
      philhealthDeduction: true,
      pagibigDeduction: true,
      withholdingTax: true,
      lateUndertimeDeduction: true,
      pagibigLoan: true,
      sssLoan: true,
      cashAdvanceRepayment: true,
      payrollPeriod: { select: { status: true } },
    },
  });

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.approvedAt !== null) {
    return NextResponse.json(
      { error: "This payslip has already been approved and cannot be edited." },
      { status: 409 },
    );
  }

  if (!["DRAFT", "PROCESSING"].includes(existing.payrollPeriod.status)) {
    return NextResponse.json(
      { error: "Deductions can only be edited when the period is Draft or Processing. Revert to Processing first." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const u = parsed.data;

  // Recalculate with any overridden values, falling back to existing
  const basicPay     = u.basicPay                 ?? Number(existing.basicPay);
  const holidayPay   = u.holidayPay               ?? Number(existing.holidayPay);
  const overtimePay  = u.overtimePay              ?? Number(existing.overtimePay);
  const paidLeavePay = u.paidLeavePay             ?? Number(existing.paidLeavePay);
  const allowance    = u.allowance                ?? Number(existing.allowance);
  const sss          = u.sssDeduction             ?? Number(existing.sssDeduction);
  const philhealth   = u.philhealthDeduction       ?? Number(existing.philhealthDeduction);
  const pagibig      = u.pagibigDeduction          ?? Number(existing.pagibigDeduction);
  const tax          = u.withholdingTax            ?? Number(existing.withholdingTax);
  const lateUnder    = u.lateUndertimeDeduction    ?? Number(existing.lateUndertimeDeduction);
  const pagibigLoan  = u.pagibigLoan               ?? Number(existing.pagibigLoan);
  const sssLoan      = u.sssLoan                   ?? Number(existing.sssLoan);
  const cashAdv      = u.cashAdvanceRepayment       ?? Number(existing.cashAdvanceRepayment);

  const totalDeductions = sss + philhealth + pagibig + tax + lateUnder + pagibigLoan + sssLoan + cashAdv;
  const grossPay = basicPay + holidayPay + overtimePay + paidLeavePay + allowance;
  const netPay = Math.max(0, grossPay - totalDeductions);

  const updated = await prisma.payslip.update({
    where: { id },
    data: {
      basicPay,
      holidayPay,
      overtimePay,
      paidLeavePay,
      allowance,
      sssDeduction: sss,
      philhealthDeduction: philhealth,
      pagibigDeduction: pagibig,
      withholdingTax: tax,
      lateUndertimeDeduction: lateUnder,
      pagibigLoan,
      sssLoan,
      cashAdvanceRepayment: cashAdv,
      grossPay,
      totalDeductions,
      netPay,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Payslip",
    entityId: id,
    description: `Edited deductions on payslip ${id}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
