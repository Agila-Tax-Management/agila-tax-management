// src/app/api/sales/promos/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createPromoSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const PROMO_INCLUDE = {
  servicePlans: {
    select: { id: true, name: true, serviceRate: true, recurring: true },
  },
  serviceOneTimePlans: {
    select: { id: true, name: true, serviceRate: true },
  },
} as const;

/**
 * GET /api/sales/promos
 * Returns all promos with linked plan data.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  const promos = await prisma.promo.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" },
    include: PROMO_INCLUDE,
  });

  return NextResponse.json({ data: promos });
}

/**
 * POST /api/sales/promos
 * Creates a new promo. Admin/Super-Admin only.
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

  const parsed = createPromoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  // Validate promo code uniqueness if provided
  if (parsed.data.code) {
    const existing = await prisma.promo.findUnique({
      where: { code: parsed.data.code },
    });
    if (existing) {
      return NextResponse.json({ error: "Promo code already in use" }, { status: 409 });
    }
  }

  const { servicePlanIds, serviceOneTimePlanIds, ...rest } = parsed.data;

  const promo = await prisma.promo.create({
    data: {
      ...rest,
      servicePlans:
        servicePlanIds.length > 0
          ? { connect: servicePlanIds.map((id) => ({ id })) }
          : undefined,
      serviceOneTimePlans:
        serviceOneTimePlanIds.length > 0
          ? { connect: serviceOneTimePlanIds.map((id) => ({ id })) }
          : undefined,
    },
    include: PROMO_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Promo",
    entityId: String(promo.id),
    description: `Created promo: ${promo.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: promo }, { status: 201 });
}
