// src/app/api/admin/settings/sales/lead-statuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createLeadStatusSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

/**
 * GET /api/admin/settings/sales/lead-statuses
 * Returns all lead statuses ordered by sequence.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statuses = await prisma.leadStatus.findMany({
    orderBy: { sequence: "asc" },
    include: {
      _count: { select: { leads: true } },
    },
  });

  return NextResponse.json({ data: statuses });
}

/**
 * POST /api/admin/settings/sales/lead-statuses
 * Creates a new lead status. Admin/Super-Admin only.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createLeadStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  // If isDefault is true, clear existing default
  if (parsed.data.isDefault) {
    await prisma.leadStatus.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  const status = await prisma.leadStatus.create({ data: parsed.data });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "LeadStatus",
    entityId: String(status.id),
    description: `Created lead status "${status.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: status }, { status: 201 });
}
