// src/app/api/sales/contracts/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export interface ContractClientResult {
  id: number;
  clientNo: string;
  businessName: string;
  businessEntity: string;
  tin: string;
  email: string;
  phone: string;
  authorizedRep: string;
  businessAddress: string;
  residenceAddress: string;
  civilStatus: string;
  isBusinessRegistered: boolean;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const search = (request.nextUrl.searchParams.get('search') ?? '').trim();

  const clients = await prisma.client.findMany({
    where: search
      ? {
          OR: [
            { businessName: { contains: search, mode: 'insensitive' } },
            { clientNo: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    select: {
      id: true,
      clientNo: true,
      businessName: true,
      businessEntity: true,
      active: true,
      birInfo: {
        select: {
          tin: true,
          registeredAddress: true,
          contactNumber: true,
        },
      },
      corporateDetails: {
        select: {
          primaryEmail: true,
          primaryContactNo: true,
          authRepFirstName: true,
          authRepMiddleName: true,
          authRepLastName: true,
        },
      },
      individualDetails: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          personalEmail: true,
          mobileNumber: true,
          telephoneNumber: true,
          residentialAddress: true,
          civilStatus: true,
        },
      },
    },
    orderBy: { businessName: 'asc' },
    take: 20,
  });

  const data: ContractClientResult[] = clients.map((c) => {
    const corp = c.corporateDetails;
    const ind = c.individualDetails;
    const bir = c.birInfo;

    const authorizedRep = corp
      ? [corp.authRepFirstName, corp.authRepMiddleName, corp.authRepLastName]
          .filter(Boolean)
          .join(' ')
      : ind
        ? [ind.firstName, ind.middleName, ind.lastName].filter(Boolean).join(' ')
        : '';

    const email =
      corp?.primaryEmail ?? ind?.personalEmail ?? '';
    const phone =
      corp?.primaryContactNo ??
      ind?.mobileNumber ??
      ind?.telephoneNumber ??
      bir?.contactNumber ??
      '';

    return {
      id: c.id,
      clientNo: c.clientNo ?? '',
      businessName: c.businessName,
      businessEntity: c.businessEntity,
      tin: bir?.tin ?? '',
      email,
      phone,
      authorizedRep,
      businessAddress: bir?.registeredAddress ?? '',
      residenceAddress: ind?.residentialAddress ?? '',
      civilStatus: ind?.civilStatus ?? 'single',
      isBusinessRegistered: c.active,
    };
  });

  return NextResponse.json({ data });
}
