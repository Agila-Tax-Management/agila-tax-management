// src/app/api/hr/payroll-periods/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import type { PayrollPeriodStatus } from "@/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "PROCESSING", "APPROVED", "PAID", "CLOSED"]),
});

/**
 * GET /api/hr/payroll-periods/[id]
 * Returns a specific payroll period with all its payslips and employee details.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const periodId = parseInt(id, 10);
  if (isNaN(periodId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const period = await prisma.payrollPeriod.findFirst({
    where: { id: periodId, clientId },
    include: {
      payrollSchedule: { select: { id: true, name: true, frequency: true } },
      payslips: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNo: true,
            },
          },
          preparedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          acknowledgedBy: { select: { id: true, name: true } },
        },
        orderBy: [
          { employee: { lastName: "asc" } },
        ],
      },
    },
  });

  if (!period) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: period });
}

/**
 * PATCH /api/hr/payroll-periods/[id]
 * Updates the status of a payroll period.
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
  const periodId = parseInt(id, 10);
  if (isNaN(periodId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.payrollPeriod.findFirst({ where: { id: periodId, clientId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const targetStatus = parsed.data.status as PayrollPeriodStatus;

  // ── APPROVED: bulk-approve all unapproved payslips atomically ──────────────
  if (targetStatus === "APPROVED") {
    const updated = await prisma.$transaction(async (tx) => {
      // Stamp every payslip that hasn't been individually approved yet
      await tx.payslip.updateMany({
        where: { payrollPeriodId: periodId, approvedAt: null },
        data: { approvedById: session.user.id, approvedAt: new Date() },
      });
      return tx.payrollPeriod.update({
        where: { id: periodId },
        data: { status: "APPROVED" },
      });
    });

    void logActivity({
      userId: session.user.id,
      action: "APPROVED",
      entity: "PayrollPeriod",
      entityId: String(periodId),
      description: `Approved payroll period #${periodId} and all its payslips`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: updated });
  }

  // ── PAID: guard all approved + acknowledged, then bulk set COMPLETED ────────
  if (targetStatus === "PAID") {
    const [unapproved, unacknowledged, total] = await Promise.all([
      prisma.payslip.count({ where: { payrollPeriodId: periodId, approvedAt: null } }),
      prisma.payslip.count({ where: { payrollPeriodId: periodId, acknowledgedAt: null } }),
      prisma.payslip.count({ where: { payrollPeriodId: periodId } }),
    ]);

    if (unapproved > 0) {
      return NextResponse.json(
        { error: `${unapproved} of ${total} payslips have not yet been approved.` },
        { status: 409 },
      );
    }
    if (unacknowledged > 0) {
      return NextResponse.json(
        { error: `${unacknowledged} of ${total} employees have not yet acknowledged their payslip.` },
        { status: 409 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: { payrollPeriodId: periodId },
        data: { disbursedStatus: "COMPLETED" },
      });
      return tx.payrollPeriod.update({
        where: { id: periodId },
        data: { status: "PAID" },
      });
    });

    void logActivity({
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entity: "PayrollPeriod",
      entityId: String(periodId),
      description: `Marked payroll period #${periodId} as Paid`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: updated });
  }

  // ── PROCESSING: revert — clear all individual payslip approvals ─────────────
  if (targetStatus === "PROCESSING") {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: { payrollPeriodId: periodId },
        data: { approvedAt: null, approvedById: null },
      });
      return tx.payrollPeriod.update({
        where: { id: periodId },
        data: { status: "PROCESSING" },
      });
    });

    void logActivity({
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entity: "PayrollPeriod",
      entityId: String(periodId),
      description: `Reverted payroll period #${periodId} to Processing, clearing all payslip approvals`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: updated });
  }

  // ── Other status transitions (DRAFT, CLOSED) ──────────────────────────────
  const updated = await prisma.payrollPeriod.update({
    where: { id: periodId },
    data: { status: targetStatus },
  });

  void logActivity({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entity: "PayrollPeriod",
    entityId: String(periodId),
    description: `Changed payroll period #${periodId} status to ${targetStatus}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
