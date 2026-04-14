// src/app/api/operation/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';

/**
 * GET /api/operation/dashboard/stats
 * Returns dashboard statistics for Operations Portal
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Calculate date ranges
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [activeClients, tasksNearDeadline, overdueTasks, newClientsThisMonth] =
      await Promise.all([
        // Active clients count
        prisma.client.count({
          where: { active: true },
        }),

        // Tasks with due date within next 7 days
        prisma.task.count({
          where: {
            dueDate: {
              gte: now,
              lte: sevenDaysFromNow,
            },
            statusId: {
              not: null,
            },
          },
        }),

        // Overdue tasks (due date in the past)
        prisma.task.count({
          where: {
            dueDate: {
              lt: now,
            },
            statusId: {
              not: null,
            },
          },
        }),

        // New clients onboarded this month
        prisma.client.count({
          where: {
            createdAt: {
              gte: firstDayOfMonth,
            },
          },
        }),
      ]);

    return NextResponse.json({
      data: {
        activeClients,
        tasksNearDeadline,
        overdueTasks,
        newClientsThisMonth,
      },
    });
  } catch (err) {
    console.error('[GET /api/operation/dashboard/stats]', err);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
