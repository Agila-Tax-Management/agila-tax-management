// src/app/api/hr/holidays/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateHolidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  type: z.enum(['REGULAR', 'SPECIAL_NON_WORKING', 'SPECIAL_WORKING', 'LOCAL_HOLIDAY']).optional(),
});

/**
 * PATCH /api/hr/holidays/[id]
 * Updates a holiday record's name, date, or type.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { id } = await params;
  const holidayId = parseInt(id, 10);
  if (isNaN(holidayId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.holiday.findFirst({ where: { id: holidayId, clientId } });
  if (!existing) return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateHolidaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    );
  }

  const { name, date, type } = parsed.data;

  if (date) {
    const newDate = new Date(`${date}T00:00:00.000Z`);
    const duplicate = await prisma.holiday.findFirst({
      where: { clientId, date: newDate, NOT: { id: holidayId } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: `A holiday already exists on ${date}: "${duplicate.name}"` },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.holiday.update({
    where: { id: holidayId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(date !== undefined ? { date: new Date(`${date}T00:00:00.000Z`) } : {}),
      ...(type !== undefined ? { type } : {}),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'Holiday',
    entityId: String(holidayId),
    description: `Updated holiday: ${updated.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/hr/holidays/[id]
 * Permanently deletes a holiday record.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { id } = await params;
  const holidayId = parseInt(id, 10);
  if (isNaN(holidayId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.holiday.findFirst({ where: { id: holidayId, clientId } });
  if (!existing) return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });

  await prisma.holiday.delete({ where: { id: holidayId } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'Holiday',
    entityId: String(holidayId),
    description: `Deleted holiday: ${existing.name} (${existing.date.toISOString().slice(0, 10)})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: holidayId } });
}
