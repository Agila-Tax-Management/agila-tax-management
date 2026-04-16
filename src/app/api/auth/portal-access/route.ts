// src/app/api/auth/portal-access/route.ts
import { NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import type { AppPortal, PortalRole } from "@/generated/prisma/client";

/**
 * GET /api/auth/portal-access
 * 
 * Returns the current user's role and accessible portals for client-side filtering.
 * 
 * Response:
 * {
 *   userId: "user_123",
 *   userRole: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE",
 *   portals: [
 *     { portal: "SALES", role: "ADMIN" },
 *     { portal: "COMPLIANCE", role: "VIEWER" }
 *   ]
 * }
 */
export async function GET() {
  const session = await getSessionWithAccess();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user, portalRoles = {} } = session;

  // Build array of accessible portals (where role is not null)
  const portals: Array<{ portal: AppPortal; role: PortalRole }> = [];

  for (const [portal, role] of Object.entries(portalRoles) as Array<[AppPortal, PortalRole | null]>) {
    if (role !== null) {
      portals.push({ portal, role });
    }
  }

  return NextResponse.json({
    userId: user.id,
    userRole: user.role,
    portals,
  });
}
