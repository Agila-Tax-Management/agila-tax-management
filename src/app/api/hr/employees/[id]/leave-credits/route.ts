import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/* ─────────────────────────────────────────────
   SAFE DECIMAL CONVERTER
───────────────────────────────────────────── */
const toNumber = (val: any) => Number(val ?? 0);

/* ─────────────────────────────────────────────
   CORE: USED LEAVE AGGREGATION
───────────────────────────────────────────── */
async function getUsedLeave(employeeId: number, leaveTypeId: number) {
  const agg = await prisma.leaveRequest.aggregate({
    where: {
      employeeId,
      leaveTypeId,
      status: "APPROVED",
    },
    _sum: {
      creditUsed: true,
    },
  });

  return toNumber(agg._sum?.creditUsed);
}

/* ─────────────────────────────────────────────
   MONTHLY BREAKDOWN (LEDGER VIEW)
───────────────────────────────────────────── */
async function getMonthlyUsage(employeeId: number, leaveTypeId: number) {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      leaveTypeId,
      status: "APPROVED",
    },
    select: {
      creditUsed: true,
      startDate: true,
    },
  });

  const map = new Map<string, number>();

  for (const r of requests) {
    const month = new Date(r.startDate).toISOString().slice(0, 7); // YYYY-MM
    const used = toNumber(r.creditUsed);

    map.set(month, (map.get(month) ?? 0) + used);
  }

  return Array.from(map.entries()).map(([month, used]) => ({
    month,
    used,
  }));
}

/* ─────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────── */
const allocateCreditSchema = z.object({
  leaveTypeId: z.number().int().positive(),
  allocated: z.number().positive(),
  validFrom: z.string(),
  expiresAt: z.string(),
  remarks: z.string().optional().nullable(),
});

/* ─────────────────────────────────────────────
   GET: LEAVE CREDITS + LEDGER
───────────────────────────────────────────── */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const employeeId = parseInt((await params).id, 10);
  if (isNaN(employeeId)) {
    return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      employments: {
        some: { clientId, employmentStatus: "ACTIVE" },
      },
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const credits = await prisma.employeeLeaveCredit.findMany({
    where: { employeeId },
    include: {
      leaveType: true,
    },
  });

  const enriched = await Promise.all(
    credits.map(async (c) => {
      const used = await getUsedLeave(employeeId, c.leaveTypeId);
      const monthly = await getMonthlyUsage(employeeId, c.leaveTypeId);

      const allocated = toNumber(c.allocated);
      const balance = allocated - used;

      return {
        id: c.id,
        leaveTypeId: c.leaveTypeId,
        leaveTypeName: c.leaveType.name,
        isPaid: c.leaveType.isPaid,

        allocated,
        used,
        balance,

        validFrom: c.validFrom,
        expiresAt: c.expiresAt,
        isExpired: c.isExpired,
        remarks: c.remarks ?? null,

        // 🆕 LEDGER VIEW
        monthlyUsage: monthly,
      };
    }),
  );

  return NextResponse.json({
    employee,
    data: enriched,
  });
}

/* ─────────────────────────────────────────────
   CREATE CREDIT
───────────────────────────────────────────── */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const employeeId = parseInt((await params).id, 10);

  const body = (await request.json()) as unknown;
  const parsed = allocateCreditSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  const { leaveTypeId, allocated, validFrom, expiresAt, remarks } = parsed.data;

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: leaveTypeId, clientId },
  });

  if (!leaveType) {
    return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
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

  await logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "EmployeeLeaveCredit",
    entityId: String(credit.id),
    description: `Created leave credit block`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: credit }, { status: 201 });
}

/* ─────────────────────────────────────────────
   PATCH (SAFE UPDATE)
───────────────────────────────────────────── */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employeeId = parseInt((await params).id, 10);
  const creditId = parseInt(new URL(request.url).searchParams.get("creditId") ?? "", 10);

  const schema = z.object({
    allocated: z.number().positive().optional(),
    validFrom: z.string().optional(),
    expiresAt: z.string().optional(),
    remarks: z.string().nullable().optional(),
  });

  const body = (await request.json()) as unknown;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 },
    );
  }

  const existing = await prisma.employeeLeaveCredit.findFirst({
    where: { id: creditId, employeeId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Credit not found" }, { status: 404 });
  }

  const used = await getUsedLeave(employeeId, existing.leaveTypeId);

  if (parsed.data.allocated && parsed.data.allocated < used) {
    return NextResponse.json(
      { error: "Cannot reduce below used leave" },
      { status: 400 },
    );
  }

  const updated = await prisma.employeeLeaveCredit.update({
    where: { id: creditId },
    data: {
      ...(parsed.data.allocated !== undefined
        ? { allocated: parsed.data.allocated }
        : {}),
      ...(parsed.data.validFrom
        ? { validFrom: new Date(parsed.data.validFrom) }
        : {}),
      ...(parsed.data.expiresAt
        ? { expiresAt: new Date(parsed.data.expiresAt) }
        : {}),
      remarks: parsed.data.remarks ?? null,
    },
  });

  return NextResponse.json({ data: updated });
}

/* ─────────────────────────────────────────────
   DELETE (SAFE GUARD)
───────────────────────────────────────────── */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const employeeId = parseInt((await params).id, 10);
  const creditId = parseInt(new URL(request.url).searchParams.get("creditId") ?? "", 10);

  const existing = await prisma.employeeLeaveCredit.findFirst({
    where: { id: creditId, employeeId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const used = await getUsedLeave(employeeId, existing.leaveTypeId);

  if (used > 0) {
    return NextResponse.json(
      { error: "Cannot delete used leave credit" },
      { status: 400 },
    );
  }

  await prisma.employeeLeaveCredit.delete({
    where: { id: creditId },
  });

  return NextResponse.json({ success: true });
}