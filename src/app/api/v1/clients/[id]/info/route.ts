// src/app/api/v1/clients/[id]/info/route.ts
//
// GET  /api/v1/clients/{id}/info  — Returns full editable client profile
// PATCH /api/v1/clients/{id}/info — Updates allowed fields (OWNER/ADMIN only)
//
// Editable sections (sent as nested objects):
//   core              — portalName, logoUrl, timezone, dayResetTime, workingDayStarts
//   birInfo           — tin, branchCode, rdoCode, registeredAddress, contactNumber
//   individualDetails — all personal fields (INDIVIDUAL & SOLE_PROPRIETORSHIP only)
//   businessDetails   — trade name, industry, line of business, contact, lease info
//
// NOT editable from portal:
//   businessEntity, companyCode, clientNo, active, branchType, secRegistrationNo
//
// Auth: Bearer <ATMS_API_KEY> + X-Client-User-Id header

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { verifyClientAccess, canWrite } from "@/lib/verify-client-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  // ─── Core client fields ───────────────────────────────────────────────────
  core: z
    .object({
      portalName: z.string().min(1).max(100),
      logoUrl: z.string().url().nullable(),
      dayResetTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
      workingDayStarts: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
      timezone: z.string().min(1),
    })
    .partial()
    .optional(),

  // ─── BIR info (safe fields only, all nullable) ────────────────────────────
  birInfo: z
    .object({
      tin: z.string().nullable(),
      branchCode: z.string().nullable(),
      rdoCode: z.string().nullable(),
      registeredAddress: z.string().nullable(),
      contactNumber: z.string().nullable(),
    })
    .partial()
    .optional(),

  // ─── Individual / owner details (INDIVIDUAL & SOLE_PROPRIETORSHIP only) ──
  individualDetails: z
    .object({
      firstName: z.string().min(1),
      middleName: z.string().nullable(),
      lastName: z.string().min(1),
      dob: z.string().min(1),
      civilStatus: z.string().min(1),
      gender: z.string().min(1),
      citizenship: z.string().min(1),
      placeOfBirth: z.string().nullable(),
      residentialAddress: z.string().nullable(),
      prcLicenseNo: z.string().nullable(),
      primaryIdType: z.string().nullable(),
      primaryIdNumber: z.string().nullable(),
      personalEmail: z.string().email().nullable(),
      mobileNumber: z.string().nullable(),
      telephoneNumber: z.string().nullable(),
      motherFirstName: z.string().nullable(),
      motherMiddleName: z.string().nullable(),
      motherLastName: z.string().nullable(),
      fatherFirstName: z.string().nullable(),
      fatherMiddleName: z.string().nullable(),
      fatherLastName: z.string().nullable(),
      spouseFirstName: z.string().nullable(),
      spouseMiddleName: z.string().nullable(),
      spouseLastName: z.string().nullable(),
      spouseEmploymentStatus: z.string().nullable(),
      spouseTin: z.string().nullable(),
      spouseEmployerName: z.string().nullable(),
      spouseEmployerTin: z.string().nullable(),
    })
    .partial()
    .optional(),

  // ─── Business operations ──────────────────────────────────────────────────
  businessDetails: z
    .object({
      tradeName: z.string().nullable(),
      industry: z.string().nullable(),
      lineOfBusiness: z.string().nullable(),
      psicCode: z.string().nullable(),
      landlineNumber: z.string().nullable(),
      faxNumber: z.string().nullable(),
      placeType: z.enum(["OWNED", "RENTED", "FREE_USE"]).optional(),
      lessorName: z.string().nullable(),
      lessorAddress: z.string().nullable(),
      monthlyRent: z.string().nullable(),
      rentContractUrl: z.string().nullable(),
      isNotarized: z.boolean().optional(),
      hasDocStamp: z.boolean().optional(),
      propertyOwner: z.string().nullable(),
      ownedDocsUrl: z.string().nullable(),
      ownedReason: z.string().nullable(),
      noRentReason: z.string().nullable(),
    })
    .partial()
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID." }, { status: 400 });

  const access = await verifyClientAccess(request, clientId);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      companyCode: true,
      clientNo: true,
      portalName: true,
      businessName: true,
      logoUrl: true,
      businessEntity: true,
      branchType: true,
      active: true,
      dayResetTime: true,
      workingDayStarts: true,
      timezone: true,
      birInfo: {
        select: {
          tin: true,
          branchCode: true,
          rdoCode: true,
          registeredAddress: true,
          zipCode: true,
          contactNumber: true,
          isWithholdingAgent: true,
        },
      },
      businessDetails: {
        select: {
          tradeName: true,
          industry: true,
          lineOfBusiness: true,
          psicCode: true,
          landlineNumber: true,
          faxNumber: true,
          placeType: true,
          lessorName: true,
          lessorAddress: true,
          monthlyRent: true,
          rentContractUrl: true,
          isNotarized: true,
          hasDocStamp: true,
          propertyOwner: true,
          ownedDocsUrl: true,
          ownedReason: true,
          noRentReason: true,
        },
      },
      corporateDetails: {
        select: {
          primaryEmail: true,
          primaryContactNo: true,
          secondaryEmail: true,
          secondaryContactNo: true,
          contactPerson: true,
          suffix: true,
          acronym: true,
        },
      },
      individualDetails: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          dob: true,
          civilStatus: true,
          gender: true,
          citizenship: true,
          placeOfBirth: true,
          residentialAddress: true,
          prcLicenseNo: true,
          primaryIdType: true,
          primaryIdNumber: true,
          personalEmail: true,
          mobileNumber: true,
          telephoneNumber: true,
          motherFirstName: true,
          motherMiddleName: true,
          motherLastName: true,
          fatherFirstName: true,
          fatherMiddleName: true,
          fatherLastName: true,
          spouseFirstName: true,
          spouseMiddleName: true,
          spouseLastName: true,
          spouseEmploymentStatus: true,
          spouseTin: true,
          spouseEmployerName: true,
          spouseEmployerTin: true,
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  return NextResponse.json({
    data: {
      ...client,
      businessDetails: client.businessDetails
        ? {
            ...client.businessDetails,
            monthlyRent: client.businessDetails.monthlyRent
              ? Number(client.businessDetails.monthlyRent)
              : null,
          }
        : null,
      role: access.role,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID." }, { status: 400 });

  const access = await verifyClientAccess(request, clientId);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Forbidden. OWNER or ADMIN role required." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error." },
      { status: 422 }
    );
  }

  const { core, birInfo, individualDetails, businessDetails } = parsed.data;

  await prisma.$transaction(async (tx) => {
    // ── Core client fields ──────────────────────────────────────────────────
    if (core && Object.keys(core).length > 0) {
      await tx.client.update({ where: { id: clientId }, data: core });
    }

    // ── BIR info — upsert (record may not exist yet) ────────────────────────
    if (birInfo && Object.keys(birInfo).length > 0) {
      await tx.birInformation.upsert({
        where: { clientId },
        create: {
          clientId,
          tin: birInfo.tin ?? "",
          branchCode: birInfo.branchCode ?? "0000",
          rdoCode: birInfo.rdoCode ?? "",
          registeredAddress: birInfo.registeredAddress ?? "",
          zipCode: "",
          ...(birInfo.contactNumber !== undefined
            ? { contactNumber: birInfo.contactNumber ?? undefined }
            : {}),
        },
        update: {
          ...(birInfo.tin !== undefined ? { tin: birInfo.tin ?? "" } : {}),
          ...(birInfo.branchCode !== undefined
            ? { branchCode: birInfo.branchCode ?? "0000" }
            : {}),
          ...(birInfo.rdoCode !== undefined ? { rdoCode: birInfo.rdoCode ?? "" } : {}),
          ...(birInfo.registeredAddress !== undefined
            ? { registeredAddress: birInfo.registeredAddress ?? "" }
            : {}),
          ...(birInfo.contactNumber !== undefined
            ? { contactNumber: birInfo.contactNumber ?? undefined }
            : {}),
        },
      });
    }

    // ── Individual details — upsert ─────────────────────────────────────────
    if (individualDetails && Object.keys(individualDetails).length > 0) {
      const ind = individualDetails;
      await tx.individualDetails.upsert({
        where: { clientId },
        create: {
          clientId,
          firstName: ind.firstName ?? "",
          lastName: ind.lastName ?? "",
          dob: ind.dob ? new Date(ind.dob) : new Date(),
          civilStatus: ind.civilStatus ?? "",
          gender: ind.gender ?? "",
          citizenship: ind.citizenship ?? "Filipino",
          middleName: ind.middleName ?? undefined,
          placeOfBirth: ind.placeOfBirth ?? undefined,
          residentialAddress: ind.residentialAddress ?? undefined,
          prcLicenseNo: ind.prcLicenseNo ?? undefined,
          primaryIdType: ind.primaryIdType ?? undefined,
          primaryIdNumber: ind.primaryIdNumber ?? undefined,
          personalEmail: ind.personalEmail ?? undefined,
          mobileNumber: ind.mobileNumber ?? undefined,
          telephoneNumber: ind.telephoneNumber ?? undefined,
          motherFirstName: ind.motherFirstName ?? undefined,
          motherMiddleName: ind.motherMiddleName ?? undefined,
          motherLastName: ind.motherLastName ?? undefined,
          fatherFirstName: ind.fatherFirstName ?? undefined,
          fatherMiddleName: ind.fatherMiddleName ?? undefined,
          fatherLastName: ind.fatherLastName ?? undefined,
          spouseFirstName: ind.spouseFirstName ?? undefined,
          spouseMiddleName: ind.spouseMiddleName ?? undefined,
          spouseLastName: ind.spouseLastName ?? undefined,
          spouseEmploymentStatus: ind.spouseEmploymentStatus ?? undefined,
          spouseTin: ind.spouseTin ?? undefined,
          spouseEmployerName: ind.spouseEmployerName ?? undefined,
          spouseEmployerTin: ind.spouseEmployerTin ?? undefined,
        },
        update: {
          ...(ind.firstName !== undefined ? { firstName: ind.firstName } : {}),
          ...(ind.middleName !== undefined ? { middleName: ind.middleName } : {}),
          ...(ind.lastName !== undefined ? { lastName: ind.lastName } : {}),
          ...(ind.dob !== undefined ? { dob: new Date(ind.dob) } : {}),
          ...(ind.civilStatus !== undefined ? { civilStatus: ind.civilStatus } : {}),
          ...(ind.gender !== undefined ? { gender: ind.gender } : {}),
          ...(ind.citizenship !== undefined ? { citizenship: ind.citizenship } : {}),
          ...(ind.placeOfBirth !== undefined ? { placeOfBirth: ind.placeOfBirth } : {}),
          ...(ind.residentialAddress !== undefined ? { residentialAddress: ind.residentialAddress } : {}),
          ...(ind.prcLicenseNo !== undefined ? { prcLicenseNo: ind.prcLicenseNo } : {}),
          ...(ind.primaryIdType !== undefined ? { primaryIdType: ind.primaryIdType } : {}),
          ...(ind.primaryIdNumber !== undefined ? { primaryIdNumber: ind.primaryIdNumber } : {}),
          ...(ind.personalEmail !== undefined ? { personalEmail: ind.personalEmail } : {}),
          ...(ind.mobileNumber !== undefined ? { mobileNumber: ind.mobileNumber } : {}),
          ...(ind.telephoneNumber !== undefined ? { telephoneNumber: ind.telephoneNumber } : {}),
          ...(ind.motherFirstName !== undefined ? { motherFirstName: ind.motherFirstName } : {}),
          ...(ind.motherMiddleName !== undefined ? { motherMiddleName: ind.motherMiddleName } : {}),
          ...(ind.motherLastName !== undefined ? { motherLastName: ind.motherLastName } : {}),
          ...(ind.fatherFirstName !== undefined ? { fatherFirstName: ind.fatherFirstName } : {}),
          ...(ind.fatherMiddleName !== undefined ? { fatherMiddleName: ind.fatherMiddleName } : {}),
          ...(ind.fatherLastName !== undefined ? { fatherLastName: ind.fatherLastName } : {}),
          ...(ind.spouseFirstName !== undefined ? { spouseFirstName: ind.spouseFirstName } : {}),
          ...(ind.spouseMiddleName !== undefined ? { spouseMiddleName: ind.spouseMiddleName } : {}),
          ...(ind.spouseLastName !== undefined ? { spouseLastName: ind.spouseLastName } : {}),
          ...(ind.spouseEmploymentStatus !== undefined
            ? { spouseEmploymentStatus: ind.spouseEmploymentStatus }
            : {}),
          ...(ind.spouseTin !== undefined ? { spouseTin: ind.spouseTin } : {}),
          ...(ind.spouseEmployerName !== undefined ? { spouseEmployerName: ind.spouseEmployerName } : {}),
          ...(ind.spouseEmployerTin !== undefined ? { spouseEmployerTin: ind.spouseEmployerTin } : {}),
        },
      });
    }

    // ── Business operations — upsert ────────────────────────────────────────
    if (businessDetails && Object.keys(businessDetails).length > 0) {
      const { monthlyRent, ...restBiz } = businessDetails;
      await tx.businessOperations.upsert({
        where: { clientId },
        create: {
          clientId,
          ...(restBiz as Record<string, unknown>),
          ...(monthlyRent !== undefined ? { monthlyRent: monthlyRent ?? undefined } : {}),
        },
        update: {
          ...(restBiz as Record<string, unknown>),
          ...(monthlyRent !== undefined ? { monthlyRent: monthlyRent ?? undefined } : {}),
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
