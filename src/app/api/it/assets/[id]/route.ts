// src/app/api/it/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notify } from '@/lib/notification';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['LAPTOP', 'DESKTOP', 'MONITOR', 'PHONE', 'PRINTER', 'PERIPHERAL', 'NETWORKING', 'OTHER']).optional(),
  status: z.enum(['ACTIVE', 'IN_REPAIR', 'RETIRED', 'UNASSIGNED', 'DISPOSED']).optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  assignedToId: z.number().int().nullable().optional(),
  purchaseDate: z.string().datetime({ offset: true }).nullable().optional(),
  warrantyUntil: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const assetId = parseInt(id, 10);
  if (isNaN(assetId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { purchaseDate, warrantyUntil, ...rest } = parsed.data;

  const asset = await prisma.itAsset.update({
    where: { id: assetId },
    data: {
      ...rest,
      ...(purchaseDate !== undefined ? { purchaseDate: purchaseDate ? new Date(purchaseDate) : null } : {}),
      ...(warrantyUntil !== undefined ? { warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : null } : {}),
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'ItAsset',
    entityId: String(asset.id),
    description: `Updated IT asset ${asset.assetTag}`,
    ...getRequestMeta(request),
  });

  // Notify newly assigned employee when assignment changes
  if (parsed.data.assignedToId && parsed.data.assignedToId !== null) {
    const assignee = await prisma.employee.findUnique({
      where: { id: parsed.data.assignedToId },
      select: { userId: true },
    });
    if (assignee?.userId && assignee.userId !== session.user.id) {
      void notify({
        userId: assignee.userId,
        type: 'SYSTEM',
        priority: 'NORMAL',
        title: 'IT Asset Assigned',
        message: `Asset ${asset.assetTag} (${asset.name}) has been assigned to you.`,
        linkUrl: '/portal/it/assets',
      });
    }
  }

  return NextResponse.json({ data: asset });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canDelete) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const assetId = parseInt(id, 10);
  if (isNaN(assetId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  await prisma.itAsset.delete({ where: { id: assetId } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'ItAsset',
    entityId: id,
    description: `Deleted IT asset #${id}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}
