// src/app/api/hr/settings/general/auto-overtime-employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const bodySchema = z.object({ employeeId: z.number().int().positive() });

/**
 * POST /api/hr/settings/general/auto-overtime-employees
 * Adds an employee to the auto-overtime (bypass strict approval) list.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body: unknown = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }

  const { employeeId } = parsed.data;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, softDelete: false, employments: { some: { clientId } } },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const setting = await prisma.hrSetting.upsert({
    where: { clientId },
    create: { clientId, autoOvertimeEmployees: { connect: { id: employeeId } } },
    update: { autoOvertimeEmployees: { connect: { id: employeeId } } },
    select: {
      autoOvertimeEmployees: {
        select: { id: true, firstName: true, lastName: true, employeeNo: true },
      },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'HrSetting',
    entityId: clientId.toString(),
    description: `Added ${employee.firstName} ${employee.lastName} to auto-overtime list`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: setting.autoOvertimeEmployees });
}

/**
 * DELETE /api/hr/settings/general/auto-overtime-employees
 * Removes an employee from the auto-overtime list.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body: unknown = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }

  const { employeeId } = parsed.data;

  const setting = await prisma.hrSetting.upsert({
    where: { clientId },
    create: { clientId },
    update: { autoOvertimeEmployees: { disconnect: { id: employeeId } } },
    select: {
      autoOvertimeEmployees: {
        select: { id: true, firstName: true, lastName: true, employeeNo: true },
      },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'HrSetting',
    entityId: clientId.toString(),
    description: `Removed employee #${employeeId} from auto-overtime list`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: setting.autoOvertimeEmployees });
}
