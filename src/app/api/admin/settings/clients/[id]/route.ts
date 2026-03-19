// src/app/api/admin/settings/clients/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  companyCode: z.string().min(1, "Company code is required"),
  clientNo: z.string().optional(),
  businessName: z.string().min(1, "Business name is required"),
  portalName: z.string().optional(),
  businessType: z.enum([
    "INDIVIDUAL",
    "SOLE_PROPRIETORSHIP",
    "PARTNERSHIP",
    "CORPORATION",
    "COOPERATIVE",
  ]),
  branchType: z.string().optional(),
  timezone: z.string().optional(),
});

const patchSchema = z.object({
  active: z.boolean(),
});

/**
 * GET /api/admin/settings/clients/[id]
 * Returns a single client with all assigned users and their portal roles.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      companyCode: true,
      clientNo: true,
      businessName: true,
      portalName: true,
      businessType: true,
      branchType: true,
      active: true,
      timezone: true,
      createdAt: true,
      userAssignments: {
        orderBy: { createdAt: "asc" },
        include: {
          clientUser: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              active: true,
              createdAt: true,
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  employments: {
                    where: { clientId, employmentStatus: "ACTIVE" },
                    select: {
                      id: true,
                      employmentType: true,
                      department: { select: { id: true, name: true } },
                      position: { select: { id: true, title: true } },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: client.id,
      companyCode: client.companyCode,
      clientNo: client.clientNo,
      businessName: client.businessName,
      portalName: client.portalName,
      businessType: client.businessType,
      branchType: client.branchType,
      active: client.active,
      timezone: client.timezone,
      createdAt: client.createdAt?.toISOString() ?? null,
      users: client.userAssignments.map((a) => ({
        id: a.clientUser.id,
        name: a.clientUser.name,
        email: a.clientUser.email,
        status: a.clientUser.status,
        active: a.clientUser.active,
        role: a.role,
        createdAt: a.clientUser.createdAt.toISOString(),
        employee: a.clientUser.employee
          ? {
              id: a.clientUser.employee.id,
              firstName: a.clientUser.employee.firstName,
              lastName: a.clientUser.employee.lastName,
              employment: a.clientUser.employee.employments[0] ?? null,
            }
          : null,
      })),
    },
  });
}

/**
 * PUT /api/admin/settings/clients/[id]
 * Full update of client record fields.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const existing = await prisma.client.findUnique({ where: { id: clientId } });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  // Check company code uniqueness (excluding current)
  if (parsed.data.companyCode !== existing.companyCode) {
    const taken = await prisma.client.findUnique({
      where: { companyCode: parsed.data.companyCode },
    });
    if (taken) {
      return NextResponse.json(
        { error: "A client with this company code already exists" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      companyCode: parsed.data.companyCode,
      clientNo: parsed.data.clientNo,
      businessName: parsed.data.businessName,
      portalName: parsed.data.portalName ?? parsed.data.businessName,
      businessType: parsed.data.businessType,
      branchType: parsed.data.branchType,
      timezone: parsed.data.timezone,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Client",
    entityId: String(clientId),
    description: `Updated client ${updated.businessName} (${updated.companyCode})`,
    metadata: {
      before: { businessName: existing.businessName, companyCode: existing.companyCode },
      after: { businessName: updated.businessName, companyCode: updated.companyCode },
    },
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: updated.id, businessName: updated.businessName } });
}

/**
 * PATCH /api/admin/settings/clients/[id]
 * Toggle active status.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const existing = await prisma.client.findUnique({ where: { id: clientId } });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: { active: parsed.data.active },
  });

  void logActivity({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entity: "Client",
    entityId: String(clientId),
    description: `${parsed.data.active ? "Activated" : "Deactivated"} client ${existing.businessName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: updated.id, active: updated.active } });
}
