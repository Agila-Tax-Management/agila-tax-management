// src/app/api/sales/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { createLeadSchema } from "@/lib/schemas/sales";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { logLeadHistory } from "@/lib/lead-history";

const LEAD_INCLUDE = {
  status: { select: { id: true, name: true, color: true, sequence: true, isOnboarding: true, isConverted: true } },
  assignedAgent: { select: { id: true, name: true, email: true } },
  promo: { select: { id: true, name: true, code: true, discountType: true, discountRate: true } },
  quotes: {
    orderBy: { createdAt: "desc" as const },
    include: {
      lineItems: {
        include: {
          service: { select: { id: true, name: true, billingType: true, frequency: true } },
          sourcePackage: { select: { id: true, name: true } },
        },
      },
    },
  },
  tsaContracts: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      documentDate: true,
      businessName: true,
      quoteId: true,
      pdfUrl: true,
      clientSignedAt: true,
    },
  },
  invoices: {
    select: { id: true, invoiceNumber: true, status: true },
    orderBy: { issueDate: "asc" as const },
  },
  jobOrders: {
    select: { id: true, jobOrderNumber: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
} as const;

/**
 * GET /api/sales/leads
 * Returns all leads. Optionally filtered by ?statusId=
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusIdParam = searchParams.get("statusId");
  const statusId = statusIdParam ? parseInt(statusIdParam, 10) : undefined;

  const leads = await prisma.lead.findMany({
    where: statusId && !isNaN(statusId) ? { statusId } : undefined,
    orderBy: { createdAt: "desc" },
    include: LEAD_INCLUDE,
  });

  return NextResponse.json({ data: leads });
}

/**
 * POST /api/sales/leads
 * Creates a new lead. Assigns the default status if statusId not provided.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  // If no statusId provided, use the default status
  let statusId = parsed.data.statusId;
  if (!statusId) {
    const defaultStatus = await prisma.leadStatus.findFirst({ where: { isDefault: true } });
    if (!defaultStatus) {
      const firstStatus = await prisma.leadStatus.findFirst({ orderBy: { sequence: "asc" } });
      if (!firstStatus) {
        return NextResponse.json({ error: "No lead statuses configured. Please set up the pipeline first." }, { status: 422 });
      }
      statusId = firstStatus.id;
    } else {
      statusId = defaultStatus.id;
    }
  }

  const { promoId, ...leadData } = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      ...leadData,
      statusId,
      ...(promoId ? { promoId } : {}),
    },
    include: LEAD_INCLUDE,
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Lead",
    entityId: String(lead.id),
    description: `Created lead ${lead.firstName} ${lead.lastName}`,
    ...getRequestMeta(request),
  });

  void logLeadHistory({
    leadId: lead.id,
    actorId: session.user.id,
    changeType: "CREATED",
    newValue: `${lead.firstName} ${lead.lastName}`,
  });

  return NextResponse.json({ data: lead }, { status: 201 });
}
