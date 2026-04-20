// src/app/api/hr/employees/[id]/contract/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createContractSchema, updateContractSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { ContractType, ContractStatus } from "@/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hr/employees/[id]/contract
 * Returns all contracts across all employments of the employee.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const contracts = await prisma.employeeContract.findMany({
    where: { employment: { employeeId: empId } },
    orderBy: { createdAt: "desc" },
    include: {
      schedule: { include: { days: { orderBy: { dayOfWeek: "asc" } } } },
      employment: {
        select: {
          id: true,
          employmentStatus: true,
          department: { select: { name: true } },
          position: { select: { title: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: contracts });
}

/**
 * POST /api/hr/employees/[id]/contract
 * Creates a new contract attached to an employment record of this employee.
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

  const parsed = createContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  // Verify the employment belongs to this employee
  const employment = await prisma.employeeEmployment.findFirst({
    where: { id: parsed.data.employmentId, employeeId: empId },
  });
  if (!employment) {
    return NextResponse.json({ error: "Employment record not found for this employee" }, { status: 404 });
  }

  const d = parsed.data;

  const contract = await prisma.employeeContract.create({
    data: {
      employmentId: d.employmentId,
      contractType: d.contractType as ContractType,
      status: d.status as ContractStatus,
      contractStart: new Date(d.contractStart),
      contractEnd: d.contractEnd ? new Date(d.contractEnd) : null,
      scheduleId: d.scheduleId ?? null,
      workingHoursPerWeek: d.workingHoursPerWeek ?? null,
      signedDate: d.signedDate ? new Date(d.signedDate) : null,
      notes: d.notes ?? null,
    },
    include: { schedule: { include: { days: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "EmployeeContract",
    entityId: String(contract.id),
    description: `Created ${d.contractType} contract for employee #${empId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: contract }, { status: 201 });
}

/**
 * PATCH /api/hr/employees/[id]/contract?contractId=
 * Updates a specific contract by contractId query param.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const contractIdParam = searchParams.get("contractId");
  const contractId = contractIdParam ? parseInt(contractIdParam, 10) : NaN;
  if (isNaN(contractId)) return NextResponse.json({ error: "contractId query param is required" }, { status: 400 });

  const existing = await prisma.employeeContract.findFirst({
    where: { id: contractId, employment: { employeeId: empId } },
  });
  if (!existing) return NextResponse.json({ error: "Contract not found for this employee" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const d = parsed.data;

  const updated = await prisma.employeeContract.update({
    where: { id: contractId },
    data: {
      contractType: d.contractType ? (d.contractType as ContractType) : undefined,
      status: d.status ? (d.status as ContractStatus) : undefined,
      contractStart: d.contractStart ? new Date(d.contractStart) : undefined,
      contractEnd: d.contractEnd ? new Date(d.contractEnd) : undefined,
      scheduleId: d.scheduleId !== undefined ? d.scheduleId : undefined,
      workingHoursPerWeek: d.workingHoursPerWeek !== undefined ? d.workingHoursPerWeek : undefined,
      signedDate: d.signedDate ? new Date(d.signedDate) : undefined,
      notes: d.notes !== undefined ? d.notes : undefined,
    },
    include: { schedule: { include: { days: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "EmployeeContract",
    entityId: String(contractId),
    description: `Updated contract #${contractId} for employee #${empId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/employees/[id]/contract?contractId=
 * Deletes a specific contract.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const contractIdParam = searchParams.get("contractId");
  const contractId = contractIdParam ? parseInt(contractIdParam, 10) : NaN;
  if (isNaN(contractId)) return NextResponse.json({ error: "contractId query param is required" }, { status: 400 });

  const existing = await prisma.employeeContract.findFirst({
    where: { id: contractId, employment: { employeeId: empId } },
  });
  if (!existing) return NextResponse.json({ error: "Contract not found for this employee" }, { status: 404 });

  await prisma.employeeContract.delete({ where: { id: contractId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "EmployeeContract",
    entityId: String(contractId),
    description: `Deleted contract #${contractId} for employee #${empId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: contractId } });
}
