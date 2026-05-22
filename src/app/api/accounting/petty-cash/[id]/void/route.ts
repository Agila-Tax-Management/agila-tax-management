// src/app/api/accounting/petty-cash/[id]/void/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notify } from '@/lib/notification';

const VOIDABLE_STATUSES = ['DRAFT', 'PENDING', 'APPROVED'];

// ── POST /api/accounting/petty-cash/[id]/void ─────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role as string;
  const userId = session.user.id;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Only administrators can void petty cash requests.' },
      { status: 403 },
    );
  }

  const { id } = await params;

  const pcf = await prisma.pettyCash.findUnique({
    where: { id },
    select: { id: true, pcfNo: true, status: true, requestedById: true },
  });
  if (!pcf) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!VOIDABLE_STATUSES.includes(pcf.status)) {
    return NextResponse.json(
      { error: `A ${pcf.status.toLowerCase()} request cannot be voided.` },
      { status: 400 },
    );
  }

  await prisma.pettyCash.update({
    where: { id },
    data: { status: 'VOID' },
  });

  void logActivity({
    userId,
    action: 'STATUS_CHANGE',
    entity: 'PettyCash',
    entityId: id,
    description: `Voided petty cash request ${pcf.pcfNo}`,
    ...getRequestMeta(request),
  });

  // Notify the requester only if voided by someone else
  if (pcf.requestedById !== userId) {
    void notify({
      userId: pcf.requestedById,
      type: 'SYSTEM',
      title: 'Petty cash request voided',
      message: `Your request ${pcf.pcfNo} has been voided by an administrator.`,
      linkUrl: '/dashboard/petty-cash',
    });
  }

  return NextResponse.json({ data: { status: 'VOID' } });
}
