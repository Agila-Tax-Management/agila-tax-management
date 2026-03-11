// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import prisma from "@/lib/db";
import { z } from "zod";

/**
 * GET /api/notifications
 *
 * Returns the authenticated user's notifications (paginated, newest first).
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
  const skip = (page - 1) * limit;
  const unreadOnly = searchParams.get("unread") === "true";

  const where: Record<string, unknown> = {
    recipientId: session.user.id,
  };
  if (unreadOnly) where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.internalNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        priority: true,
        title: true,
        message: true,
        entity: true,
        entityId: true,
        actionUrl: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        actor: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.internalNotification.count({ where }),
    prisma.internalNotification.count({
      where: { recipientId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({
    data: notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
    await prisma.internalNotification.updateMany({
      where: { recipientId: session.user.id, isRead: false },
      data: { isRead: true, readAt: now },
    });
  } else {
    await prisma.internalNotification.updateMany({
      where: {
        id: { in: parsed.data.ids },
        recipientId: session.user.id, // ensure ownership
      },
      data: { isRead: true, readAt: now },
    });
  }

  return NextResponse.json({ data: { success: true } });
}
