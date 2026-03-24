// src/app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import prisma from "@/lib/db";
import type { LogAction } from "@/generated/prisma/client";
import { z } from "zod";

const logsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().optional(),
  entity: z.string().optional(),
  userId: z.string().optional(),
  clientUserId: z.string().optional(),
  clientId: z.coerce.number().int().optional(),
  isSystemAction: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

/**
 * GET /api/logs
 *
 * Returns paginated activity logs. Accessible by SUPER_ADMIN and ADMIN only.
 * EMPLOYEE users can only see their own logs.
 *
 * Query params:
 *  - page           (default: 1)
 *  - limit          (default: 25, max: 100)
 *  - action         (filter by LogAction enum value)
 *  - entity         (filter by entity type, e.g. "Client")
 *  - userId         (filter by internal user — admin only)
 *  - clientUserId   (filter by client portal user — admin only)
 *  - clientId       (filter by client/workspace)
 *  - isSystemAction ("true" / "false")
 */
export async function GET(request: NextRequest) {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const rawParams = Object.fromEntries(searchParams.entries());
  const query = logsQuerySchema.safeParse(rawParams);
  const params = query.success ? query.data : { page: 1, limit: 25 };

  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};

  // EMPLOYEE can only see their own logs
  if (session.user.role === "EMPLOYEE") {
    where.userId = session.user.id;
  } else {
    if ("userId" in params && params.userId) where.userId = params.userId;
    if ("clientUserId" in params && params.clientUserId) where.clientUserId = params.clientUserId;
    if ("clientId" in params && params.clientId) where.clientId = params.clientId;
  }

  if ("action" in params && params.action) where.action = params.action as LogAction;
  if ("entity" in params && params.entity) where.entity = params.entity;
  if ("isSystemAction" in params && params.isSystemAction !== undefined) {
    where.isSystemAction = params.isSystemAction;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        clientId: true,
        isSystemAction: true,
        action: true,
        entity: true,
        entityId: true,
        description: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        clientUser: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
