// src/app/api/sales/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import type { Prisma } from '@/generated/prisma/client';
import type { ClientListRecord, ClientSubscriptionInfo } from '@/types/sales-client-list.types';

// ─── Internal raw types ────────────────────────────────────────────
type RawSubscription = {
  id: number;
  servicePlanId: number;
  agreedRate: unknown;
  billingCycle: string;
  servicePlan: { name: string; inclusions: { id: number; name: string; category: string | null }[] };
};

type RawClient = {
  id: number;
  clientNo: string | null;
  businessName: string;
  companyCode: string | null;
  businessEntity: string;
  active: boolean;
  birInfo: { contactNumber: string | null } | null;
  corporateDetails: {
    primaryEmail: string | null;
    primaryContactNo: string | null;
    authRepFirstName: string | null;
    authRepMiddleName: string | null;
    authRepLastName: string | null;
  } | null;
  individualDetails: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    personalEmail: string | null;
    mobileNumber: string | null;
    telephoneNumber: string | null;
  } | null;
  subscriptions: RawSubscription[];
};

// ─── Contact info resolver ─────────────────────────────────────────
function resolveContact(c: RawClient): {
  email: string | null;
  phone: string | null;
  authorizedRep: string | null;
} {
  const entity = c.businessEntity;
  if (entity === 'CORPORATION' || entity === 'PARTNERSHIP' || entity === 'COOPERATIVE') {
    const cor = c.corporateDetails;
    const rep = cor
      ? [cor.authRepFirstName, cor.authRepMiddleName, cor.authRepLastName].filter(Boolean).join(' ') || null
      : null;
    return {
      email: cor?.primaryEmail ?? null,
      phone: cor?.primaryContactNo ?? c.birInfo?.contactNumber ?? null,
      authorizedRep: rep,
    };
  }
  const ind = c.individualDetails;
  const rep = ind
    ? [ind.firstName, ind.middleName, ind.lastName].filter(Boolean).join(' ')
    : null;
  return {
    email: ind?.personalEmail ?? null,
    phone: ind?.mobileNumber ?? ind?.telephoneNumber ?? c.birInfo?.contactNumber ?? null,
    authorizedRep: rep ?? null,
  };
}

// ─── Serializer ────────────────────────────────────────────────────
function serializeClient(c: RawClient): ClientListRecord {
  const contact = resolveContact(c);
  const sub = c.subscriptions[0] ?? null;

  const activeSubscription: ClientSubscriptionInfo | null = sub
    ? {
        id: sub.id,
        servicePlanId: sub.servicePlanId,
        servicePlanName: sub.servicePlan.name,
        agreedRate: Number(sub.agreedRate),
        billingCycle: sub.billingCycle,
        inclusions: sub.servicePlan.inclusions,
      }
    : null;

  return {
    id: c.id,
    clientNo: c.clientNo,
    businessName: c.businessName,
    companyCode: c.companyCode,
    businessEntity: c.businessEntity,
    active: c.active,
    contactEmail: contact.email,
    contactPhone: contact.phone,
    authorizedRep: contact.authorizedRep,
    activeSubscription,
  };
}

// ─── Prisma select shape ───────────────────────────────────────────
const CLIENT_SELECT = {
  id: true,
  clientNo: true,
  businessName: true,
  companyCode: true,
  businessEntity: true,
  active: true,
  birInfo: { select: { contactNumber: true } },
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
    },
  },
  subscriptions: {
    where: { isActive: true },
    select: {
      id: true,
      servicePlanId: true,
      agreedRate: true,
      billingCycle: true,
      servicePlan: {
        select: {
          name: true,
          inclusions: { select: { id: true, name: true, category: true } },
        },
      },
    },
    orderBy: { effectiveDate: 'desc' as const },
    take: 1,
  },
} as const;

// ─── GET /api/sales/clients ────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.ClientWhereInput = {
    ...(search
      ? {
          OR: [
            { businessName: { contains: search, mode: 'insensitive' } },
            { clientNo: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(status === 'active'
      ? { active: true }
      : status === 'inactive'
        ? { active: false }
        : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      select: CLIENT_SELECT,
      orderBy: { businessName: 'asc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({
    data: (clients as unknown as RawClient[]).map(serializeClient),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
