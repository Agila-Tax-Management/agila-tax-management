// src/app/api/sales/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import type { ClientDetailRecord, ClientSubscriptionInfo } from '@/types/sales-client-list.types';

type Params = { params: Promise<{ id: string }> };

// ─── Internal raw types ────────────────────────────────────────────
type RawSubscription = {
  id: number;
  serviceId: number;
  agreedRate: unknown;
  billingCycle: string;
  service: { name: string; inclusions: { id: number; name: string; category: string | null }[] };
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
  lead: { id: number; firstName: string; lastName: string; businessName: string | null } | null;
  jobOrders: {
    id: string;
    jobOrderNumber: string;
    status: string;
    date: Date;
    items: { id: string; itemType: string; serviceName: string; rate: unknown; total: unknown }[];
  }[];
};

// ─── Contact resolver (duplicated from list route) ────────────────
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
function serializeDetail(c: RawClient): ClientDetailRecord {
  const contact = resolveContact(c);
  const sub = c.subscriptions[0] ?? null;

  const activeSubscription: ClientSubscriptionInfo | null = sub
    ? {
        id: sub.id,
        servicePlanId: sub.serviceId,
        servicePlanName: sub.service.name,
        agreedRate: Number(sub.agreedRate),
        billingCycle: sub.billingCycle,
        inclusions: sub.service.inclusions,
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
    lead: c.lead,
    recentJobOrders: c.jobOrders.map(jo => ({
      id: jo.id,
      jobOrderNumber: jo.jobOrderNumber,
      status: jo.status,
      date: jo.date.toISOString(),
      items: jo.items.map(item => ({
        id: item.id,
        itemType: item.itemType,
        serviceName: item.serviceName,
        rate: Number(item.rate),
        total: Number(item.total),
      })),
    })),
  };
}

// ─── GET /api/sales/clients/[id] ──────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
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
          serviceId: true,
          agreedRate: true,
          billingCycle: true,
          service: {
            select: {
              name: true,
              inclusions: { select: { id: true, name: true, category: true } },
            },
          },
        },
        orderBy: { effectiveDate: 'desc' },
        take: 1,
      },
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          businessName: true,
        },
      },
      jobOrders: {
        select: {
          id: true,
          jobOrderNumber: true,
          status: true,
          date: true,
          items: {
            select: {
              id: true,
              itemType: true,
              serviceName: true,
              rate: true,
              total: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  return NextResponse.json({ data: serializeDetail(client as unknown as RawClient) });
}
