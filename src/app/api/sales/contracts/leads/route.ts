// src/app/api/sales/contracts/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export interface TsaContractSearchResult {
  id: string;
  referenceNumber: string;
  status: string;
  businessName: string;
  authorizedRep: string;
  email: string | null;
  phone: string | null;
  tin: string | null;
  civilStatus: string | null;
  businessAddress: string | null;
  residenceAddress: string | null;
  isBusinessRegistered: boolean;
  documentDate: string;
  serviceNames: string[];
  totalMonthlyRecurring: number;
  packageName: string | null;
  recurringServiceNames: string[];
  oneTimeServiceNames: string[];  // Deprecated: use freeOneTimeServiceNames + oneTimeServicesWithPricing
  freeOneTimeServiceNames: string[];  // Free one-time services (rate = 0)
  oneTimeServicesWithPricing: string[];  // Paid one-time services formatted with price
}

/**
 * GET /api/sales/contracts/leads?search=...
 * Searches non-void TSA contracts by business name for auto-filling the Contract Generator.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const search = (request.nextUrl.searchParams.get('search') ?? '').trim();

  const tsas = await prisma.tsaContract.findMany({
    where: {
      ...(search.length > 0
        ? {
            OR: [
              { businessName: { contains: search, mode: 'insensitive' } },
              { referenceNumber: { contains: search, mode: 'insensitive' } },
              { authorizedRep: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      status: { not: 'VOID' },
    },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      businessName: true,
      authorizedRep: true,
      email: true,
      phone: true,
      tin: true,
      civilStatus: true,
      businessAddress: true,
      residenceAddress: true,
      isBusinessRegistered: true,
      documentDate: true,
      quote: {
        select: {
          lineItems: {
            select: {
              negotiatedRate: true,
              service: { select: { name: true, billingType: true } },
              sourcePackage: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const results: TsaContractSearchResult[] = tsas.map((tsa) => {
    const lineItems = tsa.quote?.lineItems ?? [];
    const serviceNames = lineItems.map((li) => li.service.name);
    const totalMonthlyRecurring = lineItems
      .filter((li) => li.service.billingType === 'RECURRING')
      .reduce((sum, li) => sum + Number(li.negotiatedRate), 0);
    const packageName =
      lineItems.find((li) => li.sourcePackage)?.sourcePackage?.name ?? null;
    const recurringServiceNames = lineItems
      .filter((li) => li.service.billingType === 'RECURRING')
      .map((li) => li.service.name);
    
    // Separate free vs paid one-time services
    const freeOneTimeServiceNames = lineItems
      .filter((li) => li.service.billingType === 'ONE_TIME' && Number(li.negotiatedRate) === 0)
      .map((li) => li.service.name);
    
    const oneTimeServicesWithPricing = lineItems
      .filter((li) => li.service.billingType === 'ONE_TIME' && Number(li.negotiatedRate) > 0)
      .map((li) => {
        const rate = Number(li.negotiatedRate);
        return `${li.service.name} - P${rate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      });
    
    // Deprecated: Keep for backward compatibility
    const oneTimeServiceNames = lineItems
      .filter((li) => li.service.billingType === 'ONE_TIME')
      .map((li) => li.service.name);

    return {
      id: tsa.id,
      referenceNumber: tsa.referenceNumber,
      status: tsa.status,
      businessName: tsa.businessName,
      authorizedRep: tsa.authorizedRep,
      email: tsa.email,
      phone: tsa.phone,
      tin: tsa.tin,
      civilStatus: tsa.civilStatus,
      businessAddress: tsa.businessAddress,
      residenceAddress: tsa.residenceAddress,
      isBusinessRegistered: tsa.isBusinessRegistered,
      documentDate: tsa.documentDate.toISOString(),
      serviceNames,
      totalMonthlyRecurring,
      packageName,
      recurringServiceNames,
      oneTimeServiceNames,
      freeOneTimeServiceNames,
      oneTimeServicesWithPricing,
    };
  });

  return NextResponse.json({ data: results });
}
