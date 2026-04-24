// src/lib/data/task-management/departments.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

/**
 * Fetch all task departments (with statuses) scoped to a client.
 * Cached for 1 hour — departments and statuses change infrequently.
 * Pass clientId so each client gets its own isolated cache entry.
 * @tag task-departments
 */
export async function getTaskDepartments(clientId: number) {
  'use cache';
  cacheLife('hours');
  cacheTag('task-departments');

  return prisma.department.findMany({
    where: { clientId },
    orderBy: { name: 'asc' },
    include: {
      statuses: { orderBy: { statusOrder: 'asc' } },
    },
  });
}
