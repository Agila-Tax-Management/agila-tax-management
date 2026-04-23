// src/app/api/liaison/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';
import { getLiaisonDashboard } from '@/lib/data/liaison/dashboard';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.LIAISON.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  if (!session.employee) {
    return NextResponse.json({
      data: { cards: { assignedTasks: 0, inProgress: 0, overdue: 0 }, statusOverview: [], upcomingDueTasks: [] },
    });
  }

  const data = await getLiaisonDashboard(session.employee.id, clientId);
  return NextResponse.json({ data });
}