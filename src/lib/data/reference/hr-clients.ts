// src/lib/data/reference/hr-clients.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

/**
 * Fetch all active clients for HR dropdowns and selection lists.
 * Cached for 1 hour — clients are created/archived infrequently.
 * @tag hr-clients-list
 */
export async function getHrClients() {
  'use cache';
  cacheLife('hours');
  cacheTag('hr-clients-list');

  return prisma.client.findMany({
    where: { active: true },
    orderBy: { businessName: 'asc' },
    select: { id: true, businessName: true, portalName: true, companyCode: true },
  });
}
