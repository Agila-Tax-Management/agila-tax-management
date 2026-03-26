// src/app/api/sales/leads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateLeadSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { logLeadHistory } from "@/lib/lead-history";

type Params = { params: Promise<{ id: string }> };

const LEAD_INCLUDE = {
  status: { select: { id: true, name: true, color: true, sequence: true, isOnboarding: true, isConverted: true } },
  assignedAgent: { select: { id: true, name: true, email: true } },
  servicePlans: { select: { id: true, name: true, serviceRate: true, recurring: true } },
  serviceOneTimePlans: { select: { id: true, name: true, serviceRate: true } },
  promo: { select: { id: true, name: true, code: true, discountType: true, discountRate: true, promoFor: true } },
  comments: {
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  historyLogs: {
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  invoices: {
    select: { id: true, invoiceNumber: true, status: true },
    orderBy: { issueDate: "asc" as const },
  },
} as const;

/**
 * GET /api/sales/leads/[id]
 * Returns a single lead.
 */
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: LEAD_INCLUDE });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  return NextResponse.json({ data: lead });
}

/**
 * PATCH /api/sales/leads/[id]
 * Updates a lead. Commonly used for status moves (pipeline drag).
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { servicePlanIds, serviceOneTimeIds, promoId, ...leadData } = parsed.data;

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...leadData,
      // promoId: undefined keeps existing; null clears it; a number sets it
      ...(promoId !== undefined ? { promoId: promoId ?? null } : {}),
      ...(servicePlanIds !== undefined ? { servicePlans: { set: servicePlanIds.map((id) => ({ id })) } } : {}),
      ...(serviceOneTimeIds !== undefined ? { serviceOneTimePlans: { set: serviceOneTimeIds.map((id) => ({ id })) } } : {}),
    },
    include: LEAD_INCLUDE,
  });

  const isStatusChange = !!(parsed.data.statusId && parsed.data.statusId !== existing.statusId);
  const isTsaSigned = parsed.data.isSignedTSA === true && !existing.isSignedTSA;
  const action = isStatusChange ? "STATUS_CHANGE" : "UPDATED";

  // Log lead history entry
  if (isStatusChange) {
    // Fetch status names for human-readable old/new values
    const [oldStatus, newStatus] = await Promise.all([
      prisma.leadStatus.findUnique({ where: { id: existing.statusId }, select: { name: true } }),
      prisma.leadStatus.findUnique({ where: { id: parsed.data.statusId! }, select: { name: true } }),
    ]);
    void logLeadHistory({
      leadId,
      actorId: session.user.id,
      changeType: "STATUS_CHANGED",
      oldValue: oldStatus?.name ?? String(existing.statusId),
      newValue: newStatus?.name ?? String(parsed.data.statusId),
    });
  } else if (isTsaSigned) {
    void logLeadHistory({
      leadId,
      actorId: session.user.id,
      changeType: "TSA_SIGNED",
      newValue: lead.signedTsaUrl ?? "TSA document has been marked as signed",
    });
  } else {
    void logLeadHistory({
      leadId,
      actorId: session.user.id,
      changeType: "DETAILS_UPDATED",
    });
  }

  void logActivity({
    userId: session.user.id,
    action,
    entity: "Lead",
    entityId: String(leadId),
    description: action === "STATUS_CHANGE"
      ? `Moved lead ${lead.firstName} ${lead.lastName} to status ID ${parsed.data.statusId}`
      : `Updated lead ${lead.firstName} ${lead.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: lead });
}

/**
 * DELETE /api/sales/leads/[id]
 * Deletes a lead (hard delete — leads aren't archived, they're either lost or active).
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await prisma.lead.delete({ where: { id: leadId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Lead",
    entityId: String(leadId),
    description: `Deleted lead ${existing.firstName} ${existing.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ success: true });
}
