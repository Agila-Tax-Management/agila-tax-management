// src/app/api/hr/holidays/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const createHolidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['REGULAR', 'SPECIAL_NON_WORKING', 'SPECIAL_WORKING', 'LOCAL_HOLIDAY']),
});

/**
 * GET /api/hr/holidays
 * Returns all holidays for the client, filtered by optional year and/or type.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const type = searchParams.get('type');

  const validTypes = ['REGULAR', 'SPECIAL_NON_WORKING', 'SPECIAL_WORKING', 'LOCAL_HOLIDAY'] as const;
  type HolidayType = (typeof validTypes)[number];

  const holidays = await prisma.holiday.findMany({
    where: {
      clientId,
      ...(year
        ? {
            date: {
              gte: new Date(`${year}-01-01T00:00:00.000Z`),
              lte: new Date(`${year}-12-31T23:59:59.999Z`),
            },
          }
        : {}),
      ...(type && (validTypes as readonly string[]).includes(type)
        ? { type: type as HolidayType }
        : {}),
    },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json({ data: holidays });
}

/**
 * POST /api/hr/holidays
 * Creates a new holiday for the client. Validates uniqueness by date.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createHolidaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    );
  }

  const { name, date, type } = parsed.data;
  const holidayDate = new Date(`${date}T00:00:00.000Z`);

  const existing = await prisma.holiday.findFirst({
    where: { clientId, date: holidayDate },
  });
  if (existing) {
    return NextResponse.json(
      { error: `A holiday already exists on ${date}: "${existing.name}"` },
      { status: 409 },
    );
  }

  const holiday = await prisma.holiday.create({
    data: { clientId, name, date: holidayDate, type },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'Holiday',
    entityId: String(holiday.id),
    description: `Created holiday: ${name} on ${date} (${type})`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: holiday }, { status: 201 });
}
