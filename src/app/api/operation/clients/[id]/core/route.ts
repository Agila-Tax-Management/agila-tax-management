// src/app/api/operation/clients/[id]/core/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const updateCoreSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').optional(),
  companyCode: z.string().optional().nullable(),
  portalName: z.string().min(1, 'Portal name is required').optional(),
  branchType: z.enum(['MAIN', 'BRANCH']).optional(),
  timezone: z.string().optional(),
  dayResetTime: z.string().optional(),
  workingDayStarts: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientId = parseInt(id, 10);

  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  // Auth check
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateCoreSchema.parse(body);

    // Check client exists
    const existing = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Update client
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: validatedData,
      select: {
        id: true,
        businessName: true,
        companyCode: true,
        portalName: true,
        branchType: true,
        timezone: true,
        dayResetTime: true,
        workingDayStarts: true,
      },
    });

    // Log activity
    void logActivity({
      userId: session.user.id,
      action: 'UPDATED',
      entity: 'Client',
      entityId: String(clientId),
      description: `Updated core info for ${updated.businessName}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[PATCH /api/operation/clients/[id]/core]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
