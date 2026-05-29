// src/app/api/dashboard/portal-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * GET /api/dashboard/portal-stats
 *
 * Returns live counts for each enterprise portal card on the main dashboard.
 * Runs all queries in parallel for minimum latency.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [
    activeLeads,
    openInvoices,
    pendingCompliance,
    activeTasks,
    activeEmployees,
    activeClients,
  ] = await Promise.all([
    // Sales — leads that have not been converted or lost
    prisma.lead.count({
      where: { status: { isConverted: false } },
    }),

    // Accounting — invoices that still require action
    prisma.invoice.count({
      where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } },
    }),

    // Compliance — records not yet fully completed
    prisma.complianceRecord.count({
      where: { processStatus: { not: 'COMPLETED' } },
    }),

    // Tasks — tasks whose current status is not a terminal/exit step
    prisma.task.count({
      where: { status: { isExitStep: false } },
    }),

    // HR — employees with an active employment (mirrors HR portal dashboard count)
    prisma.employee.count({
      where: {
        active: true,
        softDelete: false,
        employments: { some: { employmentStatus: 'ACTIVE', isPastRole: false } },
      },
    }),

    // Clients — active client accounts
    prisma.client.count({
      where: { active: true },
    }),
  ]);

  return NextResponse.json({
    data: {
      sales: activeLeads,
      accounting: openInvoices,
      compliance: pendingCompliance,
      liaison: activeTasks,
      hr: activeEmployees,
      ao: activeClients,
      'task-mgmt': activeTasks,
      crm: activeClients,
      operation: activeClients,
    },
  });
}
