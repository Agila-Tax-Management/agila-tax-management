// src/app/api/hr/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  leaderId: z.number().int().positive().optional().nullable(),
});

/**
 * GET /api/hr/teams
 * Returns all teams under the ATMS client with leader info and member count.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const atmsClient = await prisma.client.findUnique({ where: { companyCode: "atms" } });
  if (!atmsClient) return NextResponse.json({ error: "ATMS client not found" }, { status: 500 });

  const teams = await prisma.employeeTeam.findMany({
    where: { clientId: atmsClient.id },
    orderBy: { name: "asc" },
    include: {
      leader: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
      _count: { select: { employments: true } },
    },
  });

  return NextResponse.json({
    data: teams.map((t) => ({
      id: t.id,
      name: t.name,
      leaderId: t.leaderId,
      leaderName: t.leader
        ? `${t.leader.firstName} ${t.leader.lastName}`
        : null,
      leaderEmployeeNo: t.leader?.employeeNo ?? null,
      memberCount: t._count.employments,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/hr/teams
 * Creates a new team under the ATMS client.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const atmsClient = await prisma.client.findUnique({ where: { companyCode: "atms" } });
  if (!atmsClient) return NextResponse.json({ error: "ATMS client not found" }, { status: 500 });

  const duplicate = await prisma.employeeTeam.findFirst({
    where: { clientId: atmsClient.id, name: parsed.data.name },
  });
  if (duplicate) return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 });

  const team = await prisma.employeeTeam.create({
    data: {
      clientId: atmsClient.id,
      name: parsed.data.name,
      leaderId: parsed.data.leaderId ?? null,
    },
    include: {
      leader: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
      _count: { select: { employments: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "EmployeeTeam",
    entityId: String(team.id),
    description: `Created team "${team.name}"`,
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
  }, { status: 201 });
}
