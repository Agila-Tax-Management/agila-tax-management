// src/app/api/hr/settings/general/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess, getClientIdFromSession } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const patchSchema = z.object({
  employeeNumberPrefix: z.string().min(1).max(20).optional(),
  strictOvertimeApproval: z.boolean().optional(),
  disableLateUndertimeGlobal: z.boolean().optional(),
  enableAutoTimeOut: z.boolean().optional(),
  autoTimeOutTime: z.string().nullable().optional(),
});

/**
 * GET /api/hr/settings/general
 * Returns the HrSetting for this client, creating default on first access.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  // Upsert defaults on first access
  const setting = await prisma.hrSetting.upsert({
    where: { clientId },
    create: { clientId },
    update: {},
    select: {
      id: true,
      employeeNumberPrefix: true,
      strictOvertimeApproval: true,
      disableLateUndertimeGlobal: true,
      enableAutoTimeOut: true,
      autoTimeOutTime: true,
      autoOvertimeEmployees: {
        select: { id: true, firstName: true, lastName: true, employeeNo: true },
      },
      exemptLateUndertimeEmployees: {
        select: { id: true, firstName: true, lastName: true, employeeNo: true },
      },
    },
  });

  return NextResponse.json({ data: setting });
}

/**
 * PATCH /api/hr/settings/general
 * Updates scalar fields on HrSetting for this client.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }

  const { employeeNumberPrefix, strictOvertimeApproval, disableLateUndertimeGlobal, enableAutoTimeOut, autoTimeOutTime } = parsed.data;

  const setting = await prisma.hrSetting.upsert({
    where: { clientId },
    create: {
      clientId,
      ...(employeeNumberPrefix !== undefined && { employeeNumberPrefix }),
      ...(strictOvertimeApproval !== undefined && { strictOvertimeApproval }),
      ...(disableLateUndertimeGlobal !== undefined && { disableLateUndertimeGlobal }),
      ...(enableAutoTimeOut !== undefined && { enableAutoTimeOut }),
      ...(autoTimeOutTime !== undefined && { autoTimeOutTime }),
    },
    update: {
      ...(employeeNumberPrefix !== undefined && { employeeNumberPrefix }),
      ...(strictOvertimeApproval !== undefined && { strictOvertimeApproval }),
      ...(disableLateUndertimeGlobal !== undefined && { disableLateUndertimeGlobal }),
      ...(enableAutoTimeOut !== undefined && { enableAutoTimeOut }),
      ...(autoTimeOutTime !== undefined && { autoTimeOutTime }),
    },
    select: {
      id: true,
      employeeNumberPrefix: true,
      strictOvertimeApproval: true,
      disableLateUndertimeGlobal: true,
      enableAutoTimeOut: true,
      autoTimeOutTime: true,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'HrSetting',
    entityId: setting.id,
    description: 'Updated HR General Settings',
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: setting });
}
