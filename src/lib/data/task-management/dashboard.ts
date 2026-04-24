// src/lib/data/task-management/dashboard.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

export interface DepartmentStats {
  departmentId: number;
  departmentName: string;
  total: number;
  active: number;
  done: number;
  overdue: number;
}

export interface StatusBreakdown {
  statusName: string;
  statusColor: string | null;
  count: number;
}

export interface TaskSummary {
  id: number;
  name: string;
  priority: string | null;
  dueDate: string | null;
  client: { id: number; businessName: string } | null;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
  department: { id: number; name: string } | null;
  status: { id: number; name: string; color: string | null } | null;
}

export interface TaskManagementDashboardData {
  stats: {
    total: number;
    active: number;
    done: number;
    overdue: number;
    urgent: number;
  };
  departmentStats: DepartmentStats[];
  statusBreakdown: StatusBreakdown[];
  overdueTasks: TaskSummary[];
  upcomingTasks: TaskSummary[];
}

/**
 * Aggregated task statistics for the Task Management dashboard.
 * Cached for 5 minutes — task statuses change frequently throughout the day.
 * @tag task-management-dashboard
 */
export async function getTaskManagementDashboard(): Promise<TaskManagementDashboardData> {
  'use cache';
  cacheLife('minutes');
  cacheTag('task-management-dashboard');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    total,
    statusGroups,
    departmentGroups,
    urgentCount,
    overdueTasksRaw,
    upcomingTasksRaw,
    exitStepStatuses,
  ] = await Promise.all([
    prisma.task.count(),
    prisma.task.groupBy({ by: ['statusId'], _count: { id: true } }),
    prisma.task.groupBy({ by: ['departmentId'], _count: { id: true } }),
    prisma.task.count({ where: { priority: 'URGENT', status: { isExitStep: false } } }),
    prisma.task.findMany({
      where: { dueDate: { lt: today }, status: { isExitStep: false } },
      select: {
        id: true, name: true, priority: true, dueDate: true,
        client: { select: { id: true, businessName: true } },
        department: { select: { id: true, name: true } },
        status: { select: { id: true, name: true, color: true, isExitStep: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 8,
    }),
    prisma.task.findMany({
      where: { dueDate: { gte: today }, status: { isExitStep: false } },
      select: {
        id: true, name: true, priority: true, dueDate: true,
        client: { select: { id: true, businessName: true } },
        department: { select: { id: true, name: true } },
        status: { select: { id: true, name: true, color: true, isExitStep: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 8,
    }),
    prisma.departmentTaskStatus.findMany({ where: { isExitStep: true }, select: { id: true } }),
  ]);

  const exitStepStatusIds = new Set(exitStepStatuses.map((s) => s.id));

  let done = 0;
  for (const group of statusGroups) {
    if (group.statusId && exitStepStatusIds.has(group.statusId)) {
      done += group._count.id;
    }
  }
  const active = total - done;

  const departmentIds = departmentGroups.map((g) => g.departmentId).filter(Boolean) as number[];
  const departments = await prisma.department.findMany({
    where: { id: { in: departmentIds } },
    select: { id: true, name: true },
  });
  const deptNameMap = new Map(departments.map((d) => [d.id, d.name]));

  const [deptDoneGroups, deptOverdueGroups] = await Promise.all([
    prisma.task.groupBy({
      by: ['departmentId'],
      where: { status: { isExitStep: true } },
      _count: { id: true },
    }),
    prisma.task.groupBy({
      by: ['departmentId'],
      where: { dueDate: { lt: today }, status: { isExitStep: false } },
      _count: { id: true },
    }),
  ]);

  const deptDoneMap = new Map(deptDoneGroups.map((g) => [g.departmentId, g._count.id]));
  const deptOverdueMap = new Map(deptOverdueGroups.map((g) => [g.departmentId, g._count.id]));

  const departmentStats: DepartmentStats[] = departmentGroups
    .filter((g) => g.departmentId !== null)
    .map((g) => {
      const deptId = g.departmentId!;
      const totalCount = g._count.id;
      const doneCount = deptDoneMap.get(deptId) ?? 0;
      return {
        departmentId: deptId,
        departmentName: deptNameMap.get(deptId) ?? 'Unknown',
        total: totalCount,
        active: totalCount - doneCount,
        done: doneCount,
        overdue: deptOverdueMap.get(deptId) ?? 0,
      };
    })
    .sort((a, b) => a.departmentName.localeCompare(b.departmentName));

  const statusIds = statusGroups.map((g) => g.statusId).filter(Boolean) as number[];
  const statuses = await prisma.departmentTaskStatus.findMany({
    where: { id: { in: statusIds } },
    select: { id: true, name: true, color: true },
  });
  const statusMap = new Map(statuses.map((s) => [s.id, { name: s.name, color: s.color }]));

  const statusBreakdown: StatusBreakdown[] = statusGroups
    .filter((g) => g.statusId !== null)
    .map((g) => {
      const sid = g.statusId!;
      const st = statusMap.get(sid);
      return { statusName: st?.name ?? 'Unknown', statusColor: st?.color ?? null, count: g._count.id };
    });

  const overdueTasks: TaskSummary[] = overdueTasksRaw.map((t) => ({
    id: t.id, name: t.name, priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    client: t.client, assignedTo: t.assignedTo, department: t.department, status: t.status,
  }));

  const upcomingTasks: TaskSummary[] = upcomingTasksRaw.map((t) => ({
    id: t.id, name: t.name, priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    client: t.client, assignedTo: t.assignedTo, department: t.department, status: t.status,
  }));

  return {
    stats: { total, active, done, overdue: overdueTasksRaw.length, urgent: urgentCount },
    departmentStats,
    statusBreakdown,
    overdueTasks,
    upcomingTasks,
  };
}
