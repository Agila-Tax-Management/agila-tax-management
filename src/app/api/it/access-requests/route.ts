// src/app/api/it/access-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notifyMany } from '@/lib/notification';

const createSchema = z.object({
  requestedPortal: z.enum(['SALES', 'COMPLIANCE', 'LIAISON', 'ACCOUNTING', 'OPERATIONS_MANAGEMENT', 'HR', 'TASK_MANAGEMENT', 'CLIENT_RELATIONS', 'IT_MANAGEMENT']),
  requestedRole: z.enum(['VIEWER', 'USER', 'ADMIN', 'SETTINGS']),
  reason: z.string().min(1, 'Reason is required'),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') ?? '';

  const requests = await prisma.itPortalAccessRequest.findMany({
    where: {
      clientId,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      requestedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
          user: { select: { image: true } },
        },
      },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: requests });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Any authenticated employee may submit a portal access request

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  if (!session.employee) {
    return NextResponse.json({ error: 'Employee record required to submit an access request' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const accessRequest = await prisma.itPortalAccessRequest.create({
    data: {
      clientId,
      requestedById: session.employee.id,
      requestedPortal: parsed.data.requestedPortal,
      requestedRole: parsed.data.requestedRole,
      reason: parsed.data.reason,
    },
    include: {
      requestedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'ItPortalAccessRequest',
    entityId: String(accessRequest.id),
    description: `Submitted portal access request for ${parsed.data.requestedPortal} (${parsed.data.requestedRole})`,
    ...getRequestMeta(request),
  });

  // Notify all IT_MANAGEMENT users about the new access request
  // Includes: ADMIN/SUPER_ADMIN (implicit full access) + EMPLOYEE users with explicit IT_MANAGEMENT access
  void (async () => {
    const [adminUsers, itApp] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, active: true },
        select: { id: true },
      }),
      prisma.app.findUnique({ where: { name: 'IT_MANAGEMENT' }, select: { id: true } }),
    ]);
    const adminUserIds = adminUsers.map((u) => u.id);
    const itEmployeeUserIds: string[] = itApp
      ? await prisma.employeeAppAccess
          .findMany({ where: { appId: itApp.id }, select: { employee: { select: { userId: true } } } })
          .then((rows) => rows.map((r) => r.employee.userId).filter((id): id is string => !!id))
      : [];
    const userIds = [...new Set([...adminUserIds, ...itEmployeeUserIds])]
      .filter((id) => id !== session.user.id);
    if (userIds.length > 0) {
      const requesterName = `${accessRequest.requestedBy.firstName} ${accessRequest.requestedBy.lastName}`;
      void notifyMany({
        userIds,
        type: 'SYSTEM',
        priority: 'NORMAL',
        title: 'New Portal Access Request',
        message: `${requesterName} requested ${parsed.data.requestedRole} access to ${parsed.data.requestedPortal.replace(/_/g, ' ')}.`,
        linkUrl: '/portal/it/access-requests',
      });
    }
  })();

  return NextResponse.json({ data: accessRequest }, { status: 201 });
}
