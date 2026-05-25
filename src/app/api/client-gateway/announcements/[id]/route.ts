// src/app/api/client-gateway/announcements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  content:     z.string().min(1).optional(),
  audience:    z.enum(['ALL_CLIENTS', 'ACTIVE_ONLY', 'VAT_CLIENTS', 'NON_VAT_CLIENTS']).optional(),
  priority:    z.enum(['NORMAL', 'HIGH', 'URGENT']).optional(),
  authorName:  z.string().min(1).max(100).optional(),
  isActive:    z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  expiresAt:   z.string().datetime().nullable().optional(),
});

/**
 * PATCH /api/client-gateway/announcements/[id]
 * Partially updates an announcement.
 */
export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }

  const { publishedAt, expiresAt, ...rest } = parsed.data;

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...rest,
      ...(publishedAt !== undefined ? { publishedAt: new Date(publishedAt) } : {}),
      ...(expiresAt !== undefined   ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'Announcement',
    entityId: id,
    description: `Updated announcement: "${updated.title}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/client-gateway/announcements/[id]
 * Permanently deletes an announcement.
 */
export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const existing = await prisma.announcement.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!existing) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });

  await prisma.announcement.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'Announcement',
    entityId: id,
    description: `Deleted announcement: "${existing.title}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id } });
}
