// src/app/api/admin/settings/task-workflow/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";
import { getTaskTemplates } from "@/lib/data/task-management/templates";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  daysDue: z.number().int().positive().optional(),
});

/**
 * GET /api/admin/settings/task-workflow/templates
 * Returns all task templates with their department routes and subtasks.
 * Data is cached for 1 hour via getTaskTemplates().
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await getTaskTemplates();
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

  const rawTemplate = await prisma.taskTemplate.create({
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
      services: {
        include: { service: { select: { id: true, name: true, serviceRate: true, billingType: true, frequency: true, status: true } } },
      },
    },
  });

  const { services, ...rest } = rawTemplate;
  const template = {
    ...rest,
    servicePlans: services.filter((l) => l.service.billingType === 'RECURRING').map((l) => l.service),
    serviceOneTimePlans: services.filter((l) => l.service.billingType === 'ONE_TIME').map((l) => l.service),
  };

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "TaskTemplate",
    entityId: String(template.id),
    description: `Created task template "${template.name}"`,
    ...getRequestMeta(request),
  });

  revalidateTag('task-templates', 'max');

  return NextResponse.json({ data: template }, { status: 201 });
}
