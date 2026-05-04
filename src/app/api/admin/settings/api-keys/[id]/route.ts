// src/app/api/admin/settings/api-keys/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

/**
 * DELETE /api/admin/settings/api-keys/[id]
 * Permanently deletes a ClientApiKey record.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.clientApiKey.findUnique({
    where: { id },
    select: { id: true, name: true, clientUser: { select: { email: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  await prisma.clientApiKey.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "ClientApiKey",
    entityId: id,
    description: `Deleted API key "${existing.name}"${existing.clientUser ? ` (owner: ${existing.clientUser.email})` : ''}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}

/**
 * PATCH /api/admin/settings/api-keys/[id]
 * Revokes a key (sets revokedAt) without deleting it — preserves audit trail.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.clientApiKey.findUnique({
    where: { id },
    select: { id: true, name: true, revokedAt: true, clientUser: { select: { email: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }
  if (existing.revokedAt) {
    return NextResponse.json({ error: "API key is already revoked" }, { status: 400 });
  }

  const updated = await prisma.clientApiKey.update({
    where: { id },
    data: { revokedAt: new Date(), enabled: false },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      enabled: true,
      revokedAt: true,
      clientUser: { select: { id: true, name: true, email: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entity: "ClientApiKey",
    entityId: id,
    description: `Revoked API key "${existing.name}"${existing.clientUser ? ` (owner: ${existing.clientUser.email})` : ''}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
