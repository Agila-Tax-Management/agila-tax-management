// src/app/api/admin/users/[id]/reactivate/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { updateTag } from "next/cache";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/users/[id]/reactivate
 *
 * Reactivates a previously deactivated user by setting active = true.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.active) {
    return NextResponse.json(
      { error: "User is already active" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { active: true },
    });

    void logActivity({
      userId: session.user.id,
      action: "RESTORED",
      entity: "User",
      entityId: id,
      description: `Reactivated user ${user.name} (${user.email})`,
      ...getRequestMeta(request),
    });

    updateTag("admin-users-list");

    return NextResponse.json({ data: { id } });
  } catch (err: unknown) {
    console.error("[PATCH /api/admin/users/[id]/reactivate] Error:", err);
    return NextResponse.json(
      { error: "Failed to reactivate user" },
      { status: 500 }
    );
  }
}
