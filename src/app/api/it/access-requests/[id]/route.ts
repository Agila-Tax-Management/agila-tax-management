// src/app/api/it/access-requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notify } from '@/lib/notification';

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const { id } = await params;
  const reqId = parseInt(id, 10);
  if (isNaN(reqId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const accessRequest = await prisma.itPortalAccessRequest.update({
    where: { id: reqId },
    data: {
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
    include: {
      requestedBy: { select: { id: true, firstName: true, lastName: true, user: { select: { id: true } } } },
    },
  });

  // If approved, upsert the actual EmployeeAppAccess record
  if (parsed.data.status === 'APPROVED') {
    const app = await prisma.app.findUnique({
      where: { name: accessRequest.requestedPortal },
    });
    if (app) {
      await prisma.employeeAppAccess.upsert({
        where: { employeeId_appId: { employeeId: accessRequest.requestedById, appId: app.id } },
        create: {
          employeeId: accessRequest.requestedById,
          appId: app.id,
          role: accessRequest.requestedRole,
        },
        update: { role: accessRequest.requestedRole },
      });
    }
  }

  // Notify the requester
  if (accessRequest.requestedBy.user?.id) {
    void notify({
      userId: accessRequest.requestedBy.user.id,
      type: 'SYSTEM',
      priority: parsed.data.status === 'APPROVED' ? 'NORMAL' : 'NORMAL',
      title: parsed.data.status === 'APPROVED' ? 'Access Request Approved' : 'Access Request Rejected',
      message:
        parsed.data.status === 'APPROVED'
          ? `Your ${accessRequest.requestedPortal.replace(/_/g, ' ')} access request has been approved.`
          : `Your ${accessRequest.requestedPortal.replace(/_/g, ' ')} access request was rejected.${parsed.data.reviewNote ? ` Reason: ${parsed.data.reviewNote}` : ''}`,
      linkUrl: '/dashboard/it-support',
    });
  }

  void logActivity({
    userId: session.user.id,
    action: 'STATUS_CHANGE',
    entity: 'ItPortalAccessRequest',
    entityId: String(accessRequest.id),
    description: `${parsed.data.status} access request #${reqId} for ${accessRequest.requestedPortal}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: accessRequest });
}
