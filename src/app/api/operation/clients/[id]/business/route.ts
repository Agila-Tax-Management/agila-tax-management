// src/app/api/operation/clients/[id]/business/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const updateBusinessSchema = z.object({
  tradeName: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  lineOfBusiness: z.string().optional().nullable(),
  psicCode: z.string().optional().nullable(),
  businessAreaSqm: z.string().optional().nullable(),
  noOfManagers: z.number().int().min(0).optional(),
  noOfSupervisors: z.number().int().min(0).optional(),
  noOfRankAndFile: z.number().int().min(0).optional(),
  landlineNumber: z.string().optional().nullable(),
  faxNumber: z.string().optional().nullable(),
  placeType: z.enum(['OWNED', 'RENTED', 'FREE_USE']).optional(),
  lessorName: z.string().optional().nullable(),
  lessorAddress: z.string().optional().nullable(),
  monthlyRent: z.string().optional().nullable(),
  isNotarized: z.boolean().optional(),
  hasDocStamp: z.boolean().optional(),
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
    const validatedData = updateBusinessSchema.parse(body);

    // Check client exists
    const existing = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true, businessDetails: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Upsert business details
    const updated = await prisma.businessOperations.upsert({
      where: { clientId },
      create: {
        clientId,
        ...validatedData,
      },
      update: validatedData,
    });

    // Log activity
    void logActivity({
      userId: session.user.id,
      action: 'UPDATED',
      entity: 'Client',
      entityId: clientId,
      description: `Updated business operations for ${existing.businessName}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[PATCH /api/operation/clients/[id]/business]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
