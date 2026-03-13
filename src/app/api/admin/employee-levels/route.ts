// src/app/api/admin/employee-levels/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

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

  const levels = await prisma.employeeLevel.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true, position: true, description: true },
  });

  return NextResponse.json({ data: levels });
}
