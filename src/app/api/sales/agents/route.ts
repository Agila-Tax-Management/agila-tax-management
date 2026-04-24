// src/app/api/sales/agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { getSalesAgents } from "@/lib/data/sales/reference";

/**
 * GET /api/sales/agents
 * Returns all active users for the assigned sales dropdown.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await getSalesAgents();

  return NextResponse.json({ data: users });
}
