// src/app/api/employee/payslips/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/employee/payslips/[id]
 * Returns a single payslip belonging to the logged-in employee.
 * Only available when the period is APPROVED, PAID, or CLOSED.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 403 });
  }

  const { id } = await params;

  const payslip = await prisma.payslip.findFirst({
    where: {
      id,
      employeeId: session.employee.id,
      // Accessible once individually approved by HR, regardless of overall period status
      approvedAt: { not: null },
    },
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
