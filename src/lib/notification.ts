// src/lib/notification.ts
import { updateTag } from 'next/cache';
import { revalidatePath } from 'next/cache';
import prisma from "./db";
import type {
  NotificationType,
  NotificationPriority,
} from "@/generated/prisma/client";

/**
 * Input for creating a notification.
 *
 * At least one of `userId` or `clientUserId` must be provided to route
 * the notification to the correct recipient (internal user or client portal user).
 */
export interface NotifyInput {
  /** Internal User ID of the recipient (internal portal) */
  userId?: string;
  /** ClientUser ID of the recipient (client portal) */
  clientUserId?: string;
  /** Notification category */
  type?: NotificationType;
  /** Urgency level */
  priority?: NotificationPriority;
  /** Short title shown in the notification list */
  title: string;
  /** Detailed message body */
  message: string;
  /** URL path to navigate to when clicked */
  linkUrl?: string;
}

/**
 * Fire-and-forget notification creator.
 *
 * Call with `void` so it never blocks the API response:
 * ```ts
 * // Internal user notification
 * void notify({
 *   userId: managerId,
 *   type: "TASK",
 *   title: "New task assigned",
 *   message: "You have been assigned a compliance task for Acme Corp.",
 *   linkUrl: `/portal/compliance/tasks/${task.id}`,
 * });
 *
 * // Client portal user notification
 * void notify({
 *   clientUserId: clientUser.id,
 *   type: "DOCUMENT",
 *   title: "Document uploaded",
 *   message: "Your SEC form has been uploaded.",
 * });
 * ```
 */
export function notify(input: NotifyInput): Promise<void> {
  return prisma.notification
    .create({
      data: {
        userId: input.userId ?? null,
        clientUserId: input.clientUserId ?? null,
        type: input.type ?? "SYSTEM",
        priority: input.priority ?? "NORMAL",
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl ?? null,
      },
    })
    .then(() => {
      // Invalidate notification cache for recipient
      if (input.userId) {
        updateTag(`notifications-user-${input.userId}`);
        updateTag(`notifications-unread-user-${input.userId}`);
        revalidatePath('/dashboard/notifications');
      }
      // Note: clientUserId notifications would need separate cache tags if implemented
    })
    .catch((err: unknown) => {
      console.error("[Notification] Failed to create notification:", err);
    });
}

/**
 * Send the same notification to multiple internal users at once.
 *
 * Uses `createMany` for a single DB round-trip.
 * ```ts
 * void notifyMany({
 *   userIds: [userId1, userId2],
 *   type: "ANNOUNCEMENT",
 *   title: "Company holiday",
 *   message: "The office will be closed on April 9.",
 * });
 * ```
 */
export function notifyMany(
  input: Omit<NotifyInput, "userId" | "clientUserId"> & { userIds: string[] }
): Promise<void> {
  const { userIds, ...rest } = input;

  return prisma.notification
    .createMany({
      data: userIds.map((userId) => ({
        userId,
        clientUserId: null,
        type: rest.type ?? "SYSTEM",
        priority: rest.priority ?? "NORMAL",
        title: rest.title,
        message: rest.message,
        linkUrl: rest.linkUrl ?? null,
      })),
    })
    .then(() => {
      // Invalidate notification caches for all recipients
      userIds.forEach((userId) => {
        updateTag(`notifications-user-${userId}`);
        updateTag(`notifications-unread-user-${userId}`);
      });
      revalidatePath('/dashboard/notifications');
    })
    .catch((err: unknown) => {
      console.error("[Notification] Failed to create bulk notifications:", err);
    });
}
