// src/app/api/hr/leave-types/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateLeaveTypeSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  isPaid: z.boolean().optional(),
  defaultDays: z.number().min(0).optional(),
  carryOverLimit: z.number().min(0).optional(),
  resetMonth: z.number().int().min(1).max(12).nullable().optional(),
  resetDay: z.number().int().min(1).max(31).nullable().optional(),
});

/**
 * PUT /api/hr/leave-types/[id]
 * Updates a leave type.
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const ltId = parseInt(id, 10);
  if (isNaN(ltId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.leaveType.findFirst({ where: { id: ltId, clientId } });
  if (!existing) return NextResponse.json({ error: "Leave type not found" }, { status: 404 });

  const body = await request.json() as unknown;
  const parsed = updateLeaveTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const nameConflict = await prisma.leaveType.findUnique({
      where: { clientId_name: { clientId, name: parsed.data.name } },
    });
    if (nameConflict) {
      return NextResponse.json(
        { error: `A leave type named "${parsed.data.name}" already exists.` },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.leaveType.update({
    where: { id: ltId },
    data: parsed.data,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "LeaveType",
    entityId: String(ltId),
    description: `Updated leave type "${updated.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/leave-types/[id]
 * Deletes a leave type.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;
  const ltId = parseInt(id, 10);
  if (isNaN(ltId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.leaveType.findFirst({ where: { id: ltId, clientId } });
  if (!existing) return NextResponse.json({ error: "Leave type not found" }, { status: 404 });

  await prisma.leaveType.delete({ where: { id: ltId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "LeaveType",
    entityId: String(ltId),
    description: `Deleted leave type "${existing.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ success: true });
}
