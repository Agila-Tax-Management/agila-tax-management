// src/app/api/hr/payroll-schedules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { SalaryFrequency } from "@/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  frequency: z.enum(["ONCE_A_MONTH", "TWICE_A_MONTH", "WEEKLY"]).optional(),
  firstPeriodStartDay: z.number().int().min(1).max(31).optional(),
  firstPeriodEndDay: z.number().int().min(1).max(31).optional(),
  firstPayoutDay: z.number().int().min(1).max(31).optional(),
  secondPeriodStartDay: z.number().int().min(1).max(31).nullable().optional(),
  secondPeriodEndDay: z.number().int().min(1).max(31).nullable().optional(),
  secondPayoutDay: z.number().int().min(1).max(31).nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/hr/payroll-schedules/[id]
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const schedule = await prisma.payrollSchedule.findFirst({
    where: { id, clientId },
    include: {
      _count: { select: { compensations: true, payrollPeriods: true } },
    },
  });

  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: schedule });
}

/**
 * PATCH /api/hr/payroll-schedules/[id]
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
  const existing = await prisma.payrollSchedule.findFirst({ where: { id, clientId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const updated = await prisma.payrollSchedule.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.frequency !== undefined && { frequency: d.frequency as SalaryFrequency }),
      ...(d.firstPeriodStartDay !== undefined && { firstPeriodStartDay: d.firstPeriodStartDay }),
      ...(d.firstPeriodEndDay !== undefined && { firstPeriodEndDay: d.firstPeriodEndDay }),
      ...(d.firstPayoutDay !== undefined && { firstPayoutDay: d.firstPayoutDay }),
      ...(d.secondPeriodStartDay !== undefined && { secondPeriodStartDay: d.secondPeriodStartDay }),
      ...(d.secondPeriodEndDay !== undefined && { secondPeriodEndDay: d.secondPeriodEndDay }),
      ...(d.secondPayoutDay !== undefined && { secondPayoutDay: d.secondPayoutDay }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "PayrollSchedule",
    entityId: id,
    description: `Updated payroll schedule "${updated.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/payroll-schedules/[id]
 * Refuses deletion if any compensations or periods are linked.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.payrollSchedule.findFirst({
    where: { id, clientId },
    include: {
      _count: { select: { compensations: true, payrollPeriods: true } },
    },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing._count.compensations > 0 || existing._count.payrollPeriods > 0) {
    return NextResponse.json(
      { error: "Cannot delete: schedule is linked to active compensations or payroll periods." },
      { status: 409 },
    );
  }

  await prisma.payrollSchedule.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "PayrollSchedule",
    entityId: id,
    description: `Deleted payroll schedule "${existing.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id } });
}
