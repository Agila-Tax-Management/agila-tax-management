// src/app/api/accounting/petty-cash/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { notify } from '@/lib/notification';

const rejectSchema = z.object({
  reason: z.string().optional(),
});

// ── POST /api/accounting/petty-cash/[id]/reject ───────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const pcf = await prisma.pettyCash.findUnique({
    where: { id },
    select: {
      id: true,
      pcfNo: true,
      status: true,
      custodianId: true,
      accountingManagerId: true,
      requestedById: true,
    },
  });

  if (!pcf) {
    return NextResponse.json({ error: 'Petty cash request not found' }, { status: 404 });
  }

  const userId = session.user.id;
  const role = session.user.role as string;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCustodian = pcf.custodianId === userId;
  const isManager = pcf.accountingManagerId === userId;

  if (!isSuperAdmin && !isCustodian && !isManager) {
    return NextResponse.json(
      { error: 'You are not authorized to reject this request.' },
      { status: 403 },
    );
  }

  if (!['PENDING', 'APPROVED'].includes(pcf.status)) {
    return NextResponse.json(
      { error: 'This request cannot be rejected in its current status.' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = rejectSchema.safeParse(body);
  const reason = parsed.success ? (parsed.data.reason ?? null) : null;

  await prisma.pettyCash.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
  });

  void logActivity({
    userId,
    action: 'REJECTED',
    entity: 'PettyCash',
    entityId: id,
    description: `Rejected petty cash request ${pcf.pcfNo}${reason ? `: ${reason}` : ''}`,
    ...getRequestMeta(request),
  });

  // Notify requester
  void notify({
    userId: pcf.requestedById,
    type: 'SYSTEM',
    title: 'Petty cash request rejected',
    message: reason
      ? `Your request ${pcf.pcfNo} was rejected. Reason: ${reason}`
      : `Your request ${pcf.pcfNo} was rejected.`,
    linkUrl: '/dashboard/petty-cash',
  });

  return NextResponse.json({ data: { status: 'REJECTED' } });
}
