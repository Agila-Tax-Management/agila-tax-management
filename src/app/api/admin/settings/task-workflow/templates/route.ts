// src/app/api/admin/settings/task-workflow/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  daysDue: z.number().int().positive().optional(),
});

/**
 * GET /api/admin/settings/task-workflow/templates
 * Returns all task templates with their department routes and subtasks.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.taskTemplate.findMany({
    orderBy: { id: "asc" },
    include: {
      departmentRoutes: {
        orderBy: { routeOrder: "asc" },
        include: {
          department: { select: { id: true, name: true } },
          subtasks: { orderBy: { subtaskOrder: "asc" } },
        },
      },
      servicePlans: {
        select: { id: true, name: true, serviceRate: true, recurring: true, status: true },
      },
      serviceOneTimePlans: {
        select: { id: true, name: true, serviceRate: true, status: true },
      },
    },
  });

  return NextResponse.json({ data: templates });
}

/**
 * POST /api/admin/settings/task-workflow/templates
 * Creates a new task template.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const template = await prisma.taskTemplate.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      daysDue: parsed.data.daysDue ?? null,
    },
    include: {
      departmentRoutes: {
        include: {
          department: { select: { id: true, name: true } },
          subtasks: true,
        },
      },
      servicePlans: {
        select: { id: true, name: true, serviceRate: true, recurring: true, status: true },
      },
      serviceOneTimePlans: {
        select: { id: true, name: true, serviceRate: true, status: true },
      },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "TaskTemplate",
    entityId: String(template.id),
    description: `Created task template "${template.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: template }, { status: 201 });
}
