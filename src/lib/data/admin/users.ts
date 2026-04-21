// src/lib/data/admin/users.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';
import type { UserRecord } from '@/lib/schemas/user-management';

const USER_INCLUDE = {
  employee: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      employeeNo: true,
      phone: true,
      birthDate: true,
      gender: true,
      appAccess: {
        select: {
          role: true,
          app: { select: { name: true } },
        },
      },
      employments: {
        where: { employmentStatus: 'ACTIVE' as const },
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        select: {
          employmentType: true,
          employmentStatus: true,
          employeeLevel: { select: { id: true, name: true, position: true } },
          hireDate: true,
          department: { select: { name: true } },
          position: { select: { title: true } },
        },
      },
    },
  },
} as const;

/**
 * Fetch admin users list with employee + employment details.
 * Cached for 5 minutes.
 * @tag admin-users-list
 */
export async function getAdminUsers(page: number = 1, limit: number = 50): Promise<{
  data: UserRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  'use cache';
  cacheLife('minutes');
  cacheTag('admin-users-list');

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: USER_INCLUDE,
    }),
    prisma.user.count(),
  ]);

  const data: UserRecord[] = users.map((u) => {
    const emp = u.employee;
    const employment = emp?.employments?.[0] ?? null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      employee: emp
        ? {
            id: emp.id,
            firstName: emp.firstName,
            middleName: emp.middleName,
            lastName: emp.lastName,
            employeeNo: emp.employeeNo,
            phone: emp.phone,
            birthDate: emp.birthDate.toISOString(),
            gender: emp.gender,
            employment: employment
              ? {
                  department: employment.department?.name ?? null,
                  position: employment.position?.title ?? null,
                  employmentType: employment.employmentType,
                  employmentStatus: employment.employmentStatus,
                  employeeLevel: employment.employeeLevel?.name ?? null,
                  employeeLevelId: employment.employeeLevel?.id ?? null,
                  hireDate: employment.hireDate?.toISOString() ?? null,
                }
              : null,
          }
        : null,
      portalAccess: emp
        ? emp.appAccess.map((a) => ({
            portal: a.app.name,
            role: a.role as 'VIEWER' | 'USER' | 'ADMIN' | 'SETTINGS',
          }))
        : [],
    };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
