// src/app/api/sales/services/packages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateServicePackageSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const PACKAGE_INCLUDE = {
  items: {
    include: {
      service: {
        select: { id: true, code: true, name: true, billingType: true, serviceRate: true },
      },
    },
  },
} as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sales/services/packages/[id]
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pkgId = parseInt(id, 10);
  if (isNaN(pkgId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const pkg = await prisma.servicePackage.findUnique({
    where: { id: pkgId },
    include: PACKAGE_INCLUDE,
  });

  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  return NextResponse.json({ data: pkg });
}

/**
 * PATCH /api/sales/services/packages/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const pkgId = parseInt(id, 10);
  if (isNaN(pkgId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateServicePackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { items, ...rest } = parsed.data;

  const pkg = await prisma.servicePackage.update({
    where: { id: pkgId },
    data: {
      ...rest,
      ...(items !== undefined
        ? {
            items: {
              deleteMany: {},
              create: items.map(({ serviceId, quantity, overrideRate }) => ({
                service: { connect: { id: serviceId } },
                quantity,
                overrideRate: overrideRate ?? undefined,
              })),
            },
          }
        : {}),
    },
    include: PACKAGE_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "ServicePackage",
    entityId: String(pkg.id),
    description: `Updated service package: ${pkg.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: pkg });
}

/**
 * DELETE /api/sales/services/packages/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const pkgId = parseInt(id, 10);
  if (isNaN(pkgId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.servicePackage.findUnique({ where: { id: pkgId } });
  if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  await prisma.servicePackage.delete({ where: { id: pkgId } });

  void logActivity({
    userId: session.user.id,
    action: "DELETED",
    entity: "ServicePackage",
    entityId: String(pkgId),
    description: `Deleted service package: ${existing.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ success: true });
}
