// src/app/api/it/audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import prisma from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';

/**
 * Maps portal keys to the entity names logged by that portal's API routes.
 * Used to scope audit log queries when a portal filter is applied.
 */
const PORTAL_ENTITIES: Record<string, string[]> = {
  sales: [
    'Lead', 'TsaContract', 'Service', 'ServicePackage', 'JobOrder',
    'Quote', 'City', 'GovernmentOffice', 'SalesSetting', 'LeadStatus',
  ],
  accounting: [
    'Invoice', 'GlAccount', 'AccountType', 'AccountDetailType',
    'AccountingSetting', 'PaymentMethodEWallet', 'PaymentMethodCash',
    'PaymentMethodBank', 'PettyCash', 'JournalEntry',
  ],
  compliance: [
    'ClientCompliance', 'ComplianceRecord', 'ComplianceSetting',
    'ComplianceDocument', 'ComplianceNote', 'EwtItem', 'VatMonth',
    'PercentageTaxMonth', 'SalesRecord', 'ExpenseRecord', 'Contact',
  ],
  liaison: [
    'LiaisonTask', 'FieldReport',
  ],
  hr: [
    'Employee', 'Department', 'Position', 'EmployeeTeam', 'WorkSchedule',
    'HrSetting', 'EmployeeLevel', 'LeaveType', 'LeaveRequest',
    'OvertimeRequest', 'CoaRequest', 'Timesheet', 'Payslip',
    'PayrollPeriod', 'PayrollSchedule', 'Holiday',
  ],
  it: [
    'ItTicket', 'ItAsset', 'ItPortalAccessRequest',
    'ItSystemStatusEntry', 'EmployeeAppAccess',
  ],
  tasks: ['Task', 'TaskSubtask', 'TaskTemplate', 'DepartmentTaskStatus'],
  admin: ['User', 'Client', 'ClientUser', 'ClientApiKey', 'Announcement'],
};

/**
 * GET /api/it/audit
 *
 * Returns paginated activity logs across all portals (system-wide audit trail).
 * Accessible by users with IT_MANAGEMENT portal access.
 *
 * Query params:
 *  - page     (default: 1)
 *  - limit    (default: 25, max: 50)
 *  - portal   (one of: all, sales, accounting, compliance, liaison, hr, it, tasks, admin, client)
 *             'client' filters by clientUserId IS NOT NULL (external client portal actors)
 *  - action   (LogAction enum value)
 *  - search   (partial match on description)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
  const portal = searchParams.get('portal') ?? 'all';
  const action = searchParams.get('action');
  const search = searchParams.get('search');

  const where: Prisma.ActivityLogWhereInput = {};

  if (portal === 'client') {
    // Show only logs made by external ClientUser actors (client portal)
    where.clientUserId = { not: null };
  } else if (portal !== 'all') {
    const portalEntities = PORTAL_ENTITIES[portal] ?? null;
    if (portalEntities !== null) {
      where.entity = { in: portalEntities };
    }
  }

  if (action) where.action = action as Prisma.ActivityLogWhereInput['action'];
  if (search) {
    where.description = { contains: search, mode: 'insensitive' };
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        description: true,
        ipAddress: true,
        createdAt: true,
        isSystemAction: true,
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
