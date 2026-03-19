// src/app/api/sales/service-one-time/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateServiceOneTimeSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const SERVICE_ONE_TIME_INCLUDE = {
  governmentOffices: { select: { id: true, code: true, name: true } },
  cities: { select: { id: true, name: true, province: true } },
  inclusions: { select: { id: true, name: true, category: true } },
  taskTemplate: { select: { id: true, name: true } },
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
 * GET /api/sales/service-one-time/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const svcId = parseInt(id, 10);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const service = await prisma.serviceOneTime.findUnique({
    where: { id: svcId },
    include: SERVICE_ONE_TIME_INCLUDE,
  });

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  return NextResponse.json({ data: service });
}

/**
 * PATCH /api/sales/service-one-time/[id]
 * Admin/Super-Admin only.
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
  const svcId = parseInt(id, 10);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateServiceOneTimeSchema.safeParse(body);
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
    taskTemplateId,
    promoIds,
    ...rest
  } = parsed.data;

  const service = await prisma.serviceOneTime.update({
    where: { id: svcId },
    data: {
      ...rest,
      taskTemplateId:
        taskTemplateId === null ? null : taskTemplateId ?? undefined,
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
    include: SERVICE_ONE_TIME_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "ServiceOneTime",
    entityId: String(service.id),
    description: `Updated one-time service: ${service.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: service });
}

/**
 * DELETE /api/sales/service-one-time/[id]
 * Admin/Super-Admin only.
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
  const svcId = parseInt(id, 10);
  if (isNaN(svcId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.serviceOneTime.findUnique({ where: { id: svcId } });
  if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  await prisma.serviceOneTime.delete({ where: { id: svcId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "ServiceOneTime",
    entityId: String(svcId),
    description: `Deleted one-time service: ${existing.name}`,
    ...getRequestMeta(request),
  });

  return new NextResponse(null, { status: 204 });
}
