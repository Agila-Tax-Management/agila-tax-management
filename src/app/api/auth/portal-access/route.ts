// src/app/api/auth/portal-access/route.ts
import { NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { getPortalAccessForUser } from "@/lib/data/auth/portal-access";
import type { AppPortal } from "@/generated/prisma/client";

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

  const { user } = session;
  const { searchParams } = new URL(request.url);
  const portalParam = searchParams.get('portal') as AppPortal | null;

  // Use the cached function for all DB lookups
  const cached = await getPortalAccessForUser(user.id, user.role);

  // If portal param is provided, return role for that specific portal
  if (portalParam) {
    const match = cached.portals.find((p) => p.portal === portalParam);
    return NextResponse.json({
      role: match?.role ?? null,
      userRole: user.role,
    });
  }

  return NextResponse.json({
    userId: user.id,
    userRole: user.role,
    portals: cached.portals,
  });
}
