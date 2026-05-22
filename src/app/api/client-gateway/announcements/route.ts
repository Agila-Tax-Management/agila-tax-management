// src/app/api/client-gateway/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import type { AnnouncementAudience, AnnouncementPriority } from '@/generated/prisma/client';

const createSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(255),
  content:     z.string().min(1, 'Content is required'),
  audience:    z.enum(['ALL_CLIENTS', 'ACTIVE_ONLY', 'VAT_CLIENTS', 'NON_VAT_CLIENTS']),
  priority:    z.enum(['NORMAL', 'HIGH', 'URGENT']),
  authorName:  z.string().min(1).max(100),
  isActive:    z.boolean().default(true),
  publishedAt: z.string().datetime().optional(),
  expiresAt:   z.string().datetime().nullable().optional(),
});

/**
 * GET /api/client-gateway/announcements
 * Returns all announcements for ATMS staff (no active filter — staff see all).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
  const skip     = (page - 1) * limit;
  const search   = searchParams.get('search')?.trim() ?? '';
  const priority = searchParams.get('priority') ?? '';
  const audience = searchParams.get('audience') ?? '';

  const where: Record<string, unknown> = {};
  if (search)   where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { content: { contains: search, mode: 'insensitive' } }];
  if (priority && priority !== 'All') where.priority = priority as AnnouncementPriority;
  if (audience && audience !== 'All') where.audience = audience as AnnouncementAudience;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        audience: true,
        priority: true,
        authorName: true,
        isActive: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.announcement.count({ where }),
  ]);

  return NextResponse.json({
    data: announcements,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/**
 * POST /api/client-gateway/announcements
 * Creates a new announcement.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }

  const { title, content, audience, priority, authorName, isActive, publishedAt, expiresAt } = parsed.data;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      audience,
      priority,
      authorName,
      authorId: session.user.id,
      isActive,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      expiresAt:   expiresAt ? new Date(expiresAt) : null,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'Announcement',
    entityId: announcement.id,
    description: `Created announcement: "${title}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: announcement }, { status: 201 });
}
