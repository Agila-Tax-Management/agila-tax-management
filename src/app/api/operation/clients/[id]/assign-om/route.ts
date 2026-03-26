// src/app/api/operation/clients/[id]/assign-om/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const bodySchema = z.object({
  userId: z.string().nullable(),
});

/**
 * PATCH /api/operation/clients/[id]/assign-om
 * Assigns or unassigns the Operations Manager on a client.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { userId } = parsed.data;

  // Prevent assigning same user as both OM and AO
  if (userId) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { clientRelationOfficerId: true, businessName: true },
    });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    if (client.clientRelationOfficerId === userId) {
      return NextResponse.json(
        { error: "This user is already the Account Officer. OM and AO must be different." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: { operationsManagerId: userId },
    select: { id: true, businessName: true, operationsManager: { select: { id: true, name: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "ASSIGNED",
    entity: "Client",
    entityId: String(clientId),
    description: userId
      ? `Assigned ${updated.operationsManager?.name ?? userId} as Operations Manager for ${updated.businessName}`
      : `Removed Operations Manager from ${updated.businessName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
