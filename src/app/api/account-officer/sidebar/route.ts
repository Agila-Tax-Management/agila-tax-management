// src/app/api/account-officer/sidebar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';

function isDoneStatus(name: string): boolean {
  return /done|complet|finish/.test(name.toLowerCase());
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!session.portalAccess.CLIENT_RELATIONS.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const aoDept = await prisma.department.findFirst({
    where: {
      clientId,
      OR: [
        { name: { contains: 'account officer', mode: 'insensitive' } },
        { name: { contains: 'client relation', mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });

  if (!aoDept) return NextResponse.json({ data: { openTasksCount: 0 } });

  const tasks = await prisma.task.findMany({
    where: { departmentId: aoDept.id },
    select: { status: { select: { name: true } } },
  });

  const openTasksCount = tasks.filter(
    (t) => !isDoneStatus(t.status?.name ?? ''),
  ).length;

  return NextResponse.json({ data: { openTasksCount } });
}
