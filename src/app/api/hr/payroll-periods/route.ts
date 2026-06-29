import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) {
    return NextResponse.json(
      { error: "No active employment found" },
      { status: 403 }
    );
  }

  const periods = await prisma.payrollPeriod.findMany({
    where: {
      clientId,
    },
    include: {
      payrollSchedule: {
        select: {
          id: true,
          name: true,
          frequency: true,
        },
      },
      payslips: {
        select: {
          grossPay: true,
          netPay: true,
          totalDeductions: true,
          // CRITICAL FIX: Pull down every itemized deduction component row explicitly 
          // to bypass empty values or zeroed metrics on old database records
          sssDeduction: true,
          philhealthDeduction: true,
          pagibigDeduction: true,
          withholdingTax: true,
          lateUndertimeDeduction: true,
          pagibigLoan: true,
          sssLoan: true,
          cashAdvanceRepayment: true,
        },
      },
      _count: {
        select: {
          payslips: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return NextResponse.json({
    data: periods.map((period) => {
      // 1. Sum up Gross Pay
      const grossPayTotal = period.payslips.reduce(
        (sum, p) => sum + Number(p.grossPay || 0),
        0
      );

      // 2. Safely calculate total deductions by summing up itemized components if totalDeductions is missing
      const totalDeductionsSum = period.payslips.reduce((sum, p) => {
        const itemizedSum =
          Number(p.sssDeduction || 0) +
          Number(p.philhealthDeduction || 0) +
          Number(p.pagibigDeduction || 0) +
          Number(p.withholdingTax || 0) +
          Number(p.lateUndertimeDeduction || 0) +
          Number(p.pagibigLoan || 0) +
          Number(p.sssLoan || 0) +
          Number(p.cashAdvanceRepayment || 0);

        const trueDeduction = Number(p.totalDeductions) > 0 ? Number(p.totalDeductions) : itemizedSum;
        return sum + trueDeduction;
      }, 0);

      // 3. Enforce valid Net Pay directly on the backend response payload
      const netPayTotal = Math.max(0, grossPayTotal - totalDeductionsSum);

      return {
        id: period.id,
        payrollScheduleId: period.payrollScheduleId,
        payrollSchedule: period.payrollSchedule,
        startDate: period.startDate,
        endDate: period.endDate,
        payoutDate: period.payoutDate,
        status: period.status,
        employeeCount: period._count.payslips,
        grossPayTotal,
        totalDeductionsSum,
        netPayTotal,
      };
    }),
  });
}