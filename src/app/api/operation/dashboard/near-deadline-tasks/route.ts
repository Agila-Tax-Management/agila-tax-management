// src/app/api/operation/dashboard/near-deadline-tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import { getOperationNearDeadlineTasks } from '@/lib/data/operation/dashboard';

/**
 * GET /api/operation/dashboard/near-deadline-tasks
 * Returns tasks with due dates within the next 7 days
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getOperationNearDeadlineTasks();
  return NextResponse.json({ data });
}
