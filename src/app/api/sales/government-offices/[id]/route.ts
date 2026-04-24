// src/app/api/sales/government-offices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateGovernmentOfficeSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sales/government-offices/[id]
 * Returns a single government office.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const officeId = parseInt(id, 10);
  if (isNaN(officeId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const office = await prisma.governmentOffice.findUnique({ where: { id: officeId } });
  if (!office) return NextResponse.json({ error: "Government office not found" }, { status: 404 });

  return NextResponse.json({ data: office });
}

/**
 * PATCH /api/sales/government-offices/[id]
 * Updates a government office. Admin/Super-Admin only.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const officeId = parseInt(id, 10);
  if (isNaN(officeId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateGovernmentOfficeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const existing = await prisma.governmentOffice.findUnique({ where: { id: officeId } });
  if (!existing) return NextResponse.json({ error: "Government office not found" }, { status: 404 });

  // Check code uniqueness if code is being changed
  if (parsed.data.code && parsed.data.code !== existing.code) {
    const conflict = await prisma.governmentOffice.findUnique({ where: { code: parsed.data.code } });
    if (conflict) {
      return NextResponse.json({ error: "A government office with this code already exists" }, { status: 409 });
    }
  }

  const updated = await prisma.governmentOffice.update({
    where: { id: officeId },
    data: parsed.data,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "GovernmentOffice",
    entityId: String(officeId),
    description: `Updated government office ${updated.name} (${updated.code})`,
    ...getRequestMeta(request),
  });

  revalidateTag("sales-government-offices", "max");

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/sales/government-offices/[id]
 * Soft-deletes a government office (sets isActive = false). Admin/Super-Admin only.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const officeId = parseInt(id, 10);
  if (isNaN(officeId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.governmentOffice.findUnique({ where: { id: officeId } });
  if (!existing) return NextResponse.json({ error: "Government office not found" }, { status: 404 });

  await prisma.governmentOffice.update({
    where: { id: officeId },
    data: { isActive: false },
  });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "GovernmentOffice",
    entityId: String(officeId),
    description: `Deactivated government office ${existing.name} (${existing.code})`,
    ...getRequestMeta(request),
  });

  revalidateTag("sales-government-offices", "max");

  return NextResponse.json({ data: { success: true } });
}
