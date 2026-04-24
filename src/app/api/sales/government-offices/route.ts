// src/app/api/sales/government-offices/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createGovernmentOfficeSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { getSalesGovernmentOffices } from "@/lib/data/sales/reference";
import { revalidateTag } from "next/cache";

/**
 * GET /api/sales/government-offices
 * Returns all active government offices for dropdown / reference data.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const offices = await getSalesGovernmentOffices(includeInactive);

  return NextResponse.json({ data: offices });
}

/**
 * POST /api/sales/government-offices
 * Creates a new government office entry. Admin/Super-Admin only.
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

  const parsed = createGovernmentOfficeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const existing = await prisma.governmentOffice.findUnique({
    where: { code: parsed.data.code },
  });
  if (existing) {
    return NextResponse.json({ error: "A government office with this code already exists" }, { status: 409 });
  }

  const office = await prisma.governmentOffice.create({ data: parsed.data });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "GovernmentOffice",
    entityId: String(office.id),
    description: `Created government office ${office.name} (${office.code})`,
    ...getRequestMeta(request),
  });

  revalidateTag("sales-government-offices", "max");

  return NextResponse.json({ data: office }, { status: 201 });
}
