// src/app/api/sales/quotes/[id]/tsa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

type Params = { params: Promise<{ id: string }> };

const createTsaSchema = z.object({
  documentDate: z.string().datetime({ offset: true }),
  businessName: z.string().min(1, "Business name is required"),
  authorizedRep: z.string().min(1, "Authorized representative is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  tin: z.string().optional().nullable(),
  civilStatus: z.string().optional().nullable(),
  businessAddress: z.string().optional().nullable(),
  residenceAddress: z.string().optional().nullable(),
  isBusinessRegistered: z.boolean().default(true),
  lockInMonths: z.number().int().positive().default(6),
  billingCycleStart: z.number().int().min(1).max(31).default(1),
});

const TSA_SELECT = {
  id: true,
  referenceNumber: true,
  status: true,
  documentDate: true,
  businessName: true,
  authorizedRep: true,
  email: true,
  phone: true,
  tin: true,
  civilStatus: true,
  businessAddress: true,
  residenceAddress: true,
  isBusinessRegistered: true,
  lockInMonths: true,
  billingCycleStart: true,
  pdfUrl: true,
  quoteId: true,
  clientId: true,
  preparedById: true,
  preparedAt: true,
  assignedApproverId: true,
  assignedApprover: { select: { id: true, name: true, email: true, image: true } },
  actualApproverId: true,
  actualApprover: { select: { id: true, name: true, email: true, image: true } },
  approvedAt: true,
  clientSignedAt: true,
  clientSignerName: true,
  preparedBy: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * POST /api/sales/quotes/[id]/tsa
 * Creates a new TSA (DRAFT) for an existing client's accepted quote.
 * Requires SALES portal role of ADMIN or SETTINGS (or SUPER_ADMIN/ADMIN system role).
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Permission gate: only ADMIN/SETTINGS-level sales portal users can create TSAs
  const salesRole = session.portalRoles?.SALES;
  const hasAccess =
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "ADMIN" ||
    salesRole === "ADMIN" ||
    salesRole === "SETTINGS";
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Only Sales Admins or Settings users can create TSA contracts." },
      { status: 403 },
    );
  }

  const { id: quoteId } = await params;

  // Fetch the quote — must be a client quote (not a lead quote) and ACCEPTED
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      status: true,
      leadId: true,
      clientId: true,
      client: { select: { id: true, businessName: true, clientNo: true } },
      tsaContract: { select: { id: true, status: true } },
    },
  });

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  if (quote.leadId !== null) {
    return NextResponse.json(
      { error: "This quote belongs to a lead. Use the Lead Center to create a TSA." },
      { status: 409 },
    );
  }

  if (!quote.clientId) {
    return NextResponse.json({ error: "Quote has no associated client" }, { status: 400 });
  }

  if (quote.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Only an ACCEPTED quote can be used to create a TSA" },
      { status: 409 },
    );
  }

  // Allow creating a new TSA only if there is no active (non-void) TSA for this quote
  if (quote.tsaContract && quote.tsaContract.status !== "VOID") {
    return NextResponse.json(
      { error: "An active TSA already exists for this quote" },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTsaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  try {
    const tsa = await prisma.$transaction(async (tx) => {
      // Generate reference number: TSA-YYYY-XXXX
      const year = new Date().getFullYear();
      const prefix = `TSA-${year}-`;
      const latest = await tx.tsaContract.findFirst({
        where: { referenceNumber: { startsWith: prefix } },
        orderBy: { referenceNumber: "desc" },
        select: { referenceNumber: true },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.referenceNumber.split("-");
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const referenceNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;

      return tx.tsaContract.create({
        data: {
          referenceNumber,
          clientId: quote.clientId,
          quoteId,
          status: "DRAFT",
          documentDate: new Date(parsed.data.documentDate),
          businessName: parsed.data.businessName,
          authorizedRep: parsed.data.authorizedRep,
          email: parsed.data.email ?? null,
          phone: parsed.data.phone ?? null,
          tin: parsed.data.tin ?? null,
          civilStatus: parsed.data.civilStatus ?? null,
          businessAddress: parsed.data.businessAddress ?? null,
          residenceAddress: parsed.data.residenceAddress ?? null,
          isBusinessRegistered: parsed.data.isBusinessRegistered,
          lockInMonths: parsed.data.lockInMonths,
          billingCycleStart: parsed.data.billingCycleStart,
          preparedById: session.user.id,
          preparedAt: new Date(),
        },
        select: TSA_SELECT,
      });
    });

    revalidateTag("sales-quotes", "max");
    revalidatePath("/portal/sales/quotations");

    void logActivity({
      userId: session.user.id,
      action: "CREATED",
      entity: "TsaContract",
      entityId: tsa.id,
      description: `Created TSA ${tsa.referenceNumber} for client quote ${quoteId} (${quote.client?.businessName ?? "Unknown"})`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: tsa }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sales/quotes/[id]/tsa]", err);
    return NextResponse.json({ error: "Failed to create TSA. Please try again." }, { status: 500 });
  }
}
