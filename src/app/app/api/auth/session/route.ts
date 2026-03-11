// src/app/app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /app/api/auth/session
 *
 * Returns the authenticated user's session enriched with their
 * employee profile and portal-level permissions.
 *
 * Response shape: { data: SessionWithAccessResponse }
 * Error shape:    { error: string }
 */
export async function GET() {
  const session = await getSessionWithAccess();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized — no active session" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    data: {
      user: session.user,
      employee: session.employee,
      portalAccess: session.portalAccess,
    },
  });
}
