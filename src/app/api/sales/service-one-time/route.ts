// src/app/api/sales/service-one-time/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createServiceOneTimeSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const SERVICE_ONE_TIME_INCLUDE = {
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
 * GET /api/sales/service-one-time
 * Returns all one-time services (excludes archived unless queried).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("archived") === "true";

  const services = await prisma.serviceOneTime.findMany({
    where: includeArchived ? undefined : { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: SERVICE_ONE_TIME_INCLUDE,
  });

  return NextResponse.json({ data: services });
}

/**
 * POST /api/sales/service-one-time
 * Creates a new one-time service. Admin/Super-Admin only.
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

  const parsed = createServiceOneTimeSchema.safeParse(body);
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

  const service = await prisma.serviceOneTime.create({
    data: {
      ...rest,
      taskTemplates:
        taskTemplateIds.length > 0
          ? { create: taskTemplateIds.map((id) => ({ taskTemplateId: id })) }
          : undefined,
      governmentOffices:
        governmentOfficeIds.length > 0
          ? { connect: governmentOfficeIds.map((id) => ({ id })) }
          : undefined,
      cities:
        cityIds.length > 0
          ? { connect: cityIds.map((id) => ({ id })) }
          : undefined,
      inclusions:
        inclusionIds.length > 0
          ? { connect: inclusionIds.map((id) => ({ id })) }
          : undefined,
      promos:
        promoIds.length > 0
          ? { connect: promoIds.map((id) => ({ id })) }
          : undefined,
    },
    include: SERVICE_ONE_TIME_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "ServiceOneTime",
    entityId: String(service.id),
    description: `Created one-time service: ${service.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: service }, { status: 201 });
}
