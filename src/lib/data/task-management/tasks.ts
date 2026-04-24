// src/lib/data/task-management/tasks.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

const taskInclude = {
  client: { select: { id: true, businessName: true } },
  template: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  status: { select: { id: true, name: true, color: true } },
  assignedTo: {
    select: { id: true, firstName: true, lastName: true, employeeNo: true },
  },
  jobOrder: { select: { id: true, jobOrderNumber: true } },
  subtasks: {
    orderBy: { order: 'asc' as const },
    include: {
      department: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} as const;

export interface TaskListFilters {
  departmentId?: number;
  statusId?: number;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  clientId?: number;
  assignedToId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch paginated task list with optional filters.
 * Cached for 5 minutes — tasks change frequently.
 * Each unique filter combination gets its own cache entry.
 * @tag tasks-list
 */
export async function getTasks(filters: TaskListFilters = {}) {
  'use cache';
  cacheLife('minutes');
  cacheTag('tasks-list');

  const {
    departmentId,
    statusId,
    priority,
    clientId,
    assignedToId,
    search,
    page = 1,
    limit = 50,
  } = filters;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    ...(departmentId ? { departmentId } : {}),
    ...(statusId ? { statusId } : {}),
    ...(priority ? { priority } : {}),
    ...(clientId ? { clientId } : {}),
    ...(assignedToId ? { assignedToId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: taskInclude,
      skip,
      take: safeLimit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}
