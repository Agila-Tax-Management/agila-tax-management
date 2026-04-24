// src/app/api/operation/dashboard/recent-clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import { getOperationRecentClients } from '@/lib/data/operation/dashboard';

/**
 * GET /api/operation/dashboard/recent-clients
 * Returns the 10 most recently onboarded clients with details
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getOperationRecentClients();
  return NextResponse.json({ data });
}
