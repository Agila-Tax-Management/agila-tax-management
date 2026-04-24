// src/lib/data/auth/portal-access.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';
import type { AppPortal, PortalRole } from '@/generated/prisma/client';

const ALL_PORTALS: AppPortal[] = [
  'SALES',
  'COMPLIANCE',
  'LIAISON',
  'ACCOUNTING',
  'OPERATIONS_MANAGEMENT',
  'HR',
  'TASK_MANAGEMENT',
  'CLIENT_RELATIONS',
];

/**
 * Returns portal role assignments for a given user.
 * For SUPER_ADMIN / ADMIN, all portals are granted without a DB query.
 * For EMPLOYEE, reads EmployeeAppAccess records.
 *
 * Cached per user for 5 minutes.
 * @tag portal-access-{userId}
 */
export async function getPortalAccessForUser(
  userId: string,
  userRole: string,
): Promise<{ userId: string; userRole: string; portals: Array<{ portal: AppPortal; role: PortalRole }> }> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`portal-access-${userId}`);

  const portals: Array<{ portal: AppPortal; role: PortalRole }> = [];

  if (userRole === 'SUPER_ADMIN') {
    for (const portal of ALL_PORTALS) {
      portals.push({ portal, role: 'SETTINGS' });
    }
  } else if (userRole === 'ADMIN') {
    for (const portal of ALL_PORTALS) {
      portals.push({ portal, role: 'ADMIN' });
    }
  } else {
    // EMPLOYEE — look up EmployeeAppAccess
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: {
        appAccess: {
          select: {
            role: true,
            app: { select: { name: true } },
          },
        },
      },
    });

    if (employee) {
      for (const access of employee.appAccess) {
        if (access.role !== null) {
          portals.push({ portal: access.app.name as AppPortal, role: access.role as PortalRole });
        }
      }
    }
  }

  return { userId, userRole, portals };
}
