// src/lib/notification.ts
import prisma from "./db";
import type {
  NotificationType,
  NotificationPriority,
} from "@/generated/prisma/client";

/**
 * Input for creating an internal notification.
 */
export interface NotifyInput {
  /** User ID who will receive the notification */
  recipientId: string;
  /** User ID whose action triggered this (omit for system-generated) */
  actorId?: string;
  /** Notification category */
  type?: NotificationType;
  /** Urgency level */
  priority?: NotificationPriority;
  /** Short title shown in the notification list */
  title: string;
  /** Detailed message body */
  message: string;
  /** Entity type this relates to (e.g. "Client", "Lead") */
  entity?: string;
  /** Primary key of the related record */
  entityId?: string;
  /** URL path to navigate to when clicked */
  actionUrl?: string;
}

/**
 * Fire-and-forget notification creator.
 *
 * Call with `void` so it never blocks the API response:
 * ```ts
 * void notify({
 *   recipientId: managerId,
 *   actorId: session.user.id,
 *   type: "SUCCESS",
 *   title: "New client created",
 *   message: "Acme Corp was added by Maria Santos.",
 *   entity: "Client",
 *   entityId: client.id,
 *   actionUrl: `/portal/sales/clients/${client.id}`,
 * });
 * ```
 */
export function notify(input: NotifyInput): Promise<void> {
  return prisma.internalNotification
    .create({
      data: {
        recipientId: input.recipientId,
        actorId: input.actorId ?? null,
        type: input.type ?? "INFO",
        priority: input.priority ?? "NORMAL",
        title: input.title,
        message: input.message,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        actionUrl: input.actionUrl ?? null,
      },
    })
    .then(() => {
      // Intentionally empty — insert succeeded silently
    })
    .catch((err: unknown) => {
      console.error("[Notification] Failed to create notification:", err);
    });
}

/**
 * Send the same notification to multiple recipients at once.
 *
 * Uses `createMany` for a single DB round-trip.
 * ```ts
 * void notifyMany({
 *   recipientIds: [userId1, userId2],
 *   title: "Monthly report ready",
 *   message: "The March compliance report is now available.",
 * });
 * ```
 */
export function notifyMany(
  input: Omit<NotifyInput, "recipientId"> & { recipientIds: string[] }
): Promise<void> {
  const { recipientIds, ...rest } = input;

  return prisma.internalNotification
    .createMany({
      data: recipientIds.map((recipientId) => ({
        recipientId,
        actorId: rest.actorId ?? null,
        type: rest.type ?? "INFO",
        priority: rest.priority ?? "NORMAL",
        title: rest.title,
        message: rest.message,
        entity: rest.entity ?? null,
        entityId: rest.entityId ?? null,
        actionUrl: rest.actionUrl ?? null,
      })),
    })
    .then(() => {
      // Intentionally empty
    })
    .catch((err: unknown) => {
      console.error("[Notification] Failed to create bulk notifications:", err);
    });
}
