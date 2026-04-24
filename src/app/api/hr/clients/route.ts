// src/app/api/hr/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { getHrClients } from "@/lib/data/reference/hr-clients";

/**
 * GET /api/hr/clients
 * Returns all active clients (for employment assignment dropdowns).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await getHrClients();

  return NextResponse.json({ data: clients });
}
