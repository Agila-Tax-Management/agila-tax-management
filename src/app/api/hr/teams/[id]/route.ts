// src/app/api/hr/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

const updateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  leaderId: z.number().int().positive().optional().nullable(),
});

/**
 * PUT /api/hr/teams/[id]
 * Updates a team's name and leader.
 */
export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const teamId = Number(id);
  if (isNaN(teamId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.employeeTeam.findUnique({ where: { id: teamId } });
  if (!existing) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  const duplicate = await prisma.employeeTeam.findFirst({
    where: { clientId: existing.clientId, name: parsed.data.name, NOT: { id: teamId } },
  });
  if (duplicate) return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 });

  const team = await prisma.employeeTeam.update({
    where: { id: teamId },
    data: { name: parsed.data.name, leaderId: parsed.data.leaderId ?? null },
    include: {
      leader: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
      _count: { select: { employments: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "EmployeeTeam",
    entityId: String(team.id),
    description: `Updated team "${team.name}"`,
    metadata: { before: { name: existing.name, leaderId: existing.leaderId }, after: { name: team.name, leaderId: team.leaderId } },
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      id: team.id,
      name: team.name,
      leaderId: team.leaderId,
      leaderName: team.leader ? `${team.leader.firstName} ${team.leader.lastName}` : null,
      leaderEmployeeNo: team.leader?.employeeNo ?? null,
      memberCount: team._count.employments,
      createdAt: team.createdAt.toISOString(),
    },
  });
}

/**
 * DELETE /api/hr/teams/[id]
 * Deletes a team and unassigns all members.
 */
export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const teamId = Number(id);
  if (isNaN(teamId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.employeeTeam.findUnique({ where: { id: teamId } });
  if (!existing) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  // Unassign all employment records from this team before deleting
  await prisma.employeeEmployment.updateMany({
    where: { teamId },
    data: { teamId: null },
  });

  await prisma.employeeTeam.delete({ where: { id: teamId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "EmployeeTeam",
    entityId: String(teamId),
    description: `Deleted team "${existing.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: teamId } });
}
