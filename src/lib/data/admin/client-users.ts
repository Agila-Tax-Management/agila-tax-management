// src/lib/data/admin/client-users.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

const CLIENT_USER_INCLUDE = {
  assignments: {
    include: {
      client: {
        select: {
          id: true,
          clientNo: true,
          businessName: true,
          companyCode: true,
          portalName: true,
          active: true,
        },
      },
    },
  },
} as const;

/**
 * Fetch client portal users, optionally filtered by assignment role.
 * Cached for 5 minutes.
 * @tag admin-client-users-list
 */
export async function getAdminClientUsers(roleFilter?: 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER') {
  'use cache';
  cacheLife('minutes');
  cacheTag('admin-client-users-list');

  const users = await prisma.clientUser.findMany({
    where: roleFilter
      ? { assignments: { some: { role: roleFilter } } }
      : undefined,
    orderBy: { createdAt: 'desc' },
    include: CLIENT_USER_INCLUDE,
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    active: u.active,
    status: u.status,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    assignments: u.assignments.map((a) => ({
      clientId: a.client.id,
      clientNo: a.client.clientNo,
      businessName: a.client.businessName,
      companyCode: a.client.companyCode,
      portalName: a.client.portalName,
      active: a.client.active,
      role: a.role,
    })),
  }));
}
