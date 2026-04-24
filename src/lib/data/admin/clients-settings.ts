// src/lib/data/admin/clients-settings.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

/**
 * Fetch all clients for the settings management page.
 * Cached for 5 minutes.
 * @tag admin-clients-settings-list
 */
export async function getAdminSettingsClients() {
  'use cache';
  cacheLife('minutes');
  cacheTag('admin-clients-settings-list');

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      companyCode: true,
      clientNo: true,
      businessName: true,
      portalName: true,
      businessEntity: true,
      branchType: true,
      active: true,
      timezone: true,
      createdAt: true,
      userAssignments: {
        include: {
          clientUser: {
            select: { id: true, name: true, email: true, status: true },
          },
        },
      },
    },
  });

  return clients.map((c) => {
    const ownerAssignment = c.userAssignments.find((a) => a.role === 'OWNER');
    return {
      id: c.id,
      companyCode: c.companyCode,
      clientNo: c.clientNo,
      businessName: c.businessName,
      portalName: c.portalName,
      businessEntity: c.businessEntity,
      branchType: c.branchType,
      active: c.active,
      timezone: c.timezone,
      createdAt: c.createdAt?.toISOString() ?? null,
      owner: ownerAssignment
        ? {
            id: ownerAssignment.clientUser.id,
            name: ownerAssignment.clientUser.name,
            email: ownerAssignment.clientUser.email,
            status: ownerAssignment.clientUser.status,
          }
        : null,
      userCount: c.userAssignments.length,
    };
  });
}
