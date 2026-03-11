// src/app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import prisma from "@/lib/db";
import type { LogAction } from "@/generated/prisma/client";

/**
 * GET /api/logs
 *
 * Returns paginated activity logs. Accessible by SUPER_ADMIN and ADMIN only.
 * EMPLOYEE users can only see their own logs.
 *
 * Query params:
 *  - page     (default: 1)
 *  - limit    (default: 25, max: 100)
 *  - action   (filter by LogAction enum value)
 *  - entity   (filter by entity type, e.g. "Client")
 *  - userId   (filter by specific user — admin only)
 */
export async function GET(request: NextRequest) {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;

  const action = searchParams.get("action") as LogAction | null;
  const entity = searchParams.get("entity");
  const filterUserId = searchParams.get("userId");

  // Build where clause
  const where: Record<string, unknown> = {};

  // EMPLOYEE can only see their own logs
  if (session.user.role === "EMPLOYEE") {
    where.userId = session.user.id;
  } else if (filterUserId) {
    where.userId = filterUserId;
  }

  if (action) where.action = action;
  if (entity) where.entity = entity;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
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
