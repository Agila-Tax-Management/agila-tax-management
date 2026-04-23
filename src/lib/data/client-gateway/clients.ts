// src/lib/data/client-gateway/clients.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

/**
 * Fetch all clients for the Client Gateway module.
 * Cached for 5 minutes.
 * @tag client-gateway-clients
 */
export async function getClientGatewayClients() {
  'use cache';
  cacheLife('minutes');
  cacheTag('client-gateway-clients');

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
      mainBranchId: true,
      active: true,
      createdAt: true,
      mainBranch: {
        select: { businessName: true },
      },
      userAssignments: {
        where: { role: 'OWNER' },
        take: 1,
        select: {
          clientUser: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  return clients.map((c) => ({
    id: c.id,
    companyCode: c.companyCode,
    clientNo: c.clientNo,
    businessName: c.businessName,
    portalName: c.portalName,
    businessEntity: c.businessEntity,
    branchType: c.branchType,
    mainBranchId: c.mainBranchId,
    mainBranchName: c.mainBranch?.businessName ?? null,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
    ownerName: c.userAssignments[0]?.clientUser.name ?? null,
    ownerEmail: c.userAssignments[0]?.clientUser.email ?? null,
  }));
}
