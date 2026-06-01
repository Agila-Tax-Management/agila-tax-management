// src/app/api/it/sidebar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const [openTickets, pendingAccessRequests] = await Promise.all([
    prisma.itTicket.count({
      where: { clientId, status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING_INFO'] } },
    }),
    prisma.itPortalAccessRequest.count({
      where: { clientId, status: 'PENDING' },
    }),
  ]);

  return NextResponse.json({ data: { openTickets, pendingAccessRequests } });
}
