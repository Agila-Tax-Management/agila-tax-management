// src/app/api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/subtasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string; routeId: string }>;
}

const createSubtaskSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  daysDue: z.number().int().positive().optional(),
});

/**
 * GET /api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/subtasks
 * Returns all subtasks for a specific route step, ordered by subtaskOrder.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, routeId } = await params;
  const templateId = parseInt(id, 10);
  const routeIdInt = parseInt(routeId, 10);
  if (isNaN(templateId) || isNaN(routeIdInt)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const route = await prisma.taskTemplateRoute.findUnique({ where: { id: routeIdInt } });
  if (!route || route.templateId !== templateId) {
    return NextResponse.json({ error: "Route step not found" }, { status: 404 });
  }

  const subtasks = await prisma.taskTemplateSubtask.findMany({
    where: { routeId: routeIdInt },
    orderBy: { subtaskOrder: "asc" },
  });

  return NextResponse.json({ data: subtasks });
}

/**
 * POST /api/admin/settings/task-workflow/templates/[id]/routes/[routeId]/subtasks
 * Creates a new subtask for a route step (appended at the end).
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, routeId } = await params;
  const templateId = parseInt(id, 10);
  const routeIdInt = parseInt(routeId, 10);
  if (isNaN(templateId) || isNaN(routeIdInt)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const route = await prisma.taskTemplateRoute.findUnique({
    where: { id: routeIdInt },
    include: { template: true },
  });
  if (!route || route.templateId !== templateId) {
    return NextResponse.json({ error: "Route step not found" }, { status: 404 });
  }

  // Append at the end
  const maxOrder = await prisma.taskTemplateSubtask.aggregate({
    where: { routeId: routeIdInt },
    _max: { subtaskOrder: true },
  });
  const nextOrder = (maxOrder._max.subtaskOrder ?? 0) + 1;

  const subtask = await prisma.taskTemplateSubtask.create({
    data: {
      routeId: routeIdInt,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority ?? "NORMAL",
      daysDue: parsed.data.daysDue ?? null,
      subtaskOrder: nextOrder,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "TaskTemplate",
    entityId: String(templateId),
    description: `Added subtask "${subtask.name}" to route step #${routeIdInt} of template "${route.template.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: subtask }, { status: 201 });
}
