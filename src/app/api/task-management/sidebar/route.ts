// src/app/api/task-management/sidebar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';

function isDoneStatus(name: string): boolean {
  return /done|complet|finish/.test(name.toLowerCase());
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!session.portalAccess.TASK_MANAGEMENT.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const tasks = await prisma.task.findMany({
    where: { clientId },
    select: {
      departmentId: true,
      status: { select: { name: true } },
    },
  });

  const activeTasks = tasks.filter((t) => !isDoneStatus(t.status?.name ?? ''));

  const deptCounts: Record<number, number> = {};
  for (const t of activeTasks) {
    if (t.departmentId != null) {
      deptCounts[t.departmentId] = (deptCounts[t.departmentId] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    data: {
      totalActiveCount: activeTasks.length,
      deptCounts,
    },
  });
}
