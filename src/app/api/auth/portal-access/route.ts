// src/app/api/auth/portal-access/route.ts
import { NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import type { AppPortal, PortalRole } from "@/generated/prisma/client";

/**
 * GET /api/auth/portal-access
 * 
 * Returns the current user's role and accessible portals for client-side filtering.
 * 
 * Query Parameters:
 * - portal: (optional) Return role for a specific portal
 * 
 * Response (no portal param):
 * {
 *   userId: "user_123",
 *   userRole: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE",
 *   portals: [
 *     { portal: "SALES", role: "ADMIN" },
 *     { portal: "COMPLIANCE", role: "VIEWER" }
 *   ]
 * }
 * 
 * Response (with portal param):
 * {
 *   role: "ADMIN" | "USER" | "VIEWER" | "SETTINGS" | null,
 *   userRole: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE"
 * }
 */
export async function GET(request: Request) {
  const session = await getSessionWithAccess();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user, portalRoles } = session;
  const { searchParams } = new URL(request.url);
  const portalParam = searchParams.get('portal') as AppPortal | null;

  // If portal param is provided, return role for that specific portal
  if (portalParam) {
    return NextResponse.json({
      role: portalRoles[portalParam] ?? null,
      userRole: user.role,
    });
  }

  // Otherwise, return all accessible portals
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
