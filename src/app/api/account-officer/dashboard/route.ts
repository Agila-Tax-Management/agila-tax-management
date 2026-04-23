// src/app/api/account-officer/dashboard/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getClientIdFromSession, getSessionWithAccess } from "@/lib/session";
import { getAODashboard } from "@/lib/data/account-officer/dashboard";

export async function GET(): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.portalAccess.CLIENT_RELATIONS.canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) {
    return NextResponse.json({ error: "No active employment found" }, { status: 403 });
  }

  const [cached, unreadNotifications] = await Promise.all([
    getAODashboard(session.user.id, clientId),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  return NextResponse.json({
    data: {
      cards: {
        ...cached.cards,
        unreadNotifs: unreadNotifications,
      },
      statusBreakdown: cached.statusBreakdown,
      overdueTasks: cached.overdueTasks,
      upcomingTasks: cached.upcomingTasks,
      recentActivityLogs: cached.recentActivityLogs,
    },
  });
}
