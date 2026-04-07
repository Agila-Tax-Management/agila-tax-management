// src/app/api/accounting/gl-accounts/account-types/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/accounting/gl-accounts/account-types
// Returns all AccountType records with their nested AccountDetailType options.
// Used to populate form dropdowns when creating/editing GL accounts.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const types = await prisma.accountType.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    include: {
      detailTypes: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      },
    },
    select: {
      id: true,
      name: true,
      group: true,
      normalBalance: true,
      detailTypes: true,
    },
  });

  return NextResponse.json({ data: types });
}
