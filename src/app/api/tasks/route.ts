// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const taskInclude = {
  client: { select: { id: true, businessName: true } },
  template: { select: { id: true, name: true } },
  currentDepartment: { select: { id: true, name: true } },
  currentStatus: { select: { id: true, name: true, color: true } },
  assignedTo: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeNo: true,
    },
  },
  subtasks: {
    orderBy: { order: "asc" as const },
    include: {
      department: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      status: { select: { id: true, name: true, color: true, isExitStep: true } },
    },
  },
} as const;

const createTaskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  clientId: z.number().int().positive().optional(),
  templateId: z.number().int().positive().optional(),
  currentDepartmentId: z.number().int().positive().optional(),
  currentStatusId: z.number().int().positive().optional(),
  assignedToId: z.number().int().positive().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  daysDue: z.number().int().positive().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
});

/**
 * GET /api/tasks
 * Query params: departmentId, statusId, priority, clientId, assignedToId, search
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const departmentId = searchParams.get("departmentId");
  const statusId = searchParams.get("statusId");
  const priority = searchParams.get("priority");
  const clientId = searchParams.get("clientId");
  const assignedToId = searchParams.get("assignedToId");
  const search = searchParams.get("search");

  const tasks = await prisma.task.findMany({
    where: {
      ...(departmentId ? { currentDepartmentId: Number(departmentId) } : {}),
      ...(statusId ? { currentStatusId: Number(statusId) } : {}),
      ...(priority ? { priority: priority as "LOW" | "NORMAL" | "HIGH" | "URGENT" } : {}),
      ...(clientId ? { clientId: Number(clientId) } : {}),
      ...(assignedToId ? { assignedToId: Number(assignedToId) } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: taskInclude,
  });

  return NextResponse.json({ data: tasks });
}

/**
 * POST /api/tasks
 * Creates a new task record.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { dueDate, ...rest } = parsed.data;

  const task = await prisma.task.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: taskInclude,
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Task",
    entityId: String(task.id),
    description: `Created task "${task.name}"`,
    ...getRequestMeta(request),
  });

  // Record history
  void prisma.taskHistory.create({
    data: {
      taskId: task.id,
      actorId: session.user.id,
      changeType: "CREATED",
      newValue: task.name,
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
