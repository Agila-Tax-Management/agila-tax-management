// src/app/api/notifications/unread-count/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * GET /api/notifications/unread-count
 * 
 * Returns the count of unread notifications for the authenticated user.
 * Optimized for badge display — only counts, doesn't fetch full records.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ data: { count } });
  } catch (err) {
    console.error('[GET /api/notifications/unread-count]', err);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
