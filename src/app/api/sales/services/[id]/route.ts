// src/app/api/sales/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateServiceSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";

const SERVICE_INCLUDE = {
  governmentOffices: {
    select: { id: true, code: true, name: true },
  },
  cities: {
    select: { id: true, name: true, province: true },
  },
  inclusions: {
    select: { id: true, name: true, category: true },
  },
  taskTemplates: {
    select: { taskTemplate: { select: { id: true, name: true } } },
  },
  promos: {
    select: { id: true, name: true },
  },
} as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sales/services/[id]
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const serviceId = parseInt(id, 10);
  if (isNaN(serviceId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: SERVICE_INCLUDE,
  });

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  return NextResponse.json({ data: service });
}

/**
 * PATCH /api/sales/services/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const serviceId = parseInt(id, 10);
  if (isNaN(serviceId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateServiceSchema.safeParse(body);
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

  // If updating billingType to ONE_TIME, force frequency to NONE
  const frequency =
    rest.billingType === "ONE_TIME" ? "NONE" : rest.frequency;

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...rest,
      ...(frequency !== undefined ? { frequency } : {}),
      ...(governmentOfficeIds !== undefined
        ? { governmentOffices: { set: governmentOfficeIds.map((id) => ({ id })) } }
        : {}),
      ...(cityIds !== undefined
        ? { cities: { set: cityIds.map((id) => ({ id })) } }
        : {}),
      ...(inclusionIds !== undefined
        ? { inclusions: { set: inclusionIds.map((id) => ({ id })) } }
        : {}),
      ...(taskTemplateIds !== undefined
        ? {
            taskTemplates: {
              deleteMany: {},
              create: taskTemplateIds.map((taskTemplateId) => ({
                taskTemplate: { connect: { id: taskTemplateId } },
              })),
            },
          }
        : {}),
      ...(promoIds !== undefined
        ? { promos: { set: promoIds.map((id) => ({ id })) } }
        : {}),
    },
    include: SERVICE_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Service",
    entityId: String(service.id),
    description: `Updated service: ${service.name}`,
    ...getRequestMeta(request),
  });

  revalidateTag("sales-services", "max");

  return NextResponse.json({ data: service });
}

/**
 * DELETE /api/sales/services/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const serviceId = parseInt(id, 10);
  if (isNaN(serviceId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  await prisma.service.delete({ where: { id: serviceId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "Service",
    entityId: String(serviceId),
    description: `Deleted service: ${existing.name}`,
    ...getRequestMeta(request),
  });

  revalidateTag("sales-services", "max");

  return NextResponse.json({ success: true });
}
