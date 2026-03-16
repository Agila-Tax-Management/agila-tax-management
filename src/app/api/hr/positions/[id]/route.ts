// src/app/api/hr/positions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updatePositionSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hr/positions/[id]
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const posId = parseInt(id, 10);
  if (isNaN(posId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const position = await prisma.position.findUnique({
    where: { id: posId },
    include: {
      department: { select: { id: true, name: true } },
      _count: { select: { employments: true } },
    },
  });

  if (!position) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  return NextResponse.json({ data: position });
}

/**
 * PATCH /api/hr/positions/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const posId = parseInt(id, 10);
  if (isNaN(posId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updatePositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.position.findUnique({ where: { id: posId } });
  if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  const updated = await prisma.position.update({
    where: { id: posId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      departmentId: parsed.data.departmentId,
    },
    include: { department: { select: { name: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Position",
    entityId: String(posId),
    description: `Updated position ${updated.title}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/positions/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const posId = parseInt(id, 10);
  if (isNaN(posId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.position.findUnique({
    where: { id: posId },
    include: { _count: { select: { employments: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  if (existing._count.employments > 0) {
    return NextResponse.json(
      { error: "Cannot delete a position with active employees. Reassign them first." },
      { status: 409 },
    );
  }

  await prisma.position.delete({ where: { id: posId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Position",
    entityId: String(posId),
    description: `Deleted position ${existing.title}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: posId } });
}
