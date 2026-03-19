// src/app/api/profile/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { changePasswordSchema } from "@/lib/schemas/profile";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * PUT /api/profile/password
 * Changes the current user's password via BetterAuth.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const reqHeaders = await headers();

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      },
      headers: reqHeaders,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to change password";
    // BetterAuth throws with "Invalid password" when current password is wrong.
    if (message.toLowerCase().includes("invalid")) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to change password." }, { status: 500 });
  }

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "User",
    entityId: session.user.id,
    description: `Changed password for ${session.user.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}
