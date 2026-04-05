// src/app/api/sales/tsa/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

const LIST_SELECT = {
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
  pdfUrl: true,
  lockInMonths: true,
  billingCycleStart: true,
  clientSignedAt: true,
  clientSignerName: true,
  createdAt: true,
  lead: { select: { id: true, firstName: true, lastName: true, businessName: true } },
  preparedBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  quote: {
    select: {
      id: true,
      quoteNumber: true,
      lineItems: {
        select: {
          negotiatedRate: true,
          service: { select: { name: true, billingType: true } },
          sourcePackage: { select: { name: true } },
        },
      },
    },
  },
} as const;

export type TsaListItem = {
  id: string;
  referenceNumber: string;
  status: string;
  documentDate: string;
  businessName: string;
  authorizedRep: string;
  email: string | null;
  phone: string | null;
  tin: string | null;
  civilStatus: string | null;
  businessAddress: string | null;
  residenceAddress: string | null;
  isBusinessRegistered: boolean;
  pdfUrl: string | null;
  lockInMonths: number;
  billingCycleStart: number;
  clientSignedAt: string | null;
  clientSignerName: string | null;
  createdAt: string;
  lead: { id: number; firstName: string; lastName: string; businessName: string | null } | null;
  preparedBy: { id: string; name: string | null } | null;
  approvedBy: { id: string; name: string | null } | null;
  serviceNames: string[];
  totalMonthlyRecurring: number;
  quoteNumber: string | null;
  packageName: string | null;
  recurringServiceNames: string[];
  oneTimeServiceNames: string[];
};

/**
 * GET /api/sales/tsa
 * Returns a paginated list of all TSA contracts with service details.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = (searchParams.get("search") ?? "").trim();
  const statusFilter = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;

  const where = {
    ...(search.length > 0
      ? {
          OR: [
            { businessName: { contains: search, mode: "insensitive" as const } },
            { referenceNumber: { contains: search, mode: "insensitive" as const } },
            { authorizedRep: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(statusFilter ? { status: statusFilter as never } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.tsaContract.count({ where }),
    prisma.tsaContract.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data: TsaListItem[] = rows.map((tsa) => {
    const lineItems = tsa.quote?.lineItems ?? [];
    const serviceNames = lineItems.map((li) => li.service.name);
    const totalMonthlyRecurring = lineItems
      .filter((li) => li.service.billingType === "RECURRING")
      .reduce((sum, li) => sum + Number(li.negotiatedRate), 0);

    // Derive package name from first line item that came from a package
    const packageName =
      lineItems.find((li) => li.sourcePackage)?.sourcePackage?.name ?? null;

    // Split services by billing type
    const recurringServiceNames = lineItems
      .filter((li) => li.service.billingType === "RECURRING")
      .map((li) => li.service.name);
    const oneTimeServiceNames = lineItems
      .filter((li) => li.service.billingType === "ONE_TIME")
      .map((li) => li.service.name);

    return {
      id: tsa.id,
      referenceNumber: tsa.referenceNumber,
      status: tsa.status,
      documentDate: tsa.documentDate.toISOString(),
      businessName: tsa.businessName,
      authorizedRep: tsa.authorizedRep,
      email: tsa.email,
      phone: tsa.phone,
      tin: tsa.tin,
      civilStatus: tsa.civilStatus,
      businessAddress: tsa.businessAddress,
      residenceAddress: tsa.residenceAddress,
      isBusinessRegistered: tsa.isBusinessRegistered,
      pdfUrl: tsa.pdfUrl,
      lockInMonths: tsa.lockInMonths,
      billingCycleStart: tsa.billingCycleStart,
      clientSignedAt: tsa.clientSignedAt?.toISOString() ?? null,
      clientSignerName: tsa.clientSignerName,
      createdAt: tsa.createdAt.toISOString(),
      lead: tsa.lead
        ? { id: tsa.lead.id, firstName: tsa.lead.firstName, lastName: tsa.lead.lastName, businessName: tsa.lead.businessName }
        : null,
      preparedBy: tsa.preparedBy ? { id: tsa.preparedBy.id, name: tsa.preparedBy.name } : null,
      approvedBy: tsa.approvedBy ? { id: tsa.approvedBy.id, name: tsa.approvedBy.name } : null,
      serviceNames,
      totalMonthlyRecurring,
      quoteNumber: tsa.quote?.quoteNumber ?? null,
      packageName,
      recurringServiceNames,
      oneTimeServiceNames,
    };
  });

  return NextResponse.json({ data, total, page, pageSize });
}
