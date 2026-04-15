// src/app/api/cron/data-retention/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import * as Sentry from "@sentry/nextjs";

/**
 * Vercel Cron Job: Data Retention Policy
 * 
 * Schedule: Monthly (1st day of month at 2:00 AM)
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/data-retention",
 *     "schedule": "0 2 1 * *"
 *   }]
 * }
 * 
 * Data Retention Policy:
 * - ActivityLog: Archive after 7 years (Philippine BIR requirement)
 * - Notification: Delete read notifications after 90 days, unread after 180 days
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel Cron provides this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      activityLogsArchived: 0,
      notificationsDeletedRead: 0,
      notificationsDeletedUnread: 0,
      errors: [] as string[],
    };

    // ────────────────────────────────────────────────────────────────
    // 1. Archive ActivityLogs older than 7 years
    // ────────────────────────────────────────────────────────────────
    try {
      const sevenYearsAgo = new Date();
      sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

      const archivedLogs = await prisma.activityLog.updateMany({
        where: {
          createdAt: { lt: sevenYearsAgo },
          archivedAt: null, // Not already archived
        },
        data: {
          archivedAt: new Date(),
        },
      });

      results.activityLogsArchived = archivedLogs.count;

      // Track in Sentry (for monitoring)
      Sentry.addBreadcrumb({
        category: 'cron',
        message: `Archived ${archivedLogs.count} activity logs`,
        level: 'info',
      });
    } catch (error) {
      const errorMsg = `Failed to archive activity logs: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMsg);
      Sentry.captureException(error, {
        tags: { cron: 'data-retention', task: 'archive-activity-logs' },
      });
    }

    // ────────────────────────────────────────────────────────────────
    // 2. Delete read notifications older than 90 days
    // ────────────────────────────────────────────────────────────────
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deletedRead = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
          isRead: true,
        },
      });

      results.notificationsDeletedRead = deletedRead.count;

      Sentry.addBreadcrumb({
        category: 'cron',
        message: `Deleted ${deletedRead.count} read notifications`,
        level: 'info',
      });
    } catch (error) {
      const errorMsg = `Failed to delete read notifications: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMsg);
      Sentry.captureException(error, {
        tags: { cron: 'data-retention', task: 'delete-read-notifications' },
      });
    }

    // ────────────────────────────────────────────────────────────────
    // 3. Delete unread notifications older than 180 days
    // ────────────────────────────────────────────────────────────────
    try {
      const oneEightyDaysAgo = new Date();
      oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

      const deletedUnread = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: oneEightyDaysAgo },
          isRead: false,
        },
      });

      results.notificationsDeletedUnread = deletedUnread.count;

      Sentry.addBreadcrumb({
        category: 'cron',
        message: `Deleted ${deletedUnread.count} unread notifications`,
        level: 'info',
      });
    } catch (error) {
      const errorMsg = `Failed to delete unread notifications: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMsg);
      Sentry.captureException(error, {
        tags: { cron: 'data-retention', task: 'delete-unread-notifications' },
      });
    }

    // ────────────────────────────────────────────────────────────────
    // Return summary
    // ────────────────────────────────────────────────────────────────
    const status = results.errors.length > 0 ? 'partial' : 'success';
    
    console.log('[Data Retention Cron]', {
      status,
      ...results,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      status,
      results,
      timestamp: new Date().toISOString(),
    }, { status: results.errors.length > 0 ? 207 : 200 }); // 207 = Multi-Status

  } catch (error) {
    console.error('[Data Retention Cron] Fatal error:', error);
    
    Sentry.captureException(error, {
      tags: { cron: 'data-retention', severity: 'fatal' },
    });

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Prevent this route from being cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;
