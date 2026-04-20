// src/app/api/operation/clients/[id]/assign-ao/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { notify } from "@/lib/notification";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  // null = unassign
  userId: z.string().nullable(),
});

/**
 * PATCH /api/operation/clients/[id]/assign-ao
 * Assigns or unassigns the Client Relation Officer (Account Officer) on a client.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, businessName: true, clientRelationOfficerId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { userId } = parsed.data;

  // Validate the user exists if assigning
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Prevent assigning the same user as both OM and AO
    const clientFull = await prisma.client.findUnique({
      where: { id: clientId },
      select: { operationsManagerId: true },
    });
    if (clientFull?.operationsManagerId === userId) {
      return NextResponse.json(
        { error: "This user is already the Operations Manager. OM and AO must be different." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: { clientRelationOfficerId: userId },
    select: {
      id: true,
      active: true,
      clientNo: true,
      clientRelationOfficer: { select: { id: true, name: true } },
    },
  });

  if (userId && updated.clientRelationOfficer?.id) {
    const isNewClient = !updated.active || !updated.clientNo;
    void notify({
      userId: updated.clientRelationOfficer.id,
      type: "SYSTEM",
      priority: isNewClient ? "HIGH" : "NORMAL",
      title: isNewClient ? "Complete Client Information" : "New Client Assignment",
      message: isNewClient
        ? `You have been assigned as Account Officer for ${existing.businessName}. Please complete the client information.`
        : `You have been assigned as Account Officer for ${existing.businessName}.`,
      linkUrl: "/portal/operation/client-list",
    });
  }

  void logActivity({
    userId: session.user.id,
    action: "ASSIGNED",
    entity: "Client",
    entityId: String(clientId),
    description: userId
      ? `Assigned Account Officer to client ${existing.businessName}`
      : `Unassigned Account Officer from client ${existing.businessName}`,
    metadata: {
      before: existing.clientRelationOfficerId,
      after: userId,
    },
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      assignedAOId: updated.clientRelationOfficer?.id ?? null,
      assignedAO: updated.clientRelationOfficer?.name ?? null,
    },
  });
}
