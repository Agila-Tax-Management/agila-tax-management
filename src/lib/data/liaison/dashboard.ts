// src/lib/data/liaison/dashboard.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

export type BadgeVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export type LiaisonDashboardData = {
  cards: {
    assignedTasks: number;
    inProgress: number;
    overdue: number;
  };
  statusOverview: Array<{ name: string; count: number; variant: BadgeVariant }>;
  upcomingDueTasks: Array<{
    id: number;
    name: string;
    clientName: string;
    statusName: string;
    statusVariant: BadgeVariant;
    dueDate: string;
    dueBadge: { variant: BadgeVariant; label: string };
  }>;
};

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

function buildDueBadge(daysRemaining: number): { variant: BadgeVariant; label: string } {
  if (daysRemaining < 0) {
    return {
      variant: 'danger',
      label: `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}`,
    };
  }
  if (daysRemaining <= 3) {
    return {
      variant: 'warning',
      label: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`,
    };
  }
  return {
    variant: 'success',
    label: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`,
  };
}

/**
 * Fetch the Liaison portal dashboard data for a specific employee.
 * Cached for ~5 minutes per employee.
 *
 * @param employeeId - The internal employee ID (used to filter assigned tasks)
 * @param clientId   - The client/firm ID (used to look up the Liaison department)
 * @tag liaison-dashboard
 * @tag liaison-dashboard-{employeeId}
 */
export async function getLiaisonDashboard(
  employeeId: number,
  clientId: number,
): Promise<LiaisonDashboardData> {
  'use cache';
  cacheLife('minutes');
  cacheTag('liaison-dashboard');
  cacheTag(`liaison-dashboard-${employeeId}`);

  const empty: LiaisonDashboardData = {
    cards: { assignedTasks: 0, inProgress: 0, overdue: 0 },
    statusOverview: [],
    upcomingDueTasks: [],
  };

  const liaisonDept = await prisma.department.findFirst({
    where: { clientId, name: 'Liaison' },
    include: { statuses: { orderBy: { statusOrder: 'asc' } } },
  });

  if (!liaisonDept) return empty;

  const tasks = await prisma.task.findMany({
    where: {
      departmentId: liaisonDept.id,
      assignedToId: employeeId,
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    include: {
      client: { select: { businessName: true } },
      status: { select: { name: true, color: true } },
    },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const inProgressCount = tasks.filter(
    (task) => isInProgressStatus(task.status?.name ?? ''),
  ).length;

  const overdueCount = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const statusName = task.status?.name ?? '';
    if (isDoneStatus(statusName) || isCancelledStatus(statusName)) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < todayStart;
  }).length;

  const statusOverview = liaisonDept.statuses.map((status) => ({
    name: status.name,
    count: tasks.filter((task) => task.status?.name === status.name).length,
    variant: statusVariant(status.name),
  }));

  const upcomingDueTasks = tasks
    .filter((task) => {
      const statusName = task.status?.name ?? '';
      return task.dueDate && !isDoneStatus(statusName) && !isCancelledStatus(statusName);
    })
    .map((task) => {
      const dueDate = new Date(task.dueDate as Date);
      dueDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil(
        (dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: task.id,
        name: task.name,
        clientName: task.client?.businessName ?? 'Unknown Client',
        statusName: task.status?.name ?? 'Unassigned Status',
        statusVariant: statusVariant(task.status?.name ?? 'Unassigned Status'),
        dueDate: (task.dueDate as Date).toISOString(),
        dueBadge: buildDueBadge(daysRemaining),
      };
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6);

  return {
    cards: {
      assignedTasks: tasks.length,
      inProgress: inProgressCount,
      overdue: overdueCount,
    },
    statusOverview,
    upcomingDueTasks,
  };
}
