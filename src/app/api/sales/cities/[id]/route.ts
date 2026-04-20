// src/app/api/sales/cities/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateCitySchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sales/cities/[id]
 * Returns a single city.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cityId = parseInt(id, 10);
  if (isNaN(cityId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

  return NextResponse.json({ data: city });
}

/**
 * PATCH /api/sales/cities/[id]
 * Updates a city. Admin/Super-Admin only.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const cityId = parseInt(id, 10);
  if (isNaN(cityId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateCitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const existing = await prisma.city.findUnique({ where: { id: cityId } });
  if (!existing) return NextResponse.json({ error: "City not found" }, { status: 404 });

  // Check name uniqueness if name is being changed
  if (parsed.data.name && parsed.data.name !== existing.name) {
    const conflict = await prisma.city.findUnique({ where: { name: parsed.data.name } });
    if (conflict) {
      return NextResponse.json({ error: "A city with this name already exists" }, { status: 409 });
    }
  }

  const updated = await prisma.city.update({
    where: { id: cityId },
    data: parsed.data,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "City",
    entityId: String(cityId),
    description: `Updated city ${updated.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/sales/cities/[id]
 * Soft-deletes a city (sets isActive = false). Admin/Super-Admin only.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const cityId = parseInt(id, 10);
  if (isNaN(cityId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.city.findUnique({ where: { id: cityId } });
  if (!existing) return NextResponse.json({ error: "City not found" }, { status: 404 });

  await prisma.city.update({
    where: { id: cityId },
    data: { isActive: false },
  });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "City",
    entityId: String(cityId),
    description: `Deactivated city ${existing.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}
