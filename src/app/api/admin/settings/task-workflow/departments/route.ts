// src/app/api/admin/settings/task-workflow/departments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";
import { getTaskDepartments } from "@/lib/data/task-management/departments";

// ── Default task management departments & statuses ──────────────────────────
// Covers all 8 operational departments. Auto-created on first access if
// they don't exist; default statuses are added to any dept with none.

const DEFAULT_TASK_DEPARTMENTS = [
  { name: "Operations",      description: "Cross-department oversight and escalation management" },
  { name: "Client Relations", description: "Account officer client communication and task coordination" },
  { name: "Liaison",          description: "Government agency field work and permit processing" },
  { name: "Compliance",       description: "BIR, SEC, and government compliance filings" },
  { name: "Administration",   description: "Executive administration and system management" },
  { name: "Accounting",       description: "Bookkeeping, payroll, and financial reporting" },
  { name: "Human Resources",  description: "HR operations and employee management" },
  { name: "IT",               description: "Information technology infrastructure and technical support" },
];

const DEFAULT_STATUSES = [
  { name: "To Do",       color: "#64748b", isEntryStep: true,  isExitStep: false, statusOrder: 1 },
  { name: "In Progress", color: "#3b82f6", isEntryStep: false, isExitStep: false, statusOrder: 2 },
  { name: "Review",      color: "#ca8a04", isEntryStep: false, isExitStep: false, statusOrder: 3 },
  { name: "Done",        color: "#16a34a", isEntryStep: false, isExitStep: true,  statusOrder: 4 },
];

// Legacy dept names that should be replaced by their canonical counterparts
const LEGACY_DEPT_RENAMES: Record<string, string> = {
  'Operations Manager': 'Operations',
};

async function ensureDefaultDepartments(clientId: number) {
  const existing = await prisma.department.findMany({
    where: { clientId },
    include: { statuses: { select: { id: true } } },
  });
  const existingByName = new Map(existing.map(d => [d.name, d]));

  // ── Cleanup legacy department names ──────────────────────────────────────
  for (const [oldName, newName] of Object.entries(LEGACY_DEPT_RENAMES)) {
    const legacyDept = existingByName.get(oldName);
    if (!legacyDept) continue;

    const canonicalDept = existingByName.get(newName);
    if (!canonicalDept) {
      // Rename legacy → canonical (no conflict)
      await prisma.department.update({
        where: { id: legacyDept.id },
        data: { name: newName },
      });
      existingByName.set(newName, { ...legacyDept, name: newName });
    } else {
      // Both exist — delete legacy (it has no seeded tasks; canonical is the correct one)
      await prisma.departmentTaskStatus.deleteMany({ where: { departmentId: legacyDept.id } });
      await prisma.department.delete({ where: { id: legacyDept.id } });
    }
    existingByName.delete(oldName);
  }

  for (const td of DEFAULT_TASK_DEPARTMENTS) {
    const found = existingByName.get(td.name);
    if (!found) {
      // Department does not exist yet — create it with default statuses.
      // Existing departments are NEVER modified here: their statuses are
      // fully managed by admins via WorkflowSettings and the PATCH/DELETE
      // API routes, so we must not overwrite or re-insert anything.
      const dept = await prisma.department.create({
        data: { clientId, name: td.name, description: td.description },
      });
      await prisma.departmentTaskStatus.createMany({
        data: DEFAULT_STATUSES.map(st => ({ departmentId: dept.id, ...st })),
        skipDuplicates: true,
      });
    }
  }
}

/**
 * GET /api/admin/settings/task-workflow/departments
 * Returns all departments scoped to the current user's client,
 * including their statuses ordered by statusOrder.
 * Auto-creates the default task departments on first access.
 * Data is cached for 1 hour via getTaskDepartments().
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  await ensureDefaultDepartments(clientId);

  const departments = await getTaskDepartments(clientId);
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

  revalidateTag('task-departments', 'max');

  return NextResponse.json({ data: dept }, { status: 201 });
}
