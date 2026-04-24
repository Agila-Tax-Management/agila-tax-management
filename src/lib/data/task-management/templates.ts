// src/lib/data/task-management/templates.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

const templateInclude = {
  departmentRoutes: {
    orderBy: { routeOrder: 'asc' as const },
    include: {
      department: { select: { id: true, name: true } },
      subtasks: { orderBy: { subtaskOrder: 'asc' as const } },
    },
  },
  services: {
    include: {
      service: {
        select: {
          id: true,
          name: true,
          serviceRate: true,
          billingType: true,
          frequency: true,
          status: true,
        },
      },
    },
  },
} as const;

/**
 * Fetch all task templates with department routes and subtasks.
 * Cached for 1 hour — templates are configured infrequently by admins.
 * @tag task-templates
 */
export async function getTaskTemplates() {
  'use cache';
  cacheLife('hours');
  cacheTag('task-templates');

  const raw = await prisma.taskTemplate.findMany({
    orderBy: { id: 'asc' },
    include: templateInclude,
  });

  return raw.map(({ services, ...tpl }) => ({
    ...tpl,
    servicePlans: services
      .filter((l) => l.service.billingType === 'RECURRING')
      .map((l) => ({ ...l.service, serviceRate: Number(l.service.serviceRate) })),
    serviceOneTimePlans: services
      .filter((l) => l.service.billingType === 'ONE_TIME')
      .map((l) => ({ ...l.service, serviceRate: Number(l.service.serviceRate) })),
  }));
}

/**
 * Fetch a single task template by ID.
 * Cached for 1 hour — same change frequency as the full list.
 * @tag task-templates
 */
export async function getTaskTemplateById(templateId: number) {
  'use cache';
  cacheLife('hours');
  cacheTag('task-templates');

  const raw = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    include: templateInclude,
  });

  if (!raw) return null;

  const { services, ...rest } = raw;
  return {
    ...rest,
    servicePlans: services
      .filter((l) => l.service.billingType === 'RECURRING')
      .map((l) => ({ ...l.service, serviceRate: Number(l.service.serviceRate) })),
    serviceOneTimePlans: services
      .filter((l) => l.service.billingType === 'ONE_TIME')
      .map((l) => ({ ...l.service, serviceRate: Number(l.service.serviceRate) })),
  };
}
