// src/app/api/admin/settings/task-workflow/departments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

// ── Default task management departments & statuses ──────────────────────────
// Matches the 4 operational departments used by the task board
// (Operations Manager, Client Relations, Liaison, Compliance).
// These are auto-created on first access so no manual seeding is needed.

const DEFAULT_TASK_DEPARTMENTS = [
  { name: "Operations Manager", description: "Cross-department oversight and escalation management" },
  { name: "Client Relations",   description: "Account officer client communication and task coordination" },
  { name: "Liaison",            description: "Government agency field work and permit processing" },
  { name: "Compliance",         description: "BIR, SEC, and government compliance filings" },
];

const DEFAULT_STATUSES = [
  { name: "To Do",       color: "#64748b", isEntryStep: true,  isExitStep: false, statusOrder: 1 },
  { name: "In Progress", color: "#3b82f6", isEntryStep: false, isExitStep: false, statusOrder: 2 },
  { name: "Review",      color: "#ca8a04", isEntryStep: false, isExitStep: false, statusOrder: 3 },
  { name: "Done",        color: "#16a34a", isEntryStep: false, isExitStep: true,  statusOrder: 4 },
];

async function ensureDefaultDepartments(clientId: number) {
  const existing = await prisma.department.findMany({
    where: { clientId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map(d => d.name));

  for (const td of DEFAULT_TASK_DEPARTMENTS) {
    if (existingNames.has(td.name)) continue;

    const dept = await prisma.department.create({
      data: { clientId, name: td.name, description: td.description },
    });

    await prisma.departmentTaskStatus.createMany({
      data: DEFAULT_STATUSES.map(st => ({ departmentId: dept.id, ...st })),
      skipDuplicates: true,
    });
  }
}

/**
 * GET /api/admin/settings/task-workflow/departments
 * Returns all departments scoped to the current user's client,
 * including their statuses ordered by statusOrder.
 * Auto-creates the 4 default task departments on first access.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  await ensureDefaultDepartments(clientId);

  const departments = await prisma.department.findMany({
    where: { clientId },
    orderBy: { name: "asc" },
    include: {
      statuses: { orderBy: { statusOrder: "asc" } },
    },
  });

  return NextResponse.json({ data: departments });
}

const createDeptSchema = z.object({
  name: z.string().min(1, "Department name is required").max(80),
  description: z.string().optional(),
});

/**
 * POST /api/admin/settings/task-workflow/departments
 * Creates a new department scoped to the current user's client.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createDeptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.department.findUnique({
    where: { clientId_name: { clientId, name: parsed.data.name } },
  });
  if (existing) {
    return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
  }

  const dept = await prisma.department.create({
    data: {
      clientId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
    include: { statuses: true },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Department",
    entityId: String(dept.id),
    description: `Created department "${dept.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: dept }, { status: 201 });
}
