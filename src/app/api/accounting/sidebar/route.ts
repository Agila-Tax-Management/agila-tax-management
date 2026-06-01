// src/app/api/accounting/sidebar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!session.portalAccess.ACCOUNTING.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const unpaidCount = await prisma.invoice.count({
    where: {
      status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
  });

  return NextResponse.json({ data: { unpaidCount } });
}
