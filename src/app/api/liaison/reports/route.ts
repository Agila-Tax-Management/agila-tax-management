import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';

type BadgeVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger';
type PeriodMode = 'day' | 'week' | 'month';

function parseDateInput(value: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function parseMonthInput(value: string | null): Date | null {
  if (!value) return null;
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return null;
  return new Date(year, month - 1, 1);
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const dayIndex = result.getDay();
  const diffToMonday = (dayIndex + 6) % 7;
  result.setDate(result.getDate() - diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function statusVariant(name: string): BadgeVariant {
  const lower = name.toLowerCase();
  if (/done|complet|finish/.test(lower)) return 'success';
  if (/progress|doing|active|ongoing/.test(lower)) return 'info';
  if (/review|pending|wait|hold|submit/.test(lower)) return 'warning';
  if (/cancel|block|reject|fail|overdue/.test(lower)) return 'danger';
  return 'neutral';
}

function isDoneStatus(name: string): boolean {
  return /done|complet|finish/.test(name.toLowerCase());
}

function isCancelledStatus(name: string): boolean {
  return /cancel|canceled|cancelled|reject|void/.test(name.toLowerCase());
}

function isInProgressStatus(name: string): boolean {
  return /progress|doing|active|ongoing/.test(name.toLowerCase());
}

function resolveRange(searchParams: URLSearchParams): { mode: PeriodMode; start: Date; end: Date } {
  const mode = (searchParams.get('mode') as PeriodMode | null) ?? 'day';
  const today = new Date();

  if (mode === 'week') {
    const anchor = parseDateInput(searchParams.get('date')) ?? today;
    return {
      mode,
      start: startOfWeek(anchor),
      end: endOfWeek(anchor),
    };
  }

  if (mode === 'month') {
    const month = parseMonthInput(searchParams.get('month')) ?? today;
    return {
      mode,
      start: startOfMonth(month),
      end: endOfMonth(month),
    };
  }

  const day = parseDateInput(searchParams.get('date')) ?? today;
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { mode: 'day', start, end };
}

function emptyReportData() {
  return {
    cards: {
      done: 0,
      inProgress: 0,
      delayed: 0,
      overdue: 0,
    },
    statusBreakdown: [] as Array<{
      name: string;
      count: number;
      percentage: number;
      color: string;
      variant: BadgeVariant;
    }>,
    employeeSummary: [] as Array<{
      id: number;
      name: string;
      done: number;
      inProgress: number;
      delayed: number;
      overdue: number;
      total: number;
    }>,
    tasks: [] as Array<{
      id: number;
      name: string;
      assigneeName: string;
      dueDate: string | null;
      statusName: string;
      statusColor: string;
      statusVariant: BadgeVariant;
    }>,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.LIAISON.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const liaisonDept = await prisma.department.findFirst({
    where: { clientId, name: 'Liaison' },
    include: {
      statuses: { orderBy: { statusOrder: 'asc' } },
    },
  });

  if (!liaisonDept) {
    return NextResponse.json({ data: emptyReportData() });
  }

  const range = resolveRange(request.nextUrl.searchParams);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [tasks, employees] = await Promise.all([
    prisma.task.findMany({
      where: {
        departmentId: liaisonDept.id,
        dueDate: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        status: { select: { name: true, color: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.employee.findMany({
      where: {
        softDelete: false,
        employments: {
          some: {
            clientId,
            departmentId: liaisonDept.id,
            employmentStatus: 'ACTIVE',
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
  ]);

  const doneCount = tasks.filter((task) => isDoneStatus(task.status?.name ?? '')).length;
  const inProgressCount = tasks.filter((task) => isInProgressStatus(task.status?.name ?? '')).length;
  const delayedCount = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const statusName = task.status?.name ?? '';
    if (isDoneStatus(statusName) || isCancelledStatus(statusName)) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === todayStart.getTime();
  }).length;
  const overdueCount = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const statusName = task.status?.name ?? '';
    if (isDoneStatus(statusName) || isCancelledStatus(statusName)) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < todayStart;
  }).length;

  const counts = new Map<string, number>();
  tasks.forEach((task) => {
    const statusName = task.status?.name ?? 'Unassigned Status';
    counts.set(statusName, (counts.get(statusName) ?? 0) + 1);
  });

  const knownStatuses = liaisonDept.statuses.map((status) => ({
    name: status.name,
    count: counts.get(status.name) ?? 0,
    color: status.color ?? '#64748b',
    variant: statusVariant(status.name),
  }));
  const knownNames = new Set(knownStatuses.map((status) => status.name));
  const unknownStatuses = Array.from(counts.entries())
    .filter(([name]) => !knownNames.has(name))
    .map(([name, count]) => ({
      name,
      count,
      color: '#64748b',
      variant: statusVariant(name),
    }));
  const totalCount = tasks.length;
  const statusBreakdown = [...knownStatuses, ...unknownStatuses].map((status) => ({
    ...status,
    percentage: totalCount === 0 ? 0 : (status.count / totalCount) * 100,
  }));

  const employeeSummary = employees.map((employee) => {
    const employeeTasks = tasks.filter((task) => task.assignedTo?.id === employee.id);

    const done = employeeTasks.filter((task) => isDoneStatus(task.status?.name ?? '')).length;
    const inProgress = employeeTasks.filter((task) => isInProgressStatus(task.status?.name ?? '')).length;
    const delayed = employeeTasks.filter((task) => {
      if (!task.dueDate) return false;
      const statusName = task.status?.name ?? '';
      if (isDoneStatus(statusName) || isCancelledStatus(statusName)) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === todayStart.getTime();
    }).length;
    const overdue = employeeTasks.filter((task) => {
      if (!task.dueDate) return false;
      const statusName = task.status?.name ?? '';
      if (isDoneStatus(statusName) || isCancelledStatus(statusName)) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < todayStart;
    }).length;

    return {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      done,
      inProgress,
      delayed,
      overdue,
      total: employeeTasks.length,
    };
  });

  const reportTasks = tasks.map((task) => ({
    id: task.id,
    name: task.name,
    assigneeName: task.assignedTo
      ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
      : 'Unassigned',
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    statusName: task.status?.name ?? 'Unassigned Status',
    statusColor: task.status?.color ?? '#64748b',
    statusVariant: statusVariant(task.status?.name ?? 'Unassigned Status'),
  }));

  return NextResponse.json({
    data: {
      cards: {
        done: doneCount,
        inProgress: inProgressCount,
        delayed: delayedCount,
        overdue: overdueCount,
      },
      statusBreakdown,
      employeeSummary,
      tasks: reportTasks,
    },
  });
}