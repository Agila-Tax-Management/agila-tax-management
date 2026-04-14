// src/app/api/operation/clients/[id]/corporate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const updateCorporateSchema = z.object({
  secRegistrationNo: z.string().optional().nullable(),
  acronym: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  companyClassification: z.string().optional().nullable(),
  companySubclass: z.string().optional().nullable(),
  dateOfIncorporation: z.string().optional().nullable(),
  termOfExistence: z.string().optional().nullable(),
  primaryPurpose: z.string().optional().nullable(),
  annualMeetingDate: z.string().optional().nullable(),
  numberOfIncorporators: z.number().int().min(0).optional().nullable(),
  authorizedCapital: z.string().optional().nullable(),
  subscribedCapital: z.string().optional().nullable(),
  paidUpCapital: z.string().optional().nullable(),
  // President
  presidentFirstName: z.string().optional().nullable(),
  presidentMiddleName: z.string().optional().nullable(),
  presidentLastName: z.string().optional().nullable(),
  presidentTin: z.string().optional().nullable(),
  presidentEmail: z.string().optional().nullable(),
  // Treasurer
  treasurerFirstName: z.string().optional().nullable(),
  treasurerMiddleName: z.string().optional().nullable(),
  treasurerLastName: z.string().optional().nullable(),
  treasurerTin: z.string().optional().nullable(),
  treasurerEmail: z.string().optional().nullable(),
  // Secretary
  secretaryFirstName: z.string().optional().nullable(),
  secretaryMiddleName: z.string().optional().nullable(),
  secretaryLastName: z.string().optional().nullable(),
  secretaryTin: z.string().optional().nullable(),
  secretaryEmail: z.string().optional().nullable(),
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
    const validatedData = updateCorporateSchema.parse(body);

    // Check client exists
    const existing = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true, corporateDetails: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Upsert corporate details
    const updated = await prisma.corporateDetails.upsert({
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
      description: `Updated corporate details for ${existing.businessName}`,
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
    console.error('[PATCH /api/operation/clients/[id]/corporate]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
