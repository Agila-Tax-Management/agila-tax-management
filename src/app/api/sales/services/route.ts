// src/app/api/sales/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createServiceSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { getSalesServices } from "@/lib/data/sales/services";
import { revalidateTag } from "next/cache";

/**
 * GET /api/sales/services
 * Query params:
 *   billingType=RECURRING|ONE_TIME (optional, omit for all)
 *   status=ACTIVE|INACTIVE|ARCHIVED (optional, defaults to non-archived)
 *   archived=true (optional, include archived)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const billingType = searchParams.get("billingType") as "RECURRING" | "ONE_TIME" | null;
  const archived = searchParams.get("archived") === "true";

  const services = await getSalesServices(billingType, archived);

  return NextResponse.json({ data: services });
}

/**
 * POST /api/sales/services
 * Creates a new unified service.
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

  const parsed = createServiceSchema.safeParse(body);
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

  // ONE_TIME services always use NONE frequency
  const frequency = rest.billingType === "ONE_TIME" ? "NONE" : rest.frequency;

  const service = await prisma.service.create({
    data: {
      ...rest,
      frequency,
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
      taskTemplates:
        taskTemplateIds.length > 0
          ? {
              create: taskTemplateIds.map((taskTemplateId) => ({
                taskTemplate: { connect: { id: taskTemplateId } },
              })),
            }
          : undefined,
      promos:
        promoIds.length > 0
          ? { connect: promoIds.map((id) => ({ id })) }
          : undefined,
    },
    include: {
      governmentOffices: { select: { id: true, code: true, name: true } },
      cities: { select: { id: true, name: true, province: true } },
      inclusions: { select: { id: true, name: true, category: true } },
      taskTemplates: { select: { taskTemplate: { select: { id: true, name: true } } } },
      promos: { select: { id: true, name: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Service",
    entityId: String(service.id),
    description: `Created service: ${service.name} (${service.billingType})`,
    ...getRequestMeta(request),
  });

  revalidateTag("sales-services", "max");

  return NextResponse.json({ data: service }, { status: 201 });
}
