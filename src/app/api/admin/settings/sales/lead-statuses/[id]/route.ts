// src/app/api/admin/settings/sales/lead-statuses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateLeadStatusSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/settings/sales/lead-statuses/[id]
 * Updates a lead status. Admin/Super-Admin only.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const statusId = parseInt(id, 10);
  if (isNaN(statusId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.leadStatus.findUnique({ where: { id: statusId } });
  if (!existing) return NextResponse.json({ error: "Lead status not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateLeadStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  // If setting this as default, clear others first
  if (parsed.data.isDefault === true) {
    await prisma.leadStatus.updateMany({
      where: { isDefault: true, id: { not: statusId } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.leadStatus.update({
    where: { id: statusId },
    data: parsed.data,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "LeadStatus",
    entityId: String(statusId),
    description: `Updated lead status "${updated.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/settings/sales/lead-statuses/[id]
 * Deletes a lead status. Blocked if leads are assigned to it.
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const statusId = parseInt(id, 10);
  if (isNaN(statusId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.leadStatus.findUnique({
    where: { id: statusId },
    include: { _count: { select: { leads: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Lead status not found" }, { status: 404 });

  if (existing._count.leads > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${existing._count.leads} lead(s) are assigned to this status.` },
      { status: 409 },
    );
  }

  await prisma.leadStatus.delete({ where: { id: statusId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "LeadStatus",
    entityId: String(statusId),
    description: `Deleted lead status "${existing.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ success: true });
}
