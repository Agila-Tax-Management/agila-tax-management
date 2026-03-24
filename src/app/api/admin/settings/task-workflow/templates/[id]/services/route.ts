// src/app/api/admin/settings/task-workflow/templates/[id]/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const linkSchema = z.object({
  type: z.enum(["plan", "oneTime"]),
  serviceId: z.number().int().positive(),
});

/**
 * GET /api/admin/settings/task-workflow/templates/[id]/services
 * Returns all available service plans and one-time services, indicating
 * which ones are currently linked to this template.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const template = await prisma.taskTemplate.findUnique({ where: { id: templateId } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const [plans, oneTimePlans] = await Promise.all([
    prisma.servicePlan.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: {
        id: true,
        name: true,
        serviceRate: true,
        recurring: true,
        status: true,
        taskTemplateId: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.serviceOneTime.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: {
        id: true,
        name: true,
        serviceRate: true,
        status: true,
        taskTemplateId: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    data: {
      plans: plans.map((p) => ({ ...p, linkedToThisTemplate: p.taskTemplateId === templateId })),
      oneTimePlans: oneTimePlans.map((p) => ({
        ...p,
        linkedToThisTemplate: p.taskTemplateId === templateId,
      })),
    },
  });
}

/**
 * POST /api/admin/settings/task-workflow/templates/[id]/services
 * Links a service plan or one-time service to this template.
 * Body: { type: "plan"|"oneTime", serviceId: number }
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });

  const template = await prisma.taskTemplate.findUnique({ where: { id: templateId } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { type, serviceId } = parsed.data;

  if (type === "plan") {
    const plan = await prisma.servicePlan.findUnique({ where: { id: serviceId } });
    if (!plan) return NextResponse.json({ error: "Service plan not found" }, { status: 404 });

    await prisma.servicePlan.update({
      where: { id: serviceId },
      data: { taskTemplateId: templateId },
    });

    void logActivity({
      userId: session.user.id,
      action: "UPDATED",
      entity: "TaskTemplate",
      entityId: String(templateId),
      description: `Linked service plan "${plan.name}" to template "${template.name}"`,
      ...getRequestMeta(request),
    });
  } else {
    const oneTime = await prisma.serviceOneTime.findUnique({ where: { id: serviceId } });
    if (!oneTime) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    await prisma.serviceOneTime.update({
      where: { id: serviceId },
      data: { taskTemplateId: templateId },
    });

    void logActivity({
      userId: session.user.id,
      action: "UPDATED",
      entity: "TaskTemplate",
      entityId: String(templateId),
      description: `Linked one-time service "${oneTime.name}" to template "${template.name}"`,
      ...getRequestMeta(request),
    });
  }

  return NextResponse.json({ data: { success: true } });
}

/**
 * DELETE /api/admin/settings/task-workflow/templates/[id]/services
 * Unlinks a service plan or one-time service from this template.
 * Body: { type: "plan"|"oneTime", serviceId: number }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { type, serviceId } = parsed.data;

  if (type === "plan") {
    const plan = await prisma.servicePlan.findUnique({ where: { id: serviceId } });
    if (!plan) return NextResponse.json({ error: "Service plan not found" }, { status: 404 });
    if (plan.taskTemplateId !== templateId) {
      return NextResponse.json({ error: "This service is not linked to this template" }, { status: 400 });
    }

    await prisma.servicePlan.update({
      where: { id: serviceId },
      data: { taskTemplateId: null },
    });

    void logActivity({
      userId: session.user.id,
      action: "UPDATED",
      entity: "TaskTemplate",
      entityId: String(templateId),
      description: `Unlinked service plan "${plan.name}" from template`,
      ...getRequestMeta(request),
    });
  } else {
    const oneTime = await prisma.serviceOneTime.findUnique({ where: { id: serviceId } });
    if (!oneTime) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    if (oneTime.taskTemplateId !== templateId) {
      return NextResponse.json({ error: "This service is not linked to this template" }, { status: 400 });
    }

    await prisma.serviceOneTime.update({
      where: { id: serviceId },
      data: { taskTemplateId: null },
    });

    void logActivity({
      userId: session.user.id,
      action: "UPDATED",
      entity: "TaskTemplate",
      entityId: String(templateId),
      description: `Unlinked one-time service "${oneTime.name}" from template`,
      ...getRequestMeta(request),
    });
  }

  return NextResponse.json({ data: { success: true } });
}
