// src/app/api/it/system-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const upsertSchema = z.object({
  systemName: z.string().min(1, 'System name is required'),
  status: z.enum(['OPERATIONAL', 'DEGRADED', 'OUTAGE', 'MAINTENANCE']),
  description: z.string().optional(),
});

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const entries = await prisma.itSystemStatusEntry.findMany({
    where: { clientId },
    include: { updatedBy: { select: { id: true, name: true } } },
    orderBy: { systemName: 'asc' },
  });

  return NextResponse.json({ data: entries });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body = await request.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const entry = await prisma.itSystemStatusEntry.upsert({
    where: { clientId_systemName: { clientId, systemName: parsed.data.systemName } },
    create: {
      clientId,
      systemName: parsed.data.systemName,
      status: parsed.data.status,
      description: parsed.data.description,
      updatedById: session.user.id,
    },
    update: {
      status: parsed.data.status,
      description: parsed.data.description,
      updatedById: session.user.id,
    },
    include: { updatedBy: { select: { id: true, name: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'ItSystemStatusEntry',
    entityId: String(entry.id),
    description: `Updated system status for ${entry.systemName}: ${entry.status}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: entry });
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
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  // Check for duplicate name
  const existing = await prisma.itSystemStatusEntry.findUnique({
    where: { clientId_systemName: { clientId, systemName: parsed.data.systemName } },
  });
  if (existing) {
    return NextResponse.json({ error: 'A system with this name already exists' }, { status: 409 });
  }

  const entry = await prisma.itSystemStatusEntry.create({
    data: {
      clientId,
      systemName: parsed.data.systemName,
      status: parsed.data.status,
      description: parsed.data.description,
      updatedById: session.user.id,
    },
    include: { updatedBy: { select: { id: true, name: true } } },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'ItSystemStatusEntry',
    entityId: String(entry.id),
    description: `Added system status entry: ${entry.systemName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
