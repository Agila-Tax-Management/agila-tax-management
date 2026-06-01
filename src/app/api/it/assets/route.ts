// src/app/api/it/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notify } from '@/lib/notification';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['LAPTOP', 'DESKTOP', 'MONITOR', 'PHONE', 'PRINTER', 'PERIPHERAL', 'NETWORKING', 'OTHER']),
  status: z.enum(['ACTIVE', 'IN_REPAIR', 'RETIRED', 'UNASSIGNED', 'DISPOSED']).default('UNASSIGNED'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  assignedToId: z.number().int().optional(),
  purchaseDate: z.string().datetime({ offset: true }).optional(),
  warrantyUntil: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
});

async function getNextAssetTag(): Promise<string> {
  const latest = await prisma.itAsset.findFirst({
    orderBy: { assetTag: 'desc' },
    select: { assetTag: true },
  });
  let nextSeq = 1;
  if (latest?.assetTag) {
    const parts = latest.assetTag.split('-');
    const last = parseInt(parts[parts.length - 1]!, 10);
    if (!isNaN(last)) nextSeq = last + 1;
  }
  return `ASSET-${String(nextSeq).padStart(4, '0')}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') ?? '';
  const type = searchParams.get('type') ?? '';
  const search = searchParams.get('search') ?? '';

  const assets = await prisma.itAsset.findMany({
    where: {
      clientId,
      ...(status ? { status: status as never } : {}),
      ...(type ? { type: type as never } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { assetTag: { contains: search, mode: 'insensitive' } },
          { serialNumber: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: assets });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const assetTag = await getNextAssetTag();

  const asset = await prisma.itAsset.create({
    data: {
      assetTag,
      clientId,
      name: parsed.data.name,
      type: parsed.data.type,
      status: parsed.data.status,
      brand: parsed.data.brand,
      model: parsed.data.model,
      serialNumber: parsed.data.serialNumber,
      assignedToId: parsed.data.assignedToId,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : undefined,
      warrantyUntil: parsed.data.warrantyUntil ? new Date(parsed.data.warrantyUntil) : undefined,
      notes: parsed.data.notes,
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'ItAsset',
    entityId: String(asset.id),
    description: `Registered IT asset ${asset.assetTag}: ${asset.name}`,
    ...getRequestMeta(request),
  });

  // Notify the assigned employee (if any)
  if (parsed.data.assignedToId) {
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

  return NextResponse.json({ data: asset }, { status: 201 });
}
