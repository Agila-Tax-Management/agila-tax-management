// src/app/api/it/tickets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notify } from '@/lib/notification';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['BUG', 'SYSTEM_ISSUE', 'DOWNTIME', 'CREATE_USER', 'REVOKE_ACCESS', 'HARDWARE_REQUEST', 'SOFTWARE_REQUEST', 'OTHER']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().nullable().optional(),
  resolution: z.string().optional(),
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

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const resolvedAt =
    parsed.data.status === 'RESOLVED' || parsed.data.status === 'CLOSED'
      ? new Date()
      : undefined;

  const ticket = await prisma.itTicket.update({
    where: { id: ticketId },
    data: {
      ...parsed.data,
      ...(resolvedAt ? { resolvedAt } : {}),
    },
    include: {
      reportedBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'ItTicket',
    entityId: String(ticket.id),
    description: `Updated IT ticket ${ticket.ticketNumber}`,
    ...getRequestMeta(request),
  });

  // Notify reporter when ticket is resolved or closed
  if ((parsed.data.status === 'RESOLVED' || parsed.data.status === 'CLOSED') &&
      ticket.reportedBy?.id && ticket.reportedBy.id !== session.user.id) {
    void notify({
      userId: ticket.reportedBy.id,
      type: 'SYSTEM',
      priority: 'NORMAL',
      title: `Ticket ${ticket.ticketNumber} ${parsed.data.status === 'RESOLVED' ? 'Resolved' : 'Closed'}`,
      message: `Your IT support ticket — "${ticket.title}" — has been marked as ${parsed.data.status.toLowerCase()}.`,
      linkUrl: '/dashboard/it-support',
    });
  }

  // Notify new assignee
  if (parsed.data.assignedToId && parsed.data.assignedToId !== session.user.id) {
    void notify({
      userId: parsed.data.assignedToId,
      type: 'SYSTEM',
      priority: 'NORMAL',
      title: `IT Ticket Assigned: ${ticket.ticketNumber}`,
      message: `You have been assigned to IT ticket — "${ticket.title}"`,
      linkUrl: '/portal/it/tickets',
    });
  }

  return NextResponse.json({ data: ticket });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canDelete) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  await prisma.itTicket.delete({ where: { id: ticketId } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'ItTicket',
    entityId: id,
    description: `Deleted IT ticket #${id}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { success: true } });
}
