// src/app/api/notifications/clear-all/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { revalidateTag, revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * DELETE /api/notifications/clear-all
 * 
 * Delete all read notifications for the authenticated user.
 * Keeps unread notifications intact.
 */
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        isRead: true,
      },
    });

    // Invalidate notification caches
    revalidateTag(`notifications-user-${session.user.id}`, "max");
    revalidateTag(`notifications-unread-user-${session.user.id}`, "max");
    revalidatePath('/dashboard/notifications');

    return NextResponse.json({ data: { count: result.count } });
  } catch (err) {
    console.error('[DELETE /api/notifications/clear-all]', err);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
