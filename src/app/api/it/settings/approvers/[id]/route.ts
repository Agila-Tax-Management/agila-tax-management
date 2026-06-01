// src/app/api/it/settings/approvers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

/**
 * DELETE /api/it/settings/approvers/[id]
 * Remove a user from the default access approvers list.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const approverId = parseInt(id, 10);
  if (isNaN(approverId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.itAccessApprover.findUnique({
    where: { id: approverId },
    select: { id: true, user: { select: { name: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Approver not found' }, { status: 404 });

  await prisma.itAccessApprover.delete({ where: { id: approverId } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'ItAccessApprover',
    entityId: String(approverId),
    description: `Removed ${existing.user.name} from default access approvers`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: approverId } });
}
