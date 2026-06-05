// src/app/api/hr/teams/[id]/positions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  positionId: z.number().int().positive("Position ID is required"),
});

/**
 * POST /api/hr/teams/[id]/positions
 * Assigns a position to a team.
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "ADMIN" &&
    !session.portalAccess?.HR?.canWrite
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const teamId = Number(id);
  if (isNaN(teamId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const team = await prisma.employeeTeam.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const position = await prisma.position.findUnique({ where: { id: parsed.data.positionId } });
  if (!position) return NextResponse.json({ error: "Position not found." }, { status: 404 });

  const existing = await prisma.employeeTeamPosition.findUnique({
    where: { teamId_positionId: { teamId, positionId: parsed.data.positionId } },
  });
  if (existing) return NextResponse.json({ error: "This position is already assigned to the team." }, { status: 409 });

  const teamPosition = await prisma.employeeTeamPosition.create({
    data: { teamId, positionId: parsed.data.positionId },
    include: {
      position: {
        select: {
          id: true,
          title: true,
          employments: {
            where: { employmentStatus: "ACTIVE", isPastRole: false },
            select: {
              id: true,
              employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
            },
          },
        },
      },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "ASSIGNED",
    entity: "EmployeeTeam",
    entityId: String(teamId),
    description: `Assigned position "${position.title}" to team "${team.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      id: teamPosition.position.id,
      title: teamPosition.position.title,
      employees: teamPosition.position.employments.map((e) => ({
        employmentId: e.id,
        employeeId: e.employee.id,
        fullName: `${e.employee.firstName} ${e.employee.lastName}`,
        employeeNo: e.employee.employeeNo,
      })),
    },
  }, { status: 201 });
}

/**
 * DELETE /api/hr/teams/[id]/positions
 * Removes a position from a team.
 * Body: { positionId: number }
 */
export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "ADMIN" &&
    !session.portalAccess?.HR?.canWrite
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const teamId = Number(id);
  if (isNaN(teamId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const team = await prisma.employeeTeam.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.employeeTeamPosition.findUnique({
    where: { teamId_positionId: { teamId, positionId: parsed.data.positionId } },
    include: { position: { select: { title: true } } },
  });
  if (!existing) return NextResponse.json({ error: "This position is not assigned to the team." }, { status: 404 });

  await prisma.employeeTeamPosition.delete({
    where: { teamId_positionId: { teamId, positionId: parsed.data.positionId } },
  });

  void logActivity({
    userId: session.user.id,
    action: "UNASSIGNED",
    entity: "EmployeeTeam",
    entityId: String(teamId),
    description: `Removed position "${existing.position.title}" from team "${team.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { positionId: parsed.data.positionId } });
}
