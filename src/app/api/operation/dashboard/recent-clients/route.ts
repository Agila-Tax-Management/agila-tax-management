// src/app/api/operation/dashboard/recent-clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';

/**
 * GET /api/operation/dashboard/recent-clients
 * Returns the 10 most recently onboarded clients with details
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const clients = await prisma.client.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        businessName: true,
        businessEntity: true,
        createdAt: true,
        operationsManagerId: true,
        operationsManager: {
          select: {
            id: true,
            name: true,
          },
        },
        clientRelationOfficerId: true,
        clientRelationOfficer: {
          select: {
            id: true,
            name: true,
          },
        },
        birInfo: {
          select: {
            tin: true,
          },
        },
      },
    });

    const data = clients.map((c) => ({
      id: c.id,
      businessName: c.businessName,
      businessEntity: c.businessEntity,
      tin: c.birInfo?.tin ?? null,
      operationsManager: c.operationsManager
        ? { id: c.operationsManager.id, name: c.operationsManager.name ?? 'N/A' }
        : null,
      accountOfficer: c.clientRelationOfficer
        ? { id: c.clientRelationOfficer.id, name: c.clientRelationOfficer.name ?? 'N/A' }
        : null,
      onboardedDate: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[GET /api/operation/dashboard/recent-clients]', err);
    return NextResponse.json(
      { error: 'Failed to fetch recent clients' },
      { status: 500 },
    );
  }
}
