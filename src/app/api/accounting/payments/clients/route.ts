// src/app/api/accounting/payments/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { ClientOnlyOption } from '@/types/accounting.types';

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
    select: { id: true, businessName: true, clientNo: true, active: true },
    orderBy: { businessName: 'asc' },
    take: 20,
  });

  const options: ClientOnlyOption[] = clients.map((c) => ({
    id: c.id,
    label: c.businessName + (!c.active ? ' (Inactive)' : ''),
    subLabel: c.clientNo ?? `#${c.id}`,
    businessName: c.businessName,
    clientNo: c.clientNo,
  }));

  return NextResponse.json({ data: options });
}
