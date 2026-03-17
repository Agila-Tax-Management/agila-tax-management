// src/app/api/hr/settings/employee-levels/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.number().int().positive("Position must be a positive integer"),
  description: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/hr/settings/employee-levels/[id]
 * Updates an existing employee level.
 */
export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const levelId = Number(id);
  if (isNaN(levelId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, position, description } = parsed.data;

  const existing = await prisma.employeeLevel.findUnique({ where: { id: levelId } });
  if (!existing) return NextResponse.json({ error: "Employee level not found." }, { status: 404 });

  const duplicateName = await prisma.employeeLevel.findFirst({
    where: { name, NOT: { id: levelId } },
  });
  if (duplicateName) {
    return NextResponse.json({ error: "Level name already exists." }, { status: 409 });
  }

  const duplicatePosition = await prisma.employeeLevel.findFirst({
    where: { position, NOT: { id: levelId } },
  });
  if (duplicatePosition) {
    return NextResponse.json({ error: "Position number already taken." }, { status: 409 });
  }

  const updated = await prisma.employeeLevel.update({
    where: { id: levelId },
    data: { name, position, description },
    select: { id: true, name: true, position: true, description: true },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "EmployeeLevel",
    entityId: String(updated.id),
    description: `Updated employee level "${updated.name}" (position ${updated.position})`,
    metadata: { before: { name: existing.name, position: existing.position, description: existing.description }, after: { name, position, description } },
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/settings/employee-levels/[id]
 * Deletes an employee level.
 */
export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const levelId = Number(id);
  if (isNaN(levelId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.employeeLevel.findUnique({ where: { id: levelId } });
  if (!existing) return NextResponse.json({ error: "Employee level not found." }, { status: 404 });

  await prisma.employeeLevel.delete({ where: { id: levelId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "EmployeeLevel",
    entityId: String(levelId),
    description: `Deleted employee level "${existing.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: levelId } });
}
