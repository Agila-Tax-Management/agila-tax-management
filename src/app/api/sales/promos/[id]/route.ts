// src/app/api/sales/promos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updatePromoSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const PROMO_INCLUDE = {
  services: {
    select: { id: true, name: true, serviceRate: true, billingType: true },
  },
} as const;

/**
 * GET /api/sales/promos/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const promoId = parseInt(id, 10);
  if (isNaN(promoId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const promo = await prisma.promo.findUnique({
    where: { id: promoId },
    include: PROMO_INCLUDE,
  });

  if (!promo) return NextResponse.json({ error: "Promo not found" }, { status: 404 });

  return NextResponse.json({ data: promo });
}

/**
 * PATCH /api/sales/promos/[id]
 * Admin/Super-Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const promoId = parseInt(id, 10);
  if (isNaN(promoId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updatePromoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  // Validate promo code uniqueness if changing the code
  if (parsed.data.code) {
    const conflict = await prisma.promo.findFirst({
      where: { code: parsed.data.code, id: { not: promoId } },
    });
    if (conflict) {
      return NextResponse.json({ error: "Promo code already in use" }, { status: 409 });
    }
  }

  const { serviceIds, ...rest } = parsed.data;

  const promo = await prisma.promo.update({
    where: { id: promoId },
    data: {
      ...rest,
      ...(serviceIds !== undefined && {
        services: { set: serviceIds.map((id) => ({ id })) },
      }),
    },
    include: PROMO_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Promo",
    entityId: String(promo.id),
    description: `Updated promo: ${promo.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: promo });
}

/**
 * DELETE /api/sales/promos/[id]
 * Admin/Super-Admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const promoId = parseInt(id, 10);
  if (isNaN(promoId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.promo.findUnique({ where: { id: promoId } });
  if (!existing) return NextResponse.json({ error: "Promo not found" }, { status: 404 });

  await prisma.promo.delete({ where: { id: promoId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Promo",
    entityId: String(promoId),
    description: `Deleted promo: ${existing.name}`,
    ...getRequestMeta(request),
  });

  return new NextResponse(null, { status: 204 });
}
