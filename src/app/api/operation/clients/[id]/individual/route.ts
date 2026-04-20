// src/app/api/operation/clients/[id]/individual/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const updateIndividualSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  dob: z.string().optional(),
  civilStatus: z.string().optional(),
  gender: z.string().optional(),
  citizenship: z.string().optional(),
  placeOfBirth: z.string().optional().nullable(),
  residentialAddress: z.string().optional().nullable(),
  prcLicenseNo: z.string().optional().nullable(),
  primaryIdType: z.string().optional().nullable(),
  primaryIdNumber: z.string().optional().nullable(),
  personalEmail: z.string().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  telephoneNumber: z.string().optional().nullable(),
  // Mother
  motherFirstName: z.string().optional().nullable(),
  motherMiddleName: z.string().optional().nullable(),
  motherLastName: z.string().optional().nullable(),
  // Father
  fatherFirstName: z.string().optional().nullable(),
  fatherMiddleName: z.string().optional().nullable(),
  fatherLastName: z.string().optional().nullable(),
  // Spouse
  spouseFirstName: z.string().optional().nullable(),
  spouseMiddleName: z.string().optional().nullable(),
  spouseLastName: z.string().optional().nullable(),
  spouseEmploymentStatus: z.string().optional().nullable(),
  spouseTin: z.string().optional().nullable(),
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
    const validatedData = updateIndividualSchema.parse(body);

    // Check client exists
    const existing = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true, individualDetails: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Update or create individual details
    const updated = existing.individualDetails
      ? await prisma.individualDetails.update({
          where: { clientId },
          data: validatedData,
        })
      : await prisma.individualDetails.create({
          data: {
            clientId,
            firstName: validatedData.firstName ?? '',
            lastName: validatedData.lastName ?? '',
            dob: validatedData.dob ?? '',
            civilStatus: validatedData.civilStatus ?? '',
            gender: validatedData.gender ?? '',
            citizenship: validatedData.citizenship ?? '',
            middleName: validatedData.middleName ?? null,
            placeOfBirth: validatedData.placeOfBirth ?? null,
            residentialAddress: validatedData.residentialAddress ?? null,
            prcLicenseNo: validatedData.prcLicenseNo ?? null,
            primaryIdType: validatedData.primaryIdType ?? null,
            primaryIdNumber: validatedData.primaryIdNumber ?? null,
            personalEmail: validatedData.personalEmail ?? null,
            mobileNumber: validatedData.mobileNumber ?? null,
            telephoneNumber: validatedData.telephoneNumber ?? null,
            motherFirstName: validatedData.motherFirstName ?? null,
            motherMiddleName: validatedData.motherMiddleName ?? null,
            motherLastName: validatedData.motherLastName ?? null,
            fatherFirstName: validatedData.fatherFirstName ?? null,
            fatherMiddleName: validatedData.fatherMiddleName ?? null,
            fatherLastName: validatedData.fatherLastName ?? null,
            spouseFirstName: validatedData.spouseFirstName ?? null,
            spouseMiddleName: validatedData.spouseMiddleName ?? null,
            spouseLastName: validatedData.spouseLastName ?? null,
          },
        });

    // Log activity
    void logActivity({
      userId: session.user.id,
      action: 'UPDATED',
      entity: 'Client',
      entityId: String(clientId),
      description: `Updated individual details for ${existing.businessName}`,
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
    console.error('[PATCH /api/operation/clients/[id]/individual]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
