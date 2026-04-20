import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';

function isDoneStatus(name: string): boolean {
  return /done|complet|finish/.test(name.toLowerCase());
}

function isCancelledStatus(name: string): boolean {
  return /cancel|canceled|cancelled|reject|void/.test(name.toLowerCase());
}

function emptySidebarData() {
  return {
    dashboardBadge: 0,
    taskBoardBadge: 0,
    myTasksBadge: 0,
  };
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.LIAISON.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const liaisonDept = await prisma.department.findFirst({
    where: { clientId, name: 'Liaison' },
    select: { id: true },
  });

  if (!liaisonDept) {
    return NextResponse.json({ data: emptySidebarData() });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [allTasks, myTasks] = await Promise.all([
    prisma.task.findMany({
      where: { departmentId: liaisonDept.id },
      select: {
        dueDate: true,
        status: { select: { name: true } },
      },
    }),
    session.employee
      ? prisma.task.findMany({
          where: {
            departmentId: liaisonDept.id,
            assignedToId: session.employee.id,
          },
          select: {
            dueDate: true,
            status: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const taskBoardBadge = allTasks.filter((task) => !isDoneStatus(task.status?.name ?? '')).length;
  const myTasksBadge = myTasks.filter((task) => !isDoneStatus(task.status?.name ?? '')).length;
  const dashboardBadge = myTasks.filter((task) => {
    if (!task.dueDate) return false;
    const statusName = task.status?.name ?? '';
    if (isDoneStatus(statusName) || isCancelledStatus(statusName)) return false;

    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < todayStart;
  }).length;

  return NextResponse.json({
    data: {
      dashboardBadge,
      taskBoardBadge,
      myTasksBadge,
    },
  });
}