// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { z } from "zod";
import { updateTag } from 'next/cache';
import { revalidatePath } from 'next/cache';
import type { NotificationType, NotificationPriority } from "@/generated/prisma/client";
import { getNotifications } from '@/lib/data/users/notifications';
import prisma from "@/lib/db";

/**
 * GET /api/notifications
 *
 * Returns the authenticated user's notifications (paginated, newest first).
 * Cached for 1 minute, invalidated on any notification mutation.
 *
 * Query params:
 *  - page     (default: 1)
 *  - limit    (default: 20, max: 50)
 *  - unread   ("true" to show only unread)
 */
export async function GET(request: NextRequest) {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const unreadOnly = searchParams.get("unread") === "true";
  const typeFilter = searchParams.get("type") as NotificationType | null;
  const priorityFilter = searchParams.get("priority") as NotificationPriority | null;

  // Use cached data-fetching function
  const result = await getNotifications({
    userId: session.user.id,
    page,
    limit,
    unreadOnly,
    typeFilter,
    priorityFilter,
  });

  return NextResponse.json({
    data: result.notifications,
    unreadCount: result.unreadCount,
    pagination: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.total,
      totalPages: result.pagination.totalPages,
    },
  });
}

/**
 * PATCH /api/notifications
 *
 * Mark notifications as read.
 *
 * Body options:
 *  - { ids: string[] }   — mark specific notifications as read
 *  - { all: true }       — mark ALL of the user's notifications as read
 */
const markReadSchema = z.union([
  z.object({ ids: z.array(z.string().min(1)).min(1) }),
  z.object({ all: z.literal(true) }),
]);

export async function PATCH(request: NextRequest) {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = markReadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide { ids: string[] } or { all: true }" },
      { status: 400 }
    );
  }

  const now = new Date();

  if ("all" in parsed.data) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: now },
    });
  } else {
    await prisma.notification.updateMany({
      where: {
        id: { in: parsed.data.ids },
        userId: session.user.id, // ensure ownership
      },
      data: { isRead: true, readAt: now },
    });
  }

  // Invalidate notification caches
  updateTag(`notifications-user-${session.user.id}`);
  updateTag(`notifications-unread-user-${session.user.id}`);
  revalidatePath('/dashboard/notifications');

  return NextResponse.json({ data: { success: true } });
}
