// src/lib/data/users/notifications.ts
// TODO: Uncomment these imports when cacheComponents is enabled (after Phase 4)
// import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';
import type { NotificationType, NotificationPriority } from '@/generated/prisma/client';

export interface GetNotificationsParams {
  userId: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  typeFilter?: NotificationType | null;
  priorityFilter?: NotificationPriority | null;
}

/**
 * Fetch user's notifications with pagination (cached for 1 minute)
 * 
 * NOTE: Notifications are near-real-time data, so we use a very short cache duration.
 * Cache is invalidated when:
 * - New notifications are created for this user
 * - User marks notifications as read
 * - User clears all notifications
 * 
 * @tag notifications-user-{userId}
 * @tag notifications-unread-user-{userId}
 */
export async function getNotifications({
  userId,
  page = 1,
  limit = 20,
  unreadOnly = false,
  typeFilter = null,
  priorityFilter = null,
}: GetNotificationsParams) {
  // TODO: Uncomment when cacheComponents is enabled (after Phase 4)
  // 'use cache'
  // cacheLife('minutes') // Very short cache (1 minute) for near-real-time data
  // cacheTag(`notifications-user-${userId}`)
  // cacheTag(`notifications-unread-user-${userId}`)

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    userId,
  };
  if (unreadOnly) where.isRead = false;
  if (typeFilter) where.type = typeFilter;
  if (priorityFilter) where.priority = priorityFilter;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        priority: true,
        title: true,
        message: true,
        linkUrl: true,
        isRead: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
