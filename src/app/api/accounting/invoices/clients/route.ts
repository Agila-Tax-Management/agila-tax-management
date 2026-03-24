// src/app/api/accounting/invoices/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { ClientOption } from '@/types/accounting.types';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const search = (request.nextUrl.searchParams.get('search') ?? '').trim();

  const [clients, leads] = await Promise.all([
    prisma.client.findMany({
      where: search
        ? {
            OR: [
              { businessName: { contains: search, mode: 'insensitive' } },
              { clientNo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      select: { id: true, businessName: true, clientNo: true, businessEntity: true, active: true },
      orderBy: { businessName: 'asc' },
      take: 20,
    }),
    prisma.lead.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { businessName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        businessName: true,
        businessType: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const options: ClientOption[] = [
    ...clients.map((c) => ({
      type: 'client' as const,
      id: c.id,
      label: c.businessName + (!c.active ? ' (Inactive)' : ''),
      subLabel: c.clientNo ?? `#${c.id}`,
      fullName: c.businessName,
      businessName: c.businessName,
      businessType: c.businessEntity,
    })),
    ...leads.map((l) => {
      const fullName = [l.firstName, l.middleName, l.lastName].filter(Boolean).join(' ');
      return {
        type: 'lead' as const,
        id: l.id,
        label: fullName,
        subLabel: l.businessName ?? 'No business name',
        fullName,
        businessName: l.businessName,
        businessType: l.businessType !== 'Not Specified' ? l.businessType : null,
      };
    }),
  ];

  return NextResponse.json({ data: options });
}
