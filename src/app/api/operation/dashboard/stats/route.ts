// src/app/api/operation/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import { getOperationStats } from '@/lib/data/operation/dashboard';

/**
 * GET /api/operation/dashboard/stats
 * Returns dashboard statistics for Operations Portal
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getOperationStats();
  return NextResponse.json({ data });
}
