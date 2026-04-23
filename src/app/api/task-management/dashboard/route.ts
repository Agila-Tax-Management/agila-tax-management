// src/app/api/task-management/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { getTaskManagementDashboard } from "@/lib/data/task-management/dashboard";

/**
 * GET /api/task-management/dashboard
 * Returns aggregated task statistics for the dashboard.
 * Data is cached for 5 minutes via getTaskManagementDashboard().
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getTaskManagementDashboard();
  return NextResponse.json({ data });
}
