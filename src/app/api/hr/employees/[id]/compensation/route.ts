// src/app/api/hr/employees/[id]/compensation/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createCompensationSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { SalaryRateType, SalaryFrequency, PayType, DisbursementType, PagibigContributionType } from "@/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function computeDoleFactor(isPaidRestDays: boolean, restDaysPerWeek: number): number {
  if (isPaidRestDays) return 365;
  if (restDaysPerWeek === 2) return 261;
  if (restDaysPerWeek === 1) return 313;
  return 393.8; // restDaysPerWeek === 0
}

/**
 * GET /api/hr/employees/[id]/compensation
 * Returns all compensation records across all contracts of this employee.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const compensations = await prisma.employeeCompensation.findMany({
    where: { contract: { employment: { employeeId: empId } } },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      contract: {
        select: {
          id: true,
          contractType: true,
          status: true,
          contractStart: true,
        },
      },
    },
  });

  return NextResponse.json({ data: compensations });
}

/**
 * POST /api/hr/employees/[id]/compensation
 * Creates a new compensation record for a given contractId.
 * Deactivates any existing active compensation for that contract first.
 * Calculates doleFactor, calculatedDailyRate, calculatedMonthlyRate server-side.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCompensationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  // Verify the contract belongs to this employee
  const contract = await prisma.employeeContract.findFirst({
    where: { id: parsed.data.contractId, employment: { employeeId: empId } },
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found for this employee" }, { status: 404 });
  }

  const d = parsed.data;

  // Compute rates server-side from inputs
  const doleFactor = computeDoleFactor(d.isPaidRestDays, d.restDaysPerWeek);
  const baseRate = parseFloat(d.baseRate);
  const allowanceRate = d.allowanceRate ? parseFloat(d.allowanceRate) : 0;
  const calculatedDailyRate =
    d.rateType === "DAILY" ? baseRate : (baseRate * 12) / doleFactor;
  const calculatedMonthlyRate =
    d.rateType === "MONTHLY" ? baseRate : (baseRate * doleFactor) / 12;

  // Deactivate any existing active compensation for this contract
  await prisma.employeeCompensation.updateMany({
    where: { contractId: d.contractId, isActive: true },
    data: { isActive: false },
  });

  const compensation = await prisma.employeeCompensation.create({
    data: {
      contractId: d.contractId,
      baseRate,
      allowanceRate,
      rateType: d.rateType as SalaryRateType,
      frequency: d.frequency as SalaryFrequency,
      payType: d.payType as PayType,
      disbursementType: d.disbursementType as DisbursementType,
      bankDetails: d.bankDetails ?? null,
      isPaidRestDays: d.isPaidRestDays,
      restDaysPerWeek: d.restDaysPerWeek,
      doleFactor,
      deductSss: d.deductSss,
      deductPhilhealth: d.deductPhilhealth,
      deductPagibig: d.deductPagibig,
      pagibigType: d.pagibigType as PagibigContributionType,
      deductTax: d.deductTax,
      calculatedDailyRate,
      calculatedMonthlyRate,
      isActive: true,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "EmployeeCompensation",
    entityId: compensation.id,
    description: `Created compensation for contract #${d.contractId} (employee #${empId})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: compensation }, { status: 201 });
}
