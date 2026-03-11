// src/lib/activity-log.ts
import prisma from "./db";
import type { LogAction } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Input for creating an activity log entry.
 */
export interface LogActivityInput {
  /** The authenticated user's ID */
  userId: string;
  /** What kind of action was performed */
  action: LogAction;
  /** The entity type acted upon (e.g. "Client", "Employee", "Lead") */
  entity: string;
  /** Primary key of the affected record */
  entityId?: string;
  /** Human-readable summary (e.g. "Created client Acme Corp") */
  description: string;
  /** Optional structured metadata (old/new values, extra context) */
  metadata?: Prisma.InputJsonValue;
  /** Request IP address (optional) */
  ipAddress?: string;
  /** Request user-agent string (optional) */
  userAgent?: string;
}

/**
 * Fire-and-forget activity log writer.
 *
 * Designed to be called with `void` so it never blocks the API response:
 * ```ts
 * void logActivity({
 *   userId: session.user.id,
 *   action: "CREATED",
 *   entity: "Client",
 *   entityId: client.id,
 *   description: `Created client ${client.name}`,
 * });
 * ```
 *
 * Errors are caught internally — they will never bubble up or cause
 * unhandled promise rejections.
 */
export function logActivity(input: LogActivityInput): Promise<void> {
  return prisma.activityLog
    .create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        description: input.description,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
    .then(() => {
      // Intentionally empty — insert succeeded silently
    })
    .catch((err: unknown) => {
      // Log to server console but never throw — keeps fire-and-forget safe
      console.error("[ActivityLog] Failed to write log:", err);
    });
}

/**
 * Helper to extract IP and user-agent from Next.js request headers.
 *
 * Usage:
 * ```ts
 * const meta = getRequestMeta(request);
 * void logActivity({ ...payload, ...meta });
 * ```
 */
export function getRequestMeta(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  return { ipAddress, userAgent };
}
