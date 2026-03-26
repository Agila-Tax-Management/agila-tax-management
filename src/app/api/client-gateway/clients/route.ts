// src/app/api/client-gateway/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';

/**
 * GET /api/client-gateway/clients
 * Returns all clients in a lightweight list format for the Client Gateway module.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      createdAt: true,
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

  const data = clients.map((c) => ({
    id: c.id,
    companyCode: c.companyCode,
    clientNo: c.clientNo,
    businessName: c.businessName,
    portalName: c.portalName,
    businessEntity: c.businessEntity,
    branchType: c.branchType,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
    ownerName: c.userAssignments[0]?.clientUser.name ?? null,
    ownerEmail: c.userAssignments[0]?.clientUser.email ?? null,
  }));

  return NextResponse.json({ data });
}
