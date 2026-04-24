// src/app/api/client-gateway/clients/[id]/branch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

type RouteContext = { params: Promise<{ id: string }> };

const branchSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  businessEntity: z.enum([
    'INDIVIDUAL',
    'SOLE_PROPRIETORSHIP',
    'PARTNERSHIP',
    'CORPORATION',
    'COOPERATIVE',
  ], { error: 'Business entity type is required' }),
  portalName: z.string().optional(),
});

/**
 * POST /api/client-gateway/clients/[id]/branch
 * Creates a new branch client under the given main-branch client.
 * - Auto-generates clientNo (YEAR-XXXX sequence)
 * - Auto-generates companyCode (same prefix, next suffix e.g. ACME-002)
 * - Copies all OWNER ClientUserAssignments from the main branch
 */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const parentId = parseInt(id, 10);
  if (isNaN(parentId)) return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = branchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    );
  }

  // Verify parent client exists and is a MAIN branch
  const parentClient = await prisma.client.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      businessName: true,
      companyCode: true,
      timezone: true,
      branchType: true,
      userAssignments: {
        where: { role: 'OWNER' },
        select: { clientUserId: true, role: true },
      },
    },
  });

  if (!parentClient) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (parentClient.branchType !== 'MAIN') {
    return NextResponse.json(
      { error: 'Only main branch clients can have branches added' },
      { status: 400 },
    );
  }

  const branchClient = await prisma.$transaction(async (tx) => {
    // 1. Generate unique clientNo (YEAR-XXXX)
    const year = new Date().getFullYear();
    const clientNoPrefix = `${year}-`;
    const latestClientNo = await tx.client.findFirst({
      where: { clientNo: { startsWith: clientNoPrefix } },
      orderBy: { clientNo: 'desc' },
      select: { clientNo: true },
    });
    let nextClientSeq = 1;
    if (latestClientNo?.clientNo) {
      const parts = latestClientNo.clientNo.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]!, 10);
      if (!isNaN(lastSeq)) nextClientSeq = lastSeq + 1;
    }
    const clientNo = `${clientNoPrefix}${String(nextClientSeq).padStart(4, '0')}`;

    // 2. Generate companyCode (e.g. ACME-002 from ACME-001)
    const codePrefix = parentClient.companyCode?.split('-')[0] ?? 'BRNCH';
    const allWithPrefix = await tx.client.findMany({
      where: { companyCode: { startsWith: `${codePrefix}-` } },
      select: { companyCode: true },
    });
    let maxCodeNum = 0;
    for (const c of allWithPrefix) {
      const parts = c.companyCode?.split('-') ?? [];
      const num = parseInt(parts[parts.length - 1]!, 10);
      if (!isNaN(num) && num > maxCodeNum) maxCodeNum = num;
    }
    const companyCode = `${codePrefix}-${String(maxCodeNum + 1).padStart(3, '0')}`;

    // 3. Generate unique portalName slug
    const baseSlug = parsed.data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    let portalName = parsed.data.portalName?.trim() || `${baseSlug}-branch`;
    const portalExists = await tx.client.findFirst({
      where: { portalName },
      select: { id: true },
    });
    if (portalExists) {
      portalName = `${portalName}-${String(maxCodeNum + 1).padStart(2, '0')}`;
    }

    // 4. Create branch client
    const newClient = await tx.client.create({
      data: {
        businessName: parsed.data.businessName,
        companyCode,
        clientNo,
        portalName,
        businessEntity: parsed.data.businessEntity,
        branchType: 'BRANCH',
        mainBranchId: parentId,
        timezone: parentClient.timezone,
        active: true,
      },
    });

    // 5. Copy OWNER assignments from parent branch to new branch
    if (parentClient.userAssignments.length > 0) {
      await tx.clientUserAssignment.createMany({
        data: parentClient.userAssignments.map((a) => ({
          clientId: newClient.id,
          clientUserId: a.clientUserId,
          role: a.role,
        })),
        skipDuplicates: true,
      });
    }

    return newClient;
  });

  // Invalidate relevant caches
  revalidateTag('client-gateway-clients', 'max');
  revalidateTag('admin-clients-settings-list', 'max');
  revalidateTag('hr-clients-list', 'max');

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'Client',
    entityId: String(branchClient.id),
    description: `Created branch client ${branchClient.businessName} (${branchClient.companyCode}) under ${parentClient.businessName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json(
    {
      data: {
        id: branchClient.id,
        businessName: branchClient.businessName,
        companyCode: branchClient.companyCode,
        clientNo: branchClient.clientNo,
        portalName: branchClient.portalName,
        branchType: branchClient.branchType,
        mainBranchId: branchClient.mainBranchId,
      },
    },
    { status: 201 },
  );
}
