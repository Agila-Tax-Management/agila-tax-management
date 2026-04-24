// src/lib/data/account-officer/dashboard.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

type DbPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type StatusSummary = {
  name: string;
  count: number;
  color: string;
};

export type OverdueTask = {
  id: number;
  title: string;
  clientName: string;
  dueDate: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
};

export type UpcomingTask = {
  id: number;
  title: string;
  clientName: string;
  assigneeName: string;
  dueDate: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
};

export type RecentActivityLog = {
  id: string;
  actorName: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGE' | 'ASSIGNED' | 'UNASSIGNED';
  entity: string;
  description: string;
  createdAt: string;
  clientName: string;
};

export type AODashboardCached = {
  cards: {
    totalTasks: number;
    doneCount: number;
    inProgressCount: number;
    completionRate: number;
    activeClients: number;
    totalClients: number;
  };
  statusBreakdown: StatusSummary[];
  overdueTasks: OverdueTask[];
  upcomingTasks: UpcomingTask[];
  recentActivityLogs: RecentActivityLog[];
};

function toPriorityLabel(priority: DbPriority): 'Low' | 'Medium' | 'High' | 'Urgent' {
  if (priority === 'LOW') return 'Low';
  if (priority === 'HIGH') return 'High';
  if (priority === 'URGENT') return 'Urgent';
  return 'Medium';
}

function isProgressLikeStatus(name: string): boolean {
  return /progress|doing|active|ongoing|review|pending|wait|hold/i.test(name);
}

/**
 * Fetch the Account Officer dashboard data for a specific user/client.
 * Excludes unreadNotifications (real-time) — that is fetched inline in the route handler.
 * Cached for ~5 minutes per user.
 *
 * @param userId   - The user ID (for assigned clients counts)
 * @param clientId - The client/firm ID (for AO department lookup)
 * @tag ao-dashboard
 * @tag ao-dashboard-{userId}
 */
export async function getAODashboard(
  userId: string,
  clientId: number,
): Promise<AODashboardCached> {
  'use cache';
  cacheLife('minutes');
  cacheTag('ao-dashboard');
  cacheTag(`ao-dashboard-${userId}`);

  const aoDept = await prisma.department.findFirst({
    where: {
      clientId,
      OR: [
        { name: { contains: 'account officer', mode: 'insensitive' } },
        { name: { contains: 'client relation', mode: 'insensitive' } },
      ],
    },
    include: { statuses: { orderBy: { statusOrder: 'asc' } } },
  });

  const tasks = aoDept
    ? await prisma.task.findMany({
        where: { departmentId: aoDept.id },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          client: { select: { businessName: true } },
          status: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      })
    : [];

  const [assignedClients, assignedClientsTotal] = await Promise.all([
    prisma.client.count({
      where: { clientRelationOfficerId: userId, active: true },
    }),
    prisma.client.count({
      where: { clientRelationOfficerId: userId },
    }),
  ]);

  const statusMap = new Map<
    number,
    { name: string; color: string; count: number; isExitStep: boolean }
  >();
  for (const s of aoDept?.statuses ?? []) {
    statusMap.set(s.id, {
      name: s.name,
      color: s.color ?? '#64748b',
      count: 0,
      isExitStep: s.isExitStep,
    });
  }

  let doneCount = 0;
  let inProgressCount = 0;

  for (const task of tasks) {
    const statusName = task.status?.name ?? 'Uncategorized';
    const statusColor = task.status?.color ?? '#64748b';
    const isExitStep =
      task.status?.id
        ? (statusMap.get(task.status.id)?.isExitStep ?? false)
        : /done|complet|finish/i.test(statusName);

    if (task.status?.id && statusMap.has(task.status.id)) {
      statusMap.get(task.status.id)!.count += 1;
    } else {
      const syntheticKey = -(
        Math.abs(
          statusName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0),
        ) + 1
      );
      const existing = statusMap.get(syntheticKey);
      if (existing) {
        existing.count += 1;
      } else {
        statusMap.set(syntheticKey, { name: statusName, color: statusColor, count: 1, isExitStep });
      }
    }

    if (isExitStep) doneCount += 1;
    else if (isProgressLikeStatus(statusName)) inProgressCount += 1;
  }

  if (inProgressCount === 0) {
    inProgressCount = Math.max(0, tasks.length - doneCount);
  }

  const statusBreakdown: StatusSummary[] = Array.from(statusMap.values())
    .filter((s) => s.count > 0)
    .map((s) => ({ name: s.name, count: s.count, color: s.color }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks: OverdueTask[] = tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      const statusName = task.status?.name ?? '';
      const isExit =
        task.status?.id
          ? (statusMap.get(task.status.id)?.isExitStep ?? false)
          : /done|complet|finish/i.test(statusName);
      if (isExit) return false;
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    })
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.name,
      clientName: task.client?.businessName ?? 'Unknown',
      dueDate: task.dueDate?.toISOString() ?? null,
      priority: toPriorityLabel(task.priority),
    }));

  const upcomingTasks: UpcomingTask[] = tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      const statusName = task.status?.name ?? '';
      const isExit =
        task.status?.id
          ? (statusMap.get(task.status.id)?.isExitStep ?? false)
          : /done|complet|finish/i.test(statusName);
      if (isExit) return false;
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due >= today;
    })
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.name,
      clientName: task.client?.businessName ?? 'Unknown',
      assigneeName: task.assignedTo
        ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
        : 'Unassigned',
      dueDate: task.dueDate?.toISOString() ?? null,
      priority: toPriorityLabel(task.priority),
    }));

  const completionRate =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const boardTaskIds = tasks.map((task) => task.id);
  const boardTaskClientMap = new Map(
    tasks.map((task) => [task.id, task.client?.businessName ?? 'Unknown']),
  );

  const boardSubtasks =
    boardTaskIds.length > 0
      ? await prisma.taskSubtask.findMany({
          where: { parentTaskId: { in: boardTaskIds } },
          select: { id: true, parentTaskId: true },
        })
      : [];

  const boardSubtaskIdSet = new Set(boardSubtasks.map((s) => s.id));
  const boardSubtaskTaskMap = new Map(
    boardSubtasks.map((s) => [s.id, s.parentTaskId]),
  );

  const rawLogs =
    boardTaskIds.length > 0
      ? await prisma.activityLog.findMany({
          where: {
            entity: { in: ['Task', 'TaskSubtask'] },
            action: {
              in: [
                'CREATED',
                'UPDATED',
                'DELETED',
                'STATUS_CHANGE',
                'ASSIGNED',
                'UNASSIGNED',
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: { user: { select: { name: true } } },
        })
      : [];

  const recentActivityLogs: RecentActivityLog[] = rawLogs
    .map((log) => {
      const entityIdNum = log.entityId ? Number(log.entityId) : NaN;
      if (Number.isNaN(entityIdNum)) return null;

      let taskIdForLog: number | null = null;
      if (log.entity === 'Task' && boardTaskIds.includes(entityIdNum)) {
        taskIdForLog = entityIdNum;
      }
      if (log.entity === 'TaskSubtask' && boardSubtaskIdSet.has(entityIdNum)) {
        taskIdForLog = boardSubtaskTaskMap.get(entityIdNum) ?? null;
      }
      if (!taskIdForLog) return null;

      return {
        id: log.id,
        actorName: log.user?.name ?? (log.isSystemAction ? 'System' : 'Unknown User'),
        action: log.action as RecentActivityLog['action'],
        entity: log.entity,
        description: log.description,
        createdAt: log.createdAt.toISOString(),
        clientName: boardTaskClientMap.get(taskIdForLog) ?? 'Unknown',
      };
    })
    .filter((log): log is RecentActivityLog => log !== null)
    .slice(0, 6);

  return {
    cards: {
      totalTasks: tasks.length,
      doneCount,
      inProgressCount,
      completionRate,
      activeClients: assignedClients,
      totalClients: assignedClientsTotal,
    },
    statusBreakdown,
    overdueTasks,
    upcomingTasks,
    recentActivityLogs,
  };
}
