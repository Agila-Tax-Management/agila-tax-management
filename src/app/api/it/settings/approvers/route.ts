// src/app/api/it/settings/approvers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const addSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * GET /api/it/settings/approvers
 * Returns the list of default access approvers.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const approvers = await prisma.itAccessApprover.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true, role: true } },
      addedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: approvers });
}

/**
 * POST /api/it/settings/approvers
 * Add a user as a default access approver.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  // Ensure user exists
  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Prevent duplicate
  const existing = await prisma.itAccessApprover.findUnique({ where: { userId: parsed.data.userId } });
  if (existing) return NextResponse.json({ error: 'User is already a default approver' }, { status: 409 });

  const approver = await prisma.itAccessApprover.create({
    data: {
      userId: parsed.data.userId,
      addedById: session.user.id,
    },
    select: {
      id: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true, role: true } },
      addedBy: { select: { id: true, name: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'ItAccessApprover',
    entityId: String(approver.id),
    description: `Added ${user.name} as a default access approver`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: approver }, { status: 201 });
}
