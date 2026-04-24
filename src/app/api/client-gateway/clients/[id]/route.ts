// src/app/api/client-gateway/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { verifyPassword } from 'better-auth/crypto';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

type RouteContext = { params: Promise<{ id: string }> };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDecimalOrNull(val: string | null | undefined) {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function toDateOrNull(val: string | null | undefined) {
  if (!val || val.trim() === '') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function strOrNull(val: string | null | undefined) {
  if (!val || val.trim() === '') return null;
  return val;
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const coreSchema = z.object({
  businessName: z.string().min(1).optional(),
  companyCode: z.string().min(1).optional(),
  clientNo: z.string().optional().nullable(),
  portalName: z.string().optional(),
  active: z.boolean().optional(),
  timezone: z.string().optional(),
  branchType: z.enum(['MAIN', 'BRANCH']).optional(),
});

const birSchema = z.object({
  tin: z.string().optional(),
  branchCode: z.string().optional(),
  rdoCode: z.string().optional(),
  registeredAddress: z.string().optional(),
  zipCode: z.string().optional(),
  contactNumber: z.string().optional().nullable(),
  isWithholdingAgent: z.boolean().optional(),
  withholdingCategory: z.string().optional().nullable(),
  corUrl: z.string().optional().nullable(),
});

const businessDetailsSchema = z.object({
  tradeName: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  lineOfBusiness: z.string().optional().nullable(),
  psicCode: z.string().optional().nullable(),
  businessAreaSqm: z.string().optional().nullable(),
  noOfManagers: z.number().optional(),
  noOfSupervisors: z.number().optional(),
  noOfRankAndFile: z.number().optional(),
  noOfElevators: z.number().optional(),
  noOfEscalators: z.number().optional(),
  noOfAircons: z.number().optional(),
  hasCctv: z.boolean().optional(),
  signboardLength: z.string().optional().nullable(),
  hasSignboardLight: z.boolean().optional(),
  landlineNumber: z.string().optional().nullable(),
  faxNumber: z.string().optional().nullable(),
  placeType: z.enum(['OWNED', 'RENTED', 'FREE_USE']).optional(),
  lessorName: z.string().optional().nullable(),
  lessorAddress: z.string().optional().nullable(),
  monthlyRent: z.string().optional().nullable(),
  rentContractUrl: z.string().optional().nullable(),
  isNotarized: z.boolean().optional(),
  hasDocStamp: z.boolean().optional(),
  propertyOwner: z.string().optional().nullable(),
  ownedDocsUrl: z.string().optional().nullable(),
  ownedReason: z.string().optional().nullable(),
  noRentReason: z.string().optional().nullable(),
});

const corporateDetailsSchema = z.object({
  secRegistrationNo: z.string().optional().nullable(),
  acronym: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  companyClassification: z.string().optional().nullable(),
  companySubclass: z.string().optional().nullable(),
  dateOfIncorporation: z.string().optional().nullable(),
  termOfExistence: z.string().optional().nullable(),
  primaryPurpose: z.string().optional().nullable(),
  annualMeetingDate: z.string().optional().nullable(),
  numberOfIncorporators: z.number().optional().nullable(),
  hasBoardOfDirectors: z.boolean().optional(),
  authorizedCapital: z.string().optional().nullable(),
  subscribedCapital: z.string().optional().nullable(),
  paidUpCapital: z.string().optional().nullable(),
  primaryEmail: z.string().optional().nullable(),
  secondaryEmail: z.string().optional().nullable(),
  primaryContactNo: z.string().optional().nullable(),
  secondaryContactNo: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  authRepFirstName: z.string().optional().nullable(),
  authRepMiddleName: z.string().optional().nullable(),
  authRepLastName: z.string().optional().nullable(),
  authRepPosition: z.string().optional().nullable(),
  authRepTin: z.string().optional().nullable(),
  authRepDob: z.string().optional().nullable(),
  presidentFirstName: z.string().optional().nullable(),
  presidentMiddleName: z.string().optional().nullable(),
  presidentLastName: z.string().optional().nullable(),
  presidentGender: z.string().optional().nullable(),
  presidentNationality: z.string().optional().nullable(),
  presidentAddress: z.string().optional().nullable(),
  presidentTin: z.string().optional().nullable(),
  presidentEmail: z.string().optional().nullable(),
  presidentDob: z.string().optional().nullable(),
  treasurerFirstName: z.string().optional().nullable(),
  treasurerMiddleName: z.string().optional().nullable(),
  treasurerLastName: z.string().optional().nullable(),
  treasurerGender: z.string().optional().nullable(),
  treasurerNationality: z.string().optional().nullable(),
  treasurerAddress: z.string().optional().nullable(),
  treasurerTin: z.string().optional().nullable(),
  treasurerEmail: z.string().optional().nullable(),
  treasurerDob: z.string().optional().nullable(),
  secretaryFirstName: z.string().optional().nullable(),
  secretaryMiddleName: z.string().optional().nullable(),
  secretaryLastName: z.string().optional().nullable(),
  secretaryGender: z.string().optional().nullable(),
  secretaryNationality: z.string().optional().nullable(),
  secretaryAddress: z.string().optional().nullable(),
  secretaryTin: z.string().optional().nullable(),
  secretaryEmail: z.string().optional().nullable(),
  secretaryDob: z.string().optional().nullable(),
});

const individualDetailsSchema = z.object({
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1).optional(),
  dob: z.string().optional(),
  civilStatus: z.string().optional(),
  gender: z.string().optional(),
  citizenship: z.string().optional(),
  placeOfBirth: z.string().optional().nullable(),
  residentialAddress: z.string().optional().nullable(),
  prcLicenseNo: z.string().optional().nullable(),
  primaryIdType: z.string().optional().nullable(),
  primaryIdNumber: z.string().optional().nullable(),
  personalEmail: z.string().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  telephoneNumber: z.string().optional().nullable(),
  motherFirstName: z.string().optional().nullable(),
  motherMiddleName: z.string().optional().nullable(),
  motherLastName: z.string().optional().nullable(),
  fatherFirstName: z.string().optional().nullable(),
  fatherMiddleName: z.string().optional().nullable(),
  fatherLastName: z.string().optional().nullable(),
  spouseFirstName: z.string().optional().nullable(),
  spouseMiddleName: z.string().optional().nullable(),
  spouseLastName: z.string().optional().nullable(),
  spouseEmploymentStatus: z.string().optional().nullable(),
  spouseTin: z.string().optional().nullable(),
  spouseEmployerName: z.string().optional().nullable(),
  spouseEmployerTin: z.string().optional().nullable(),
});

const shareholderSchema = z.object({
  id: z.number().optional(),
  firstName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1),
  dob: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  tin: z.string().optional().nullable(),
  numberOfShares: z.string(),
  paidUpCapital: z.string(),
  methodOfPayment: z.string().optional(),
  orderSequence: z.number().optional(),
});

const updateBodySchema = z.object({
  core: coreSchema.optional(),
  birInfo: birSchema.optional(),
  businessDetails: businessDetailsSchema.optional(),
  corporateDetails: corporateDetailsSchema.optional(),
  individualDetails: individualDetailsSchema.optional(),
  shareholders: z.array(shareholderSchema).optional(),
});

// ─── GET /api/client-gateway/clients/[id] ────────────────────────────────────
export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      birInfo: true,
      businessDetails: true,
      corporateDetails: true,
      individualDetails: true,
      shareholders: { orderBy: { orderSequence: 'asc' } },
      userAssignments: {
        include: {
          clientUser: { select: { id: true, name: true, email: true, status: true } },
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const b = client.businessDetails;
  const co = client.corporateDetails;
  const ind = client.individualDetails;

  return NextResponse.json({
    data: {
      id: client.id,
      companyCode: client.companyCode,
      clientNo: client.clientNo,
      businessName: client.businessName,
      portalName: client.portalName,
      logoUrl: client.logoUrl,
      businessEntity: client.businessEntity,
      branchType: client.branchType,
      active: client.active,
      dayResetTime: client.dayResetTime,
      workingDayStarts: client.workingDayStarts,
      timezone: client.timezone,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),

      birInfo: client.birInfo
        ? {
            tin: client.birInfo.tin,
            branchCode: client.birInfo.branchCode,
            rdoCode: client.birInfo.rdoCode,
            registeredAddress: client.birInfo.registeredAddress,
            zipCode: client.birInfo.zipCode,
            contactNumber: client.birInfo.contactNumber ?? '',
            isWithholdingAgent: client.birInfo.isWithholdingAgent,
            withholdingCategory: client.birInfo.withholdingCategory ?? '',
            corUrl: client.birInfo.corUrl ?? '',
          }
        : null,

      businessDetails: b
        ? {
            tradeName: b.tradeName ?? '',
            industry: b.industry ?? '',
            lineOfBusiness: b.lineOfBusiness ?? '',
            psicCode: b.psicCode ?? '',
            businessAreaSqm: b.businessAreaSqm?.toString() ?? '',
            noOfManagers: b.noOfManagers,
            noOfSupervisors: b.noOfSupervisors,
            noOfRankAndFile: b.noOfRankAndFile,
            noOfElevators: b.noOfElevators,
            noOfEscalators: b.noOfEscalators,
            noOfAircons: b.noOfAircons,
            hasCctv: b.hasCctv,
            signboardLength: b.signboardLength ?? '',
            hasSignboardLight: b.hasSignboardLight,
            landlineNumber: b.landlineNumber ?? '',
            faxNumber: b.faxNumber ?? '',
            placeType: b.placeType,
            lessorName: b.lessorName ?? '',
            lessorAddress: b.lessorAddress ?? '',
            monthlyRent: b.monthlyRent?.toString() ?? '',
            rentContractUrl: b.rentContractUrl ?? '',
            isNotarized: b.isNotarized,
            hasDocStamp: b.hasDocStamp,
            propertyOwner: b.propertyOwner ?? '',
            ownedDocsUrl: b.ownedDocsUrl ?? '',
            ownedReason: b.ownedReason ?? '',
            noRentReason: b.noRentReason ?? '',
          }
        : null,

      corporateDetails: co
        ? {
            secRegistrationNo: co.secRegistrationNo ?? '',
            acronym: co.acronym ?? '',
            suffix: co.suffix ?? '',
            companyClassification: co.companyClassification ?? '',
            companySubclass: co.companySubclass ?? '',
            dateOfIncorporation: co.dateOfIncorporation?.toISOString().split('T')[0] ?? '',
            termOfExistence: co.termOfExistence ?? '',
            primaryPurpose: co.primaryPurpose ?? '',
            annualMeetingDate: co.annualMeetingDate?.toISOString().split('T')[0] ?? '',
            numberOfIncorporators: co.numberOfIncorporators,
            hasBoardOfDirectors: co.hasBoardOfDirectors,
            authorizedCapital: co.authorizedCapital?.toString() ?? '',
            subscribedCapital: co.subscribedCapital?.toString() ?? '',
            paidUpCapital: co.paidUpCapital?.toString() ?? '',
            primaryEmail: co.primaryEmail ?? '',
            secondaryEmail: co.secondaryEmail ?? '',
            primaryContactNo: co.primaryContactNo ?? '',
            secondaryContactNo: co.secondaryContactNo ?? '',
            contactPerson: co.contactPerson ?? '',
            authRepFirstName: co.authRepFirstName ?? '',
            authRepMiddleName: co.authRepMiddleName ?? '',
            authRepLastName: co.authRepLastName ?? '',
            authRepPosition: co.authRepPosition ?? '',
            authRepTin: co.authRepTin ?? '',
            authRepDob: co.authRepDob?.toISOString().split('T')[0] ?? '',
            presidentFirstName: co.presidentFirstName ?? '',
            presidentMiddleName: co.presidentMiddleName ?? '',
            presidentLastName: co.presidentLastName ?? '',
            presidentGender: co.presidentGender ?? '',
            presidentNationality: co.presidentNationality ?? '',
            presidentAddress: co.presidentAddress ?? '',
            presidentTin: co.presidentTin ?? '',
            presidentEmail: co.presidentEmail ?? '',
            presidentDob: co.presidentDob?.toISOString().split('T')[0] ?? '',
            treasurerFirstName: co.treasurerFirstName ?? '',
            treasurerMiddleName: co.treasurerMiddleName ?? '',
            treasurerLastName: co.treasurerLastName ?? '',
            treasurerGender: co.treasurerGender ?? '',
            treasurerNationality: co.treasurerNationality ?? '',
            treasurerAddress: co.treasurerAddress ?? '',
            treasurerTin: co.treasurerTin ?? '',
            treasurerEmail: co.treasurerEmail ?? '',
            treasurerDob: co.treasurerDob?.toISOString().split('T')[0] ?? '',
            secretaryFirstName: co.secretaryFirstName ?? '',
            secretaryMiddleName: co.secretaryMiddleName ?? '',
            secretaryLastName: co.secretaryLastName ?? '',
            secretaryGender: co.secretaryGender ?? '',
            secretaryNationality: co.secretaryNationality ?? '',
            secretaryAddress: co.secretaryAddress ?? '',
            secretaryTin: co.secretaryTin ?? '',
            secretaryEmail: co.secretaryEmail ?? '',
            secretaryDob: co.secretaryDob?.toISOString().split('T')[0] ?? '',
          }
        : null,

      shareholders: client.shareholders.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        middleName: s.middleName ?? '',
        lastName: s.lastName,
        dob: s.dob?.toISOString().split('T')[0] ?? '',
        nationality: s.nationality ?? '',
        gender: s.gender ?? '',
        tin: s.tin ?? '',
        numberOfShares: s.numberOfShares.toString(),
        paidUpCapital: s.paidUpCapital.toString(),
        methodOfPayment: s.methodOfPayment,
        orderSequence: s.orderSequence,
      })),

      individualDetails: ind
        ? {
            firstName: ind.firstName,
            middleName: ind.middleName ?? '',
            lastName: ind.lastName,
            dob: ind.dob.toISOString().split('T')[0],
            civilStatus: ind.civilStatus,
            gender: ind.gender,
            citizenship: ind.citizenship,
            placeOfBirth: ind.placeOfBirth ?? '',
            residentialAddress: ind.residentialAddress ?? '',
            prcLicenseNo: ind.prcLicenseNo ?? '',
            primaryIdType: ind.primaryIdType ?? '',
            primaryIdNumber: ind.primaryIdNumber ?? '',
            personalEmail: ind.personalEmail ?? '',
            mobileNumber: ind.mobileNumber ?? '',
            telephoneNumber: ind.telephoneNumber ?? '',
            motherFirstName: ind.motherFirstName ?? '',
            motherMiddleName: ind.motherMiddleName ?? '',
            motherLastName: ind.motherLastName ?? '',
            fatherFirstName: ind.fatherFirstName ?? '',
            fatherMiddleName: ind.fatherMiddleName ?? '',
            fatherLastName: ind.fatherLastName ?? '',
            spouseFirstName: ind.spouseFirstName ?? '',
            spouseMiddleName: ind.spouseMiddleName ?? '',
            spouseLastName: ind.spouseLastName ?? '',
            spouseEmploymentStatus: ind.spouseEmploymentStatus ?? '',
            spouseTin: ind.spouseTin ?? '',
            spouseEmployerName: ind.spouseEmployerName ?? '',
            spouseEmployerTin: ind.spouseEmployerTin ?? '',
          }
        : null,

      portalUsers: client.userAssignments.map((a) => ({
        id: a.clientUser.id,
        name: a.clientUser.name,
        email: a.clientUser.email,
        status: a.clientUser.status,
        role: a.role,
      })),
    },
  });
}

// ─── PUT /api/client-gateway/clients/[id] ────────────────────────────────────
export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    );
  }

  const existing = await prisma.client.findUnique({ where: { id: clientId } });
  if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const { core, birInfo, businessDetails, corporateDetails, individualDetails, shareholders } =
    parsed.data;

  // Run all mutations in a single transaction
  await prisma.$transaction(async (tx) => {
    // Core client fields
    if (core) {
      // Validate company code uniqueness if changing
      if (core.companyCode && core.companyCode !== existing.companyCode) {
        const taken = await tx.client.findUnique({ where: { companyCode: core.companyCode } });
        if (taken) throw new Error('Company code already in use');
      }
      await tx.client.update({
        where: { id: clientId },
        data: {
          businessName: core.businessName,
          companyCode: core.companyCode,
          clientNo: core.clientNo,
          portalName: core.portalName,
          active: core.active,
          timezone: core.timezone,
          branchType: core.branchType,
        },
      });
    }

    // BIR Information
    if (birInfo) {
      await tx.birInformation.upsert({
        where: { clientId },
        create: {
          clientId,
          tin: birInfo.tin ?? '',
          branchCode: birInfo.branchCode ?? '0000',
          rdoCode: birInfo.rdoCode ?? '',
          registeredAddress: birInfo.registeredAddress ?? '',
          zipCode: birInfo.zipCode ?? '',
          contactNumber: strOrNull(birInfo.contactNumber),
          isWithholdingAgent: birInfo.isWithholdingAgent ?? false,
          withholdingCategory: strOrNull(birInfo.withholdingCategory),
          corUrl: strOrNull(birInfo.corUrl),
        },
        update: {
          tin: birInfo.tin,
          branchCode: birInfo.branchCode,
          rdoCode: birInfo.rdoCode,
          registeredAddress: birInfo.registeredAddress,
          zipCode: birInfo.zipCode,
          contactNumber: strOrNull(birInfo.contactNumber),
          isWithholdingAgent: birInfo.isWithholdingAgent,
          withholdingCategory: strOrNull(birInfo.withholdingCategory),
          corUrl: strOrNull(birInfo.corUrl),
        },
      });
    }

    // Business Operations (Sole Prop, Partnership, Corp, Cooperative)
    if (businessDetails) {
      const bd = businessDetails;
      await tx.businessOperations.upsert({
        where: { clientId },
        create: {
          clientId,
          tradeName: strOrNull(bd.tradeName),
          industry: strOrNull(bd.industry),
          lineOfBusiness: strOrNull(bd.lineOfBusiness),
          psicCode: strOrNull(bd.psicCode),
          businessAreaSqm: toDecimalOrNull(bd.businessAreaSqm),
          noOfManagers: bd.noOfManagers ?? 0,
          noOfSupervisors: bd.noOfSupervisors ?? 0,
          noOfRankAndFile: bd.noOfRankAndFile ?? 0,
          noOfElevators: bd.noOfElevators ?? 0,
          noOfEscalators: bd.noOfEscalators ?? 0,
          noOfAircons: bd.noOfAircons ?? 0,
          hasCctv: bd.hasCctv ?? false,
          signboardLength: strOrNull(bd.signboardLength),
          hasSignboardLight: bd.hasSignboardLight ?? false,
          landlineNumber: strOrNull(bd.landlineNumber),
          faxNumber: strOrNull(bd.faxNumber),
          placeType: bd.placeType ?? 'RENTED',
          lessorName: strOrNull(bd.lessorName),
          lessorAddress: strOrNull(bd.lessorAddress),
          monthlyRent: toDecimalOrNull(bd.monthlyRent),
          rentContractUrl: strOrNull(bd.rentContractUrl),
          isNotarized: bd.isNotarized ?? false,
          hasDocStamp: bd.hasDocStamp ?? false,
          propertyOwner: strOrNull(bd.propertyOwner),
          ownedDocsUrl: strOrNull(bd.ownedDocsUrl),
          ownedReason: strOrNull(bd.ownedReason),
          noRentReason: strOrNull(bd.noRentReason),
        },
        update: {
          tradeName: strOrNull(bd.tradeName),
          industry: strOrNull(bd.industry),
          lineOfBusiness: strOrNull(bd.lineOfBusiness),
          psicCode: strOrNull(bd.psicCode),
          businessAreaSqm: toDecimalOrNull(bd.businessAreaSqm),
          noOfManagers: bd.noOfManagers,
          noOfSupervisors: bd.noOfSupervisors,
          noOfRankAndFile: bd.noOfRankAndFile,
          noOfElevators: bd.noOfElevators,
          noOfEscalators: bd.noOfEscalators,
          noOfAircons: bd.noOfAircons,
          hasCctv: bd.hasCctv,
          signboardLength: strOrNull(bd.signboardLength),
          hasSignboardLight: bd.hasSignboardLight,
          landlineNumber: strOrNull(bd.landlineNumber),
          faxNumber: strOrNull(bd.faxNumber),
          placeType: bd.placeType,
          lessorName: strOrNull(bd.lessorName),
          lessorAddress: strOrNull(bd.lessorAddress),
          monthlyRent: toDecimalOrNull(bd.monthlyRent),
          rentContractUrl: strOrNull(bd.rentContractUrl),
          isNotarized: bd.isNotarized,
          hasDocStamp: bd.hasDocStamp,
          propertyOwner: strOrNull(bd.propertyOwner),
          ownedDocsUrl: strOrNull(bd.ownedDocsUrl),
          ownedReason: strOrNull(bd.ownedReason),
          noRentReason: strOrNull(bd.noRentReason),
        },
      });
    }

    // Corporate Details (Corporation, Cooperative)
    if (corporateDetails) {
      const cd = corporateDetails;
      await tx.corporateDetails.upsert({
        where: { clientId },
        create: {
          clientId,
          secRegistrationNo: strOrNull(cd.secRegistrationNo),
          acronym: strOrNull(cd.acronym),
          suffix: strOrNull(cd.suffix),
          companyClassification: strOrNull(cd.companyClassification),
          companySubclass: strOrNull(cd.companySubclass),
          dateOfIncorporation: toDateOrNull(cd.dateOfIncorporation),
          termOfExistence: strOrNull(cd.termOfExistence),
          primaryPurpose: strOrNull(cd.primaryPurpose),
          annualMeetingDate: toDateOrNull(cd.annualMeetingDate),
          numberOfIncorporators: cd.numberOfIncorporators ?? null,
          hasBoardOfDirectors: cd.hasBoardOfDirectors ?? true,
          authorizedCapital: toDecimalOrNull(cd.authorizedCapital),
          subscribedCapital: toDecimalOrNull(cd.subscribedCapital),
          paidUpCapital: toDecimalOrNull(cd.paidUpCapital),
          primaryEmail: strOrNull(cd.primaryEmail),
          secondaryEmail: strOrNull(cd.secondaryEmail),
          primaryContactNo: strOrNull(cd.primaryContactNo),
          secondaryContactNo: strOrNull(cd.secondaryContactNo),
          contactPerson: strOrNull(cd.contactPerson),
          authRepFirstName: strOrNull(cd.authRepFirstName),
          authRepMiddleName: strOrNull(cd.authRepMiddleName),
          authRepLastName: strOrNull(cd.authRepLastName),
          authRepPosition: strOrNull(cd.authRepPosition),
          authRepTin: strOrNull(cd.authRepTin),
          authRepDob: toDateOrNull(cd.authRepDob),
          presidentFirstName: strOrNull(cd.presidentFirstName),
          presidentMiddleName: strOrNull(cd.presidentMiddleName),
          presidentLastName: strOrNull(cd.presidentLastName),
          presidentGender: strOrNull(cd.presidentGender),
          presidentNationality: strOrNull(cd.presidentNationality),
          presidentAddress: strOrNull(cd.presidentAddress),
          presidentTin: strOrNull(cd.presidentTin),
          presidentEmail: strOrNull(cd.presidentEmail),
          presidentDob: toDateOrNull(cd.presidentDob),
          treasurerFirstName: strOrNull(cd.treasurerFirstName),
          treasurerMiddleName: strOrNull(cd.treasurerMiddleName),
          treasurerLastName: strOrNull(cd.treasurerLastName),
          treasurerGender: strOrNull(cd.treasurerGender),
          treasurerNationality: strOrNull(cd.treasurerNationality),
          treasurerAddress: strOrNull(cd.treasurerAddress),
          treasurerTin: strOrNull(cd.treasurerTin),
          treasurerEmail: strOrNull(cd.treasurerEmail),
          treasurerDob: toDateOrNull(cd.treasurerDob),
          secretaryFirstName: strOrNull(cd.secretaryFirstName),
          secretaryMiddleName: strOrNull(cd.secretaryMiddleName),
          secretaryLastName: strOrNull(cd.secretaryLastName),
          secretaryGender: strOrNull(cd.secretaryGender),
          secretaryNationality: strOrNull(cd.secretaryNationality),
          secretaryAddress: strOrNull(cd.secretaryAddress),
          secretaryTin: strOrNull(cd.secretaryTin),
          secretaryEmail: strOrNull(cd.secretaryEmail),
          secretaryDob: toDateOrNull(cd.secretaryDob),
        },
        update: {
          secRegistrationNo: strOrNull(cd.secRegistrationNo),
          acronym: strOrNull(cd.acronym),
          suffix: strOrNull(cd.suffix),
          companyClassification: strOrNull(cd.companyClassification),
          companySubclass: strOrNull(cd.companySubclass),
          dateOfIncorporation: toDateOrNull(cd.dateOfIncorporation),
          termOfExistence: strOrNull(cd.termOfExistence),
          primaryPurpose: strOrNull(cd.primaryPurpose),
          annualMeetingDate: toDateOrNull(cd.annualMeetingDate),
          numberOfIncorporators: cd.numberOfIncorporators,
          hasBoardOfDirectors: cd.hasBoardOfDirectors,
          authorizedCapital: toDecimalOrNull(cd.authorizedCapital),
          subscribedCapital: toDecimalOrNull(cd.subscribedCapital),
          paidUpCapital: toDecimalOrNull(cd.paidUpCapital),
          primaryEmail: strOrNull(cd.primaryEmail),
          secondaryEmail: strOrNull(cd.secondaryEmail),
          primaryContactNo: strOrNull(cd.primaryContactNo),
          secondaryContactNo: strOrNull(cd.secondaryContactNo),
          contactPerson: strOrNull(cd.contactPerson),
          authRepFirstName: strOrNull(cd.authRepFirstName),
          authRepMiddleName: strOrNull(cd.authRepMiddleName),
          authRepLastName: strOrNull(cd.authRepLastName),
          authRepPosition: strOrNull(cd.authRepPosition),
          authRepTin: strOrNull(cd.authRepTin),
          authRepDob: toDateOrNull(cd.authRepDob),
          presidentFirstName: strOrNull(cd.presidentFirstName),
          presidentMiddleName: strOrNull(cd.presidentMiddleName),
          presidentLastName: strOrNull(cd.presidentLastName),
          presidentGender: strOrNull(cd.presidentGender),
          presidentNationality: strOrNull(cd.presidentNationality),
          presidentAddress: strOrNull(cd.presidentAddress),
          presidentTin: strOrNull(cd.presidentTin),
          presidentEmail: strOrNull(cd.presidentEmail),
          presidentDob: toDateOrNull(cd.presidentDob),
          treasurerFirstName: strOrNull(cd.treasurerFirstName),
          treasurerMiddleName: strOrNull(cd.treasurerMiddleName),
          treasurerLastName: strOrNull(cd.treasurerLastName),
          treasurerGender: strOrNull(cd.treasurerGender),
          treasurerNationality: strOrNull(cd.treasurerNationality),
          treasurerAddress: strOrNull(cd.treasurerAddress),
          treasurerTin: strOrNull(cd.treasurerTin),
          treasurerEmail: strOrNull(cd.treasurerEmail),
          treasurerDob: toDateOrNull(cd.treasurerDob),
          secretaryFirstName: strOrNull(cd.secretaryFirstName),
          secretaryMiddleName: strOrNull(cd.secretaryMiddleName),
          secretaryLastName: strOrNull(cd.secretaryLastName),
          secretaryGender: strOrNull(cd.secretaryGender),
          secretaryNationality: strOrNull(cd.secretaryNationality),
          secretaryAddress: strOrNull(cd.secretaryAddress),
          secretaryTin: strOrNull(cd.secretaryTin),
          secretaryEmail: strOrNull(cd.secretaryEmail),
          secretaryDob: toDateOrNull(cd.secretaryDob),
        },
      });
    }

    // Individual Details (Individual, Sole Proprietorship)
    if (individualDetails) {
      const ind = individualDetails;
      await tx.individualDetails.upsert({
        where: { clientId },
        create: {
          clientId,
          firstName: ind.firstName ?? '',
          middleName: strOrNull(ind.middleName),
          lastName: ind.lastName ?? '',
          dob: toDateOrNull(ind.dob) ?? new Date(),
          civilStatus: ind.civilStatus ?? '',
          gender: ind.gender ?? '',
          citizenship: ind.citizenship ?? 'Filipino',
          placeOfBirth: strOrNull(ind.placeOfBirth),
          residentialAddress: strOrNull(ind.residentialAddress),
          prcLicenseNo: strOrNull(ind.prcLicenseNo),
          primaryIdType: strOrNull(ind.primaryIdType),
          primaryIdNumber: strOrNull(ind.primaryIdNumber),
          personalEmail: strOrNull(ind.personalEmail),
          mobileNumber: strOrNull(ind.mobileNumber),
          telephoneNumber: strOrNull(ind.telephoneNumber),
          motherFirstName: strOrNull(ind.motherFirstName),
          motherMiddleName: strOrNull(ind.motherMiddleName),
          motherLastName: strOrNull(ind.motherLastName),
          fatherFirstName: strOrNull(ind.fatherFirstName),
          fatherMiddleName: strOrNull(ind.fatherMiddleName),
          fatherLastName: strOrNull(ind.fatherLastName),
          spouseFirstName: strOrNull(ind.spouseFirstName),
          spouseMiddleName: strOrNull(ind.spouseMiddleName),
          spouseLastName: strOrNull(ind.spouseLastName),
          spouseEmploymentStatus: strOrNull(ind.spouseEmploymentStatus),
          spouseTin: strOrNull(ind.spouseTin),
          spouseEmployerName: strOrNull(ind.spouseEmployerName),
          spouseEmployerTin: strOrNull(ind.spouseEmployerTin),
        },
        update: {
          firstName: ind.firstName,
          middleName: strOrNull(ind.middleName),
          lastName: ind.lastName,
          dob: toDateOrNull(ind.dob) ?? undefined,
          civilStatus: ind.civilStatus,
          gender: ind.gender,
          citizenship: ind.citizenship,
          placeOfBirth: strOrNull(ind.placeOfBirth),
          residentialAddress: strOrNull(ind.residentialAddress),
          prcLicenseNo: strOrNull(ind.prcLicenseNo),
          primaryIdType: strOrNull(ind.primaryIdType),
          primaryIdNumber: strOrNull(ind.primaryIdNumber),
          personalEmail: strOrNull(ind.personalEmail),
          mobileNumber: strOrNull(ind.mobileNumber),
          telephoneNumber: strOrNull(ind.telephoneNumber),
          motherFirstName: strOrNull(ind.motherFirstName),
          motherMiddleName: strOrNull(ind.motherMiddleName),
          motherLastName: strOrNull(ind.motherLastName),
          fatherFirstName: strOrNull(ind.fatherFirstName),
          fatherMiddleName: strOrNull(ind.fatherMiddleName),
          fatherLastName: strOrNull(ind.fatherLastName),
          spouseFirstName: strOrNull(ind.spouseFirstName),
          spouseMiddleName: strOrNull(ind.spouseMiddleName),
          spouseLastName: strOrNull(ind.spouseLastName),
          spouseEmploymentStatus: strOrNull(ind.spouseEmploymentStatus),
          spouseTin: strOrNull(ind.spouseTin),
          spouseEmployerName: strOrNull(ind.spouseEmployerName),
          spouseEmployerTin: strOrNull(ind.spouseEmployerTin),
        },
      });
    }

    // Shareholders — replace-all strategy (delete existing then re-create)
    if (shareholders !== undefined) {
      await tx.corporateShareholder.deleteMany({ where: { clientId } });
      if (shareholders.length > 0) {
        await tx.corporateShareholder.createMany({
          data: shareholders.map((s, i) => ({
            clientId,
            firstName: s.firstName,
            middleName: strOrNull(s.middleName),
            lastName: s.lastName,
            dob: toDateOrNull(s.dob),
            nationality: strOrNull(s.nationality),
            gender: strOrNull(s.gender),
            tin: strOrNull(s.tin),
            numberOfShares: parseFloat(s.numberOfShares) || 0,
            paidUpCapital: parseFloat(s.paidUpCapital) || 0,
            methodOfPayment: s.methodOfPayment ?? 'CASH',
            orderSequence: s.orderSequence ?? i,
          })),
        });
      }
    }
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'Client',
    entityId: String(clientId),
    description: `Updated client #${clientId} (${existing.businessName})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ success: true });
}

// ─── PATCH /api/client-gateway/clients/[id] — toggle active ──────────────────
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = z.object({ active: z.boolean() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Expected { active: boolean }' }, { status: 400 });
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { active: parsed.data.active },
    select: { id: true, businessName: true, active: true },
  });

  void logActivity({
    userId: session.user.id,
    action: 'STATUS_CHANGE',
    entity: 'Client',
    entityId: String(clientId),
    description: `Set client ${client.businessName} to ${client.active ? 'Active' : 'Inactive'}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: client.id, active: client.active } });
}

/**
 * DELETE /api/client-gateway/clients/[id]
 * Permanently deletes a client. Requires the caller's password for confirmation.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = z.object({ password: z.string().min(1, 'Password is required') }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }

  // Verify the caller's credential account password
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: 'credential' },
    select: { password: true },
  });
  if (!account?.password) {
    return NextResponse.json({ error: 'Cannot verify password for this account type' }, { status: 400 });
  }
  const isValid = await verifyPassword({ password: parsed.data.password, hash: account.password });
  if (!isValid) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
  }

  const target = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, businessName: true, companyCode: true },
  });
  if (!target) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  await prisma.client.delete({ where: { id: clientId } });

  revalidateTag('client-gateway-clients', 'max');
  revalidateTag('admin-clients-settings-list', 'max');
  revalidateTag('hr-clients-list', 'max');

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'Client',
    entityId: String(clientId),
    description: `Deleted client ${target.businessName} (${target.companyCode ?? 'no code'})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: clientId } });
}
