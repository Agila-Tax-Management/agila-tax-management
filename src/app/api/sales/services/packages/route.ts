// src/app/api/sales/services/packages/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createServicePackageSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { getSalesServicePackages } from "@/lib/data/sales/services";
import { revalidateTag } from "next/cache";

/**
 * GET /api/sales/services/packages
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packages = await getSalesServicePackages();

  return NextResponse.json({ data: packages });
}

/**
 * POST /api/sales/services/packages
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

  const parsed = createServicePackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { items, ...rest } = parsed.data;

  const pkg = await prisma.servicePackage.create({
    data: {
      ...rest,
      items:
        items.length > 0
          ? {
              create: items.map(({ serviceId, quantity, overrideRate }) => ({
                service: { connect: { id: serviceId } },
                quantity,
                overrideRate: overrideRate ?? undefined,
              })),
            }
          : undefined,
    },
    include: {
      items: {
        include: {
          service: {
            select: { id: true, code: true, name: true, billingType: true, serviceRate: true },
          },
        },
      },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "ServicePackage",
    entityId: String(pkg.id),
    description: `Created service package: ${pkg.name}`,
    ...getRequestMeta(request),
  });

  revalidateTag("sales-service-packages", "max");
  revalidateTag("sales-packages", "max");

  return NextResponse.json({ data: pkg }, { status: 201 });
}
