// src/app/api/operation/clients/[id]/bir/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  let body: {
    tin?: string | null;
    branchCode?: string | null;
    rdoCode?: string | null;
    registeredAddress?: string | null;
    zipCode?: string | null;
    contactNumber?: string | null;
    isWithholdingAgent?: boolean | null;
    withholdingCategory?: string | null;
    corUrl?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Upsert BIR information
    const birInfo = await prisma.birInformation.upsert({
      where: { clientId },
      create: {
        clientId,
        tin: body.tin ?? '',
        branchCode: body.branchCode ?? '0000',
        rdoCode: body.rdoCode ?? '',
        registeredAddress: body.registeredAddress ?? '',
        zipCode: body.zipCode ?? '',
        contactNumber: body.contactNumber,
        isWithholdingAgent: body.isWithholdingAgent ?? false,
        withholdingCategory: body.withholdingCategory,
        corUrl: body.corUrl,
      },
      update: {
        tin: body.tin,
        branchCode: body.branchCode,
        rdoCode: body.rdoCode,
        registeredAddress: body.registeredAddress,
        zipCode: body.zipCode,
        contactNumber: body.contactNumber,
        isWithholdingAgent: body.isWithholdingAgent,
        withholdingCategory: body.withholdingCategory,
        corUrl: body.corUrl,
      },
    });

    // Log activity
    void logActivity({
      userId: session.user.id,
      action: 'UPDATED',
      entity: 'BirInformation',
      entityId: birInfo.id,
      description: `Updated BIR information for client ${client.businessName}`,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ data: birInfo });
  } catch (error) {
    console.error('[PATCH /api/operation/clients/[id]/bir]', error);
    return NextResponse.json({ error: 'Failed to update BIR information' }, { status: 500 });
  }
}
