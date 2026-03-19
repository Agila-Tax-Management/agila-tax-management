// src/app/api/sales/service-inclusions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createServiceInclusionSchema } from "@/lib/schemas/sales";

/**
 * GET /api/sales/service-inclusions
 * Returns all active service inclusions for multi-select / reference data.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inclusions = await prisma.serviceInclusion.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, category: true },
  });

  return NextResponse.json({ data: inclusions });
}

/**
 * POST /api/sales/service-inclusions
 * Creates a new service inclusion. Admin/Super-Admin only.
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

  const parsed = createServiceInclusionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const existing = await prisma.serviceInclusion.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return NextResponse.json({ error: "A service inclusion with this name already exists" }, { status: 409 });
  }

  const inclusion = await prisma.serviceInclusion.create({ data: parsed.data });
  return NextResponse.json({ data: inclusion }, { status: 201 });
}
