// src/app/api/hr/settings/general/exempt-employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const bodySchema = z.object({ employeeId: z.number().int().positive() });

/**
 * POST /api/hr/settings/general/exempt-employees
 * Adds an employee to the late/undertime exemption list.
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

  // Verify employee belongs to this client
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, softDelete: false, employments: { some: { clientId } } },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  // Ensure HrSetting exists then connect
  const setting = await prisma.hrSetting.upsert({
    where: { clientId },
    create: { clientId, exemptLateUndertimeEmployees: { connect: { id: employeeId } } },
    update: { exemptLateUndertimeEmployees: { connect: { id: employeeId } } },
    select: {
      exemptLateUndertimeEmployees: {
        select: { id: true, firstName: true, lastName: true, employeeNo: true },
      },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'HrSetting',
    entityId: clientId.toString(),
    description: `Added ${employee.firstName} ${employee.lastName} to late/undertime exemption list`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: setting.exemptLateUndertimeEmployees });
}

/**
 * DELETE /api/hr/settings/general/exempt-employees
 * Removes an employee from the late/undertime exemption list.
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
    update: { exemptLateUndertimeEmployees: { disconnect: { id: employeeId } } },
    select: {
      exemptLateUndertimeEmployees: {
        select: { id: true, firstName: true, lastName: true, employeeNo: true },
      },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'HrSetting',
    entityId: clientId.toString(),
    description: `Removed employee #${employeeId} from late/undertime exemption list`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: setting.exemptLateUndertimeEmployees });
}
