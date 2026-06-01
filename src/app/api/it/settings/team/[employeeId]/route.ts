// src/app/api/it/settings/team/[employeeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

/**
 * DELETE /api/it/settings/team/[employeeId]
 * Revoke IT_MANAGEMENT access from an employee.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canDelete) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { employeeId: empIdStr } = await params;
  const employeeId = parseInt(empIdStr, 10);
  if (isNaN(employeeId)) return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });

  const itApp = await prisma.app.findUnique({ where: { name: 'IT_MANAGEMENT' }, select: { id: true } });
  if (!itApp) return NextResponse.json({ error: 'IT_MANAGEMENT app not found' }, { status: 500 });

  const existing = await prisma.employeeAppAccess.findUnique({
    where: { employeeId_appId: { employeeId, appId: itApp.id } },
  });
  if (!existing) return NextResponse.json({ error: 'Access record not found' }, { status: 404 });

  await prisma.employeeAppAccess.delete({
    where: { employeeId_appId: { employeeId, appId: itApp.id } },
  });

  void logActivity({
    userId: session.user.id,
    action: 'PERMISSION_CHANGE',
    entity: 'EmployeeAppAccess',
    entityId: String(existing.id),
    description: `Revoked IT_MANAGEMENT access from employee #${employeeId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { message: 'Access revoked' } });
}
