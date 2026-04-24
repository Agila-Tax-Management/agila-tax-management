// src/lib/data/operation/dashboard.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

export type OperationStats = {
  activeClients: number;
  tasksNearDeadline: number;
  overdueTasks: number;
  newClientsThisMonth: number;
};

export type OperationRecentClient = {
  id: number;
  businessName: string;
  businessEntity: string;
  tin: string | null;
  operationsManager: { id: string; name: string } | null;
  accountOfficer: { id: string; name: string } | null;
  onboardedDate: string;
};

export type OperationNearDeadlineTask = {
  id: number;
  name: string;
  dueDate: string | null;
  priority: string;
  status: { name: string; color: string | null } | null;
  client: { id: number; businessName: string } | null;
  assignedTo: { id: number; name: string } | null;
  department: string | null;
};

/**
 * Fetch aggregate statistics for the Operations portal dashboard.
 * Shared across all users — cached for ~5 minutes.
 *
 * @tag operation-dashboard
 */
export async function getOperationStats(): Promise<OperationStats> {
  'use cache';
  cacheLife('minutes');
  cacheTag('operation-dashboard');

  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeClients, tasksNearDeadline, overdueTasks, newClientsThisMonth] =
    await Promise.all([
      prisma.client.count({ where: { active: true } }),
      prisma.task.count({
        where: {
          dueDate: { gte: now, lte: sevenDaysFromNow },
          statusId: { not: null },
        },
      }),
      prisma.task.count({
        where: {
          dueDate: { lt: now },
          statusId: { not: null },
        },
      }),
      prisma.client.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
    ]);

  return { activeClients, tasksNearDeadline, overdueTasks, newClientsThisMonth };
}

/**
 * Fetch the 10 most recently onboarded active clients for the Operations dashboard.
 * Cached for ~5 minutes.
 *
 * @tag operation-dashboard
 */
export async function getOperationRecentClients(): Promise<OperationRecentClient[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('operation-dashboard');

  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      businessName: true,
      businessEntity: true,
      createdAt: true,
      operationsManager: { select: { id: true, name: true } },
      clientRelationOfficer: { select: { id: true, name: true } },
      birInfo: { select: { tin: true } },
    },
  });

  return clients.map((c) => ({
    id: c.id,
    businessName: c.businessName,
    businessEntity: c.businessEntity,
    tin: c.birInfo?.tin ?? null,
    operationsManager: c.operationsManager
      ? { id: c.operationsManager.id, name: c.operationsManager.name ?? 'N/A' }
      : null,
    accountOfficer: c.clientRelationOfficer
      ? { id: c.clientRelationOfficer.id, name: c.clientRelationOfficer.name ?? 'N/A' }
      : null,
    onboardedDate: c.createdAt.toISOString(),
  }));
}

/**
 * Fetch tasks with due dates within the next 7 days for the Operations dashboard.
 * Cached for ~5 minutes.
 *
 * @tag operation-dashboard
 */
export async function getOperationNearDeadlineTasks(): Promise<OperationNearDeadlineTask[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('operation-dashboard');

  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const tasks = await prisma.task.findMany({
    where: { dueDate: { gte: now, lte: sevenDaysFromNow } },
    orderBy: { dueDate: 'asc' },
    take: 10,
    select: {
      id: true,
      name: true,
      dueDate: true,
      priority: true,
      client: { select: { id: true, businessName: true } },
      assignedTo: { select: { id: true, user: { select: { name: true } } } },
      department: { select: { name: true } },
      status: { select: { name: true, color: true } },
    },
  });

  return tasks.map((task) => ({
    id: task.id,
    name: task.name,
    dueDate: task.dueDate?.toISOString() ?? null,
    priority: task.priority,
    status: task.status
      ? { name: task.status.name, color: task.status.color ?? null }
      : null,
    client: task.client
      ? { id: task.client.id, businessName: task.client.businessName }
      : null,
    assignedTo: task.assignedTo?.user
      ? { id: task.assignedTo.id, name: task.assignedTo.user.name ?? 'N/A' }
      : null,
    department: task.department?.name ?? null,
  }));
}
