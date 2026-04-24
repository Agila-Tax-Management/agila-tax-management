// src/app/api/admin/employee-levels/route.ts
import { NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { getEmployeeLevels } from "@/lib/data/reference/employee-levels";

/**
 * GET /api/admin/employee-levels
 *
 * Returns all employee levels ordered by position ascending
 * (position 1 = highest seniority, e.g. Executive).
 * Requires authenticated session (any internal role).
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const levels = await getEmployeeLevels();

  return NextResponse.json({ data: levels });
}
