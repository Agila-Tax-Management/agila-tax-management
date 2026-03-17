// src/app/api/hr/teams/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

const addMemberSchema = z.object({
  employmentId: z.number().int().positive("Employment ID is required"),
});

/**
 * GET /api/hr/teams/[id]/members
 * Returns all employment records assigned to this team.
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const teamId = Number(id);
  if (isNaN(teamId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const team = await prisma.employeeTeam.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  const employments = await prisma.employeeEmployment.findMany({
    where: { teamId },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
      position: { select: { id: true, title: true } },
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    data: employments.map((e) => ({
      employmentId: e.id,
      employeeId: e.employee.id,
      fullName: `${e.employee.firstName} ${e.employee.lastName}`,
      employeeNo: e.employee.employeeNo,
      position: e.position?.title ?? null,
      department: e.department?.name ?? null,
      employmentStatus: e.employmentStatus,
    })),
  });
}

/**
 * POST /api/hr/teams/[id]/members
 * Assigns an employment record to this team.
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
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

  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const employment = await prisma.employeeEmployment.findUnique({ where: { id: parsed.data.employmentId } });
  if (!employment) return NextResponse.json({ error: "Employment record not found." }, { status: 404 });
  if (employment.teamId === teamId) return NextResponse.json({ error: "Employee is already in this team." }, { status: 409 });

  await prisma.employeeEmployment.update({
    where: { id: parsed.data.employmentId },
    data: { teamId },
  });

  void logActivity({
    userId: session.user.id,
    action: "ASSIGNED",
    entity: "EmployeeTeam",
    entityId: String(teamId),
    description: `Added employment #${parsed.data.employmentId} to team "${team.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { employmentId: parsed.data.employmentId, teamId } }, { status: 201 });
}

/**
 * DELETE /api/hr/teams/[id]/members
 * Removes an employment record from this team.
 * Body: { employmentId: number }
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

  const team = await prisma.employeeTeam.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const employment = await prisma.employeeEmployment.findUnique({ where: { id: parsed.data.employmentId } });
  if (!employment || employment.teamId !== teamId) {
    return NextResponse.json({ error: "Employment record not found in this team." }, { status: 404 });
  }

  await prisma.employeeEmployment.update({
    where: { id: parsed.data.employmentId },
    data: { teamId: null },
  });

  void logActivity({
    userId: session.user.id,
    action: "UNASSIGNED",
    entity: "EmployeeTeam",
    entityId: String(teamId),
    description: `Removed employment #${parsed.data.employmentId} from team "${team.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { employmentId: parsed.data.employmentId } });
}
