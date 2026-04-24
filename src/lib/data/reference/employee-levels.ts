// src/lib/data/reference/employee-levels.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

/**
 * Fetch all employee levels ordered by position ascending.
 * Cached for 1 day — rarely changes.
 * @tag employee-levels
 */
export async function getEmployeeLevels() {
  'use cache';
  cacheLife('days');
  cacheTag('employee-levels');

  return prisma.employeeLevel.findMany({
    orderBy: { position: 'asc' },
    select: { id: true, name: true, position: true, description: true },
  });
}
