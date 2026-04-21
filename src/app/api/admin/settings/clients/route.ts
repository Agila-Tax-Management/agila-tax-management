// src/app/api/admin/settings/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { getAdminSettingsClients } from "@/lib/data/admin/clients-settings";
import { updateTag } from "next/cache";

const createSchema = z.object({
  companyCode: z.string().min(1, "Company code is required"),
  clientNo: z.string().optional(),
  businessName: z.string().min(1, "Business name is required"),
  portalName: z.string().optional(),
  businessEntity: z.enum([
    "INDIVIDUAL",
    "SOLE_PROPRIETORSHIP",
    "PARTNERSHIP",
    "CORPORATION",
    "COOPERATIVE",
  ]),
  branchType: z.enum(["MAIN", "BRANCH"]).optional(),
  timezone: z.string().optional(),
});

/**
 * GET /api/admin/settings/clients
 * Returns all clients with owner user and employee count.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getAdminSettingsClients();
  return NextResponse.json({ data });
}

/**
 * POST /api/admin/settings/clients
 * Creates a new client record.
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const existing = await prisma.client.findUnique({
    where: { companyCode: parsed.data.companyCode },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A client with this company code already exists" },
      { status: 409 }
    );
  }

  const client = await prisma.client.create({
    data: {
      companyCode: parsed.data.companyCode,
      clientNo: parsed.data.clientNo,
      businessName: parsed.data.businessName,
      portalName: parsed.data.portalName ?? parsed.data.businessName,
      businessEntity: parsed.data.businessEntity,
      branchType: parsed.data.branchType ?? "MAIN",
      timezone: parsed.data.timezone ?? "Asia/Manila",
      active: true,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Client",
    entityId: String(client.id),
    description: `Created client ${client.businessName} (${client.companyCode})`,
    ...getRequestMeta(request),
  });

  updateTag("admin-clients-settings-list");
  updateTag("hr-clients-list");

  return NextResponse.json(
    {
      data: {
        id: client.id,
        companyCode: client.companyCode,
        clientNo: client.clientNo,
        businessName: client.businessName,
        portalName: client.portalName,
        businessEntity: client.businessEntity,
        branchType: client.branchType,
        active: client.active,
        timezone: client.timezone,
        createdAt: client.createdAt?.toISOString() ?? null,
        owner: null,
        userCount: 0,
      },
    },
    { status: 201 }
  );
}
