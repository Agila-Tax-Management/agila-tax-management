// src/app/api/sales/leads/[id]/tsa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { logLeadHistory } from "@/lib/lead-history";

type Params = { params: Promise<{ id: string }> };

const createTsaSchema = z.object({
  quoteId: z.string().min(1, "An accepted quote is required"),
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

/**
 * POST /api/sales/leads/[id]/tsa
 * Creates a new TSA (DRAFT) for the given lead, linked to the accepted quote.
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, firstName: true, lastName: true, convertedClientId: true },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

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

  // Verify the quote belongs to this lead and is ACCEPTED
  const quote = await prisma.quote.findUnique({
    where: { id: parsed.data.quoteId },
    select: { id: true, leadId: true, status: true, tsaContract: { select: { id: true } } },
  });
  if (!quote || quote.leadId !== leadId) {
    return NextResponse.json({ error: "Quote not found for this lead" }, { status: 404 });
  }
  if (quote.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Only an ACCEPTED quote can be used to create a TSA" }, { status: 409 });
  }
  if (quote.tsaContract) {
    return NextResponse.json({ error: "A TSA already exists for this quote" }, { status: 409 });
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
          leadId,
          clientId: lead.convertedClientId ?? null,
          quoteId: parsed.data.quoteId,
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
      });
    });

    void logActivity({
      userId: session.user.id,
      action: "CREATED",
      entity: "TsaContract",
      entityId: tsa.id,
      description: `Created TSA ${tsa.referenceNumber} for lead #${leadId} — ${lead.firstName} ${lead.lastName}`,
      ...getRequestMeta(request),
    });

    void logLeadHistory({
      leadId,
      actorId: session.user.id,
      changeType: "TSA_GENERATED",
      newValue: `TSA ${tsa.referenceNumber} created`,
    });

    return NextResponse.json({ data: tsa }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sales/leads/[id]/tsa]", err);
    return NextResponse.json({ error: "Failed to create TSA. Please try again." }, { status: 500 });
  }
}
