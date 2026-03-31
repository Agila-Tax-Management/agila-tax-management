// src/app/api/sales/service-plans/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateServicePlanSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const SERVICE_PLAN_INCLUDE = {
  governmentOffices: { select: { id: true, code: true, name: true } },
  cities: { select: { id: true, name: true, province: true } },
  inclusions: { select: { id: true, name: true, category: true } },
  taskTemplates: { include: { taskTemplate: { select: { id: true, name: true, description: true } } } },
  promos: {
    select: {
      id: true,
      name: true,
      code: true,
      discountType: true,
      discountRate: true,
      isActive: true,
    },
  },
} as const;

/**
 * GET /api/sales/service-plans/[id]
 * Returns a single service plan with all relations.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const planId = parseInt(id, 10);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const plan = await prisma.servicePlan.findUnique({
    where: { id: planId },
    include: SERVICE_PLAN_INCLUDE,
  });

  if (!plan) return NextResponse.json({ error: "Service plan not found" }, { status: 404 });

  return NextResponse.json({ data: plan });
}

/**
 * PATCH /api/sales/service-plans/[id]
 * Updates a service plan. Admin/Super-Admin only.
 * Many-to-many relations are replaced via `set` when IDs are provided.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const planId = parseInt(id, 10);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateServicePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const {
    governmentOfficeIds,
    cityIds,
    inclusionIds,
    taskTemplateIds,
    promoIds,
    ...rest
  } = parsed.data;

  const plan = await prisma.servicePlan.update({
    where: { id: planId },
    data: {
      ...rest,
      ...(taskTemplateIds !== undefined && {
        taskTemplates: {
          deleteMany: {},
          ...(taskTemplateIds.length > 0 && {
            create: taskTemplateIds.map((id) => ({ taskTemplateId: id })),
          }),
        },
      }),
      ...(governmentOfficeIds !== undefined && {
        governmentOffices: { set: governmentOfficeIds.map((id) => ({ id })) },
      }),
      ...(cityIds !== undefined && {
        cities: { set: cityIds.map((id) => ({ id })) },
      }),
      ...(inclusionIds !== undefined && {
        inclusions: { set: inclusionIds.map((id) => ({ id })) },
      }),
      ...(promoIds !== undefined && {
        promos: { set: promoIds.map((id) => ({ id })) },
      }),
    },
    include: SERVICE_PLAN_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "ServicePlan",
    entityId: String(plan.id),
    description: `Updated service plan: ${plan.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: plan });
}

/**
 * DELETE /api/sales/service-plans/[id]
 * Deletes a service plan. Admin/Super-Admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const planId = parseInt(id, 10);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.servicePlan.findUnique({ where: { id: planId } });
  if (!existing) return NextResponse.json({ error: "Service plan not found" }, { status: 404 });

  await prisma.servicePlan.delete({ where: { id: planId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "ServicePlan",
    entityId: String(planId),
    description: `Deleted service plan: ${existing.name}`,
    ...getRequestMeta(request),
  });

  return new NextResponse(null, { status: 204 });
}
