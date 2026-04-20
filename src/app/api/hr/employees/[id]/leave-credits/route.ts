// src/app/api/hr/employees/[id]/leave-credits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const allocateCreditSchema = z.object({
  leaveTypeId: z.number().int().positive("Leave type is required"),
  allocated: z.number().positive("Allocated days must be greater than 0"),
  validFrom: z.string().min(1, "Valid from date is required"),
  expiresAt: z.string().min(1, "Expiry date is required"),
  remarks: z.string().optional().nullable(),
});

/**
 * GET /api/hr/employees/[id]/leave-credits
 * Returns all leave credit records for a specific employee.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const employeeId = parseInt(id, 10);
  if (isNaN(employeeId)) return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });

  // Ensure the employee belongs to the same client
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      employments: { some: { clientId, employmentStatus: "ACTIVE" } },
    },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const credits = await prisma.employeeLeaveCredit.findMany({
    where: { employeeId },
    include: {
      leaveType: { select: { id: true, name: true, isPaid: true } },
    },
    orderBy: [{ isExpired: "asc" }, { expiresAt: "desc" }],
  });

  const data = credits.map((c) => ({
    id: c.id,
    leaveTypeId: c.leaveTypeId,
    leaveTypeName: c.leaveType.name,
    isPaid: c.leaveType.isPaid,
    allocated: parseFloat(c.allocated.toString()),
    used: parseFloat(c.used.toString()),
    balance: parseFloat(c.allocated.toString()) - parseFloat(c.used.toString()),
    validFrom: c.validFrom.toISOString().split("T")[0],
    expiresAt: c.expiresAt.toISOString().split("T")[0],
    isExpired: c.isExpired,
    remarks: c.remarks ?? null,
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/hr/employees/[id]/leave-credits
 * Allocates a new leave credit block to an employee.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const employeeId = parseInt(id, 10);
  if (isNaN(employeeId)) return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });

  // Ensure the employee belongs to the same client
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      employments: { some: { clientId, employmentStatus: "ACTIVE" } },
    },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const body = (await request.json()) as unknown;
  const parsed = allocateCreditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { leaveTypeId, allocated, validFrom, expiresAt, remarks } = parsed.data;

  if (new Date(expiresAt) <= new Date(validFrom)) {
    return NextResponse.json(
      { error: "Expiry date must be after valid from date." },
      { status: 400 },
    );
  }

  // Verify the leave type belongs to this client
  const leaveType = await prisma.leaveType.findFirst({
    where: { id: leaveTypeId, clientId },
    select: { id: true, name: true },
  });
  if (!leaveType) {
    return NextResponse.json({ error: "Leave type not found." }, { status: 404 });
  }

  const credit = await prisma.employeeLeaveCredit.create({
    data: {
      employeeId,
      leaveTypeId,
      allocated,
      used: 0,
      validFrom: new Date(validFrom),
      expiresAt: new Date(expiresAt),
      isExpired: false,
      remarks: remarks ?? null,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "EmployeeLeaveCredit",
    entityId: String(credit.id),
    description: `Allocated ${allocated} day(s) of ${leaveType.name} to ${employee.firstName} ${employee.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: credit }, { status: 201 });
}

/**
 * PATCH /api/hr/employees/[id]/leave-credits?creditId=:n
 * Updates allocated days, validity dates, or remarks on a leave credit block.
 * Cannot reduce allocated below what has already been used.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const employeeId = parseInt(id, 10);
  if (isNaN(employeeId)) return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const creditId = parseInt(searchParams.get("creditId") ?? "", 10);
  if (isNaN(creditId)) return NextResponse.json({ error: "creditId query parameter is required" }, { status: 400 });

  const patchSchema = z.object({
    allocated: z.number().positive("Allocated days must be greater than 0").optional(),
    validFrom: z.string().min(1).optional(),
    expiresAt: z.string().min(1).optional(),
    remarks: z.string().optional().nullable(),
  });

  const body = (await request.json()) as unknown;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.employeeLeaveCredit.findFirst({
    where: { id: creditId, employeeId },
  });
  if (!existing) return NextResponse.json({ error: "Leave credit not found" }, { status: 404 });

  const { allocated, validFrom, expiresAt, remarks } = parsed.data;

  if (allocated !== undefined) {
    const usedNum = parseFloat(existing.used.toString());
    if (allocated < usedNum) {
      return NextResponse.json(
        { error: `Cannot set allocated below already used amount (${usedNum}).` },
        { status: 400 },
      );
    }
  }

  const newValidFrom = validFrom ? new Date(validFrom) : existing.validFrom;
  const newExpiresAt = expiresAt ? new Date(expiresAt) : existing.expiresAt;

  if (newExpiresAt <= newValidFrom) {
    return NextResponse.json(
      { error: "Expiry date must be after valid from date." },
      { status: 400 },
    );
  }

  const updated = await prisma.employeeLeaveCredit.update({
    where: { id: creditId },
    data: {
      ...(allocated !== undefined ? { allocated } : {}),
      ...(validFrom ? { validFrom: newValidFrom } : {}),
      ...(expiresAt ? { expiresAt: newExpiresAt } : {}),
      ...(remarks !== undefined ? { remarks: remarks ?? null } : {}),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "EmployeeLeaveCredit",
    entityId: String(creditId),
    description: `Updated leave credit #${creditId} for employee #${employeeId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/employees/[id]/leave-credits?creditId=:n
 * Deletes a leave credit block. Only allowed when used === 0.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const employeeId = parseInt(id, 10);
  if (isNaN(employeeId)) return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const creditId = parseInt(searchParams.get("creditId") ?? "", 10);
  if (isNaN(creditId)) return NextResponse.json({ error: "creditId query parameter is required" }, { status: 400 });

  const existing = await prisma.employeeLeaveCredit.findFirst({
    where: { id: creditId, employeeId },
    include: { leaveType: { select: { name: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Leave credit not found" }, { status: 404 });

  const usedNum = parseFloat(existing.used.toString());
  if (usedNum > 0) {
    return NextResponse.json(
      { error: `Cannot delete a credit block with ${usedNum} day(s) already used.` },
      { status: 400 },
    );
  }

  // Verify employee belongs to this client before deleting
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      employments: { some: { clientId, employmentStatus: "ACTIVE" } },
    },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  await prisma.employeeLeaveCredit.delete({ where: { id: creditId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "EmployeeLeaveCredit",
    entityId: String(creditId),
    description: `Deleted ${existing.leaveType.name} credit block for ${employee.firstName} ${employee.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ success: true });
}

