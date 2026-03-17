// src/app/api/hr/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/hr/clients
 * Returns all active clients (for employment assignment dropdowns).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { businessName: "asc" },
    select: { id: true, businessName: true, portalName: true, companyCode: true },
  });

  return NextResponse.json({ data: clients });
}
