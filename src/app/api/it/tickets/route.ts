// src/app/api/it/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notifyMany } from '@/lib/notification';

const createSchema = z.object({
  type: z.enum(['BUG', 'SYSTEM_ISSUE', 'DOWNTIME', 'CREATE_USER', 'REVOKE_ACCESS', 'HARDWARE_REQUEST', 'SOFTWARE_REQUEST', 'OTHER']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assignedToId: z.string().optional(),
});

async function getNextTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `IT-${year}-`;
  const latest = await prisma.itTicket.findFirst({
    where: { ticketNumber: { startsWith: prefix } },
    orderBy: { ticketNumber: 'desc' },
    select: { ticketNumber: true },
  });
  let nextSeq = 1;
  if (latest?.ticketNumber) {
    const parts = latest.ticketNumber.split('-');
    const last = parseInt(parts[parts.length - 1]!, 10);
    if (!isNaN(last)) nextSeq = last + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

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
  const type = searchParams.get('type') ?? '';
  const search = searchParams.get('search') ?? '';

  const tickets = await prisma.itTicket.findMany({
    where: {
      clientId,
      ...(status ? { status: status as never } : {}),
      ...(type ? { type: type as never } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { ticketNumber: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      reportedBy: { select: { id: true, name: true, image: true } },
      assignedTo: { select: { id: true, name: true, image: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ data: tickets });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Any authenticated employee may submit an IT support ticket (no portal-level guard)

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const ticketNumber = await getNextTicketNumber();

  const ticket = await prisma.itTicket.create({
    data: {
      ticketNumber,
      clientId,
      reportedById: session.user.id,
      type: parsed.data.type,
      priority: parsed.data.priority,
      title: parsed.data.title,
      description: parsed.data.description,
      ...(parsed.data.assignedToId ? { assignedToId: parsed.data.assignedToId } : {}),
    },
    include: {
      reportedBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'ItTicket',
    entityId: String(ticket.id),
    description: `Created IT ticket ${ticket.ticketNumber}: ${ticket.title}`,
    ...getRequestMeta(request),
  });

  // Notify all IT_MANAGEMENT users about the new ticket
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
      void notifyMany({
        userIds,
        type: 'SYSTEM',
        priority: ticket.priority === 'URGENT' ? 'URGENT' : ticket.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
        title: `New IT Ticket: ${ticket.ticketNumber}`,
        message: `${ticket.reportedBy?.name ?? 'An employee'} submitted a ${ticket.priority.toLowerCase()} priority ticket — "${ticket.title}"`,
        linkUrl: '/portal/it/tickets',
      });
    }
  })();

  return NextResponse.json({ data: ticket }, { status: 201 });
}
