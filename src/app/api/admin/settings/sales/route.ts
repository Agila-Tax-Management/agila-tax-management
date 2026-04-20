// src/app/api/admin/settings/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

const updateSettingsSchema = z.object({
  defaultJoOperationsApproverId: z.string().nullable(),
  defaultJoAccountApproverId: z.string().nullable(),
  defaultJoGeneralApproverId: z.string().nullable(),
  defaultTsaApproverId: z.string().nullable(),
});

/**
 * GET /api/admin/settings/sales
 * Retrieves sales portal settings (Job Order & TSA approvers).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the main ATMS internal firm client by its fixed company code
  const firmClient = await prisma.client.findUnique({
    where: { companyCode: "ATMS-001" },
    select: { id: true },
  });

  if (!firmClient) {
    return NextResponse.json({ error: "Firm client not found" }, { status: 404 });
  }

  // Get or create settings
  let settings = await prisma.salesSetting.findUnique({
    where: { clientId: firmClient.id },
    include: {
      defaultJoOperationsApprover: { select: { id: true, name: true, email: true } },
      defaultJoAccountApprover: { select: { id: true, name: true, email: true } },
      defaultJoGeneralApprover: { select: { id: true, name: true, email: true } },
      defaultTsaApprover: { select: { id: true, name: true, email: true } },
    },
  });

  if (!settings) {
    // Auto-create empty settings
    settings = await prisma.salesSetting.create({
      data: { clientId: firmClient.id },
      include: {
        defaultJoOperationsApprover: { select: { id: true, name: true, email: true } },
        defaultJoAccountApprover: { select: { id: true, name: true, email: true } },
        defaultJoGeneralApprover: { select: { id: true, name: true, email: true } },
        defaultTsaApprover: { select: { id: true, name: true, email: true } },
      },
    });
  }

  return NextResponse.json({ data: settings });
}

/**
 * PATCH /api/admin/settings/sales
 * Updates default approvers for Job Orders and TSA contracts.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const {
    defaultJoOperationsApproverId,
    defaultJoAccountApproverId,
    defaultJoGeneralApproverId,
    defaultTsaApproverId,
  } = parsed.data;

  // Validate all user IDs exist and are active
  const userIds = [
    defaultJoOperationsApproverId,
    defaultJoAccountApproverId,
    defaultJoGeneralApproverId,
    defaultTsaApproverId,
  ].filter((id): id is string => id !== null);

  if (userIds.length > 0) {
    // Deduplicate user IDs (same user can be assigned to multiple roles)
    const uniqueUserIds = Array.from(new Set(userIds));

    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds }, active: true },
      select: { id: true },
    });

    if (users.length !== uniqueUserIds.length) {
      return NextResponse.json(
        { error: "One or more selected users are invalid or inactive" },
        { status: 400 },
      );
    }
  }

  // Find the main ATMS internal firm client by its fixed company code
  const firmClient = await prisma.client.findUnique({
    where: { companyCode: "ATMS-001" },
    select: { id: true },
  });

  if (!firmClient) {
    return NextResponse.json({ error: "Firm client not found" }, { status: 404 });
  }

  // Upsert settings
  const settings = await prisma.salesSetting.upsert({
    where: { clientId: firmClient.id },
    create: {
      clientId: firmClient.id,
      defaultJoOperationsApproverId,
      defaultJoAccountApproverId,
      defaultJoGeneralApproverId,
      defaultTsaApproverId,
    },
    update: {
      defaultJoOperationsApproverId,
      defaultJoAccountApproverId,
      defaultJoGeneralApproverId,
      defaultTsaApproverId,
    },
    include: {
      defaultJoOperationsApprover: { select: { id: true, name: true, email: true } },
      defaultJoAccountApprover: { select: { id: true, name: true, email: true } },
      defaultJoGeneralApprover: { select: { id: true, name: true, email: true } },
      defaultTsaApprover: { select: { id: true, name: true, email: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "SalesSetting",
    entityId: settings.id,
    description: "Updated sales portal default approvers",
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: settings });
}
