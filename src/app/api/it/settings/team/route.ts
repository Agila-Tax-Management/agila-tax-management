// src/app/api/it/settings/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getClientIdFromSession, getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const grantSchema = z.object({
  employeeId: z.number().int().positive(),
  role: z.enum(['VIEWER', 'USER', 'ADMIN', 'SETTINGS']).default('USER'),
});

/**
 * GET /api/it/settings/team
 * Returns all employees with IT_MANAGEMENT app access + ADMIN/SUPER_ADMIN users.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: 'No active employment found' }, { status: 403 });

  const itApp = await prisma.app.findUnique({
    where: { name: 'IT_MANAGEMENT' },
    select: { id: true },
  });

  // Employees with explicit IT_MANAGEMENT access
  const employeeMembers = itApp
    ? await prisma.employeeAppAccess.findMany({
        where: { appId: itApp.id },
        select: {
          role: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNo: true,
              userId: true,
              user: { select: { id: true, name: true, email: true, image: true, role: true } },
            },
          },
        },
      })
    : [];

  // ADMIN/SUPER_ADMIN users (implicit full access)
  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, active: true },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  const employeeMemberUserIds = new Set(
    employeeMembers.map((m) => m.employee.userId).filter(Boolean),
  );

  const team = [
    // Employee members with explicit access
    ...employeeMembers.map((m) => ({
      employeeId: m.employee.id,
      userId: m.employee.userId,
      name: `${m.employee.firstName} ${m.employee.lastName}`,
      employeeNo: m.employee.employeeNo,
      email: m.employee.user?.email ?? null,
      image: m.employee.user?.image ?? null,
      role: m.role,
      accessType: 'EXPLICIT' as const,
      userRole: m.employee.user?.role ?? null,
    })),
    // Admin users not already in the employee list
    ...adminUsers
      .filter((u) => !employeeMemberUserIds.has(u.id))
      .map((u) => ({
        employeeId: null,
        userId: u.id,
        name: u.name,
        employeeNo: null,
        email: u.email,
        image: u.image,
        role: 'SETTINGS' as const,
        accessType: 'IMPLICIT' as const,
        userRole: u.role,
      })),
  ];

  return NextResponse.json({ data: team });
}

/**
 * POST /api/it/settings/team
 * Grant IT_MANAGEMENT access to an employee.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const itApp = await prisma.app.findUnique({ where: { name: 'IT_MANAGEMENT' }, select: { id: true } });
  if (!itApp) return NextResponse.json({ error: 'IT_MANAGEMENT app not found' }, { status: 500 });

  const access = await prisma.employeeAppAccess.upsert({
    where: { employeeId_appId: { employeeId: parsed.data.employeeId, appId: itApp.id } },
    create: { employeeId: parsed.data.employeeId, appId: itApp.id, role: parsed.data.role },
    update: { role: parsed.data.role },
  });

  void logActivity({
    userId: session.user.id,
    action: 'PERMISSION_CHANGE',
    entity: 'EmployeeAppAccess',
    entityId: String(access.id),
    description: `Granted IT_MANAGEMENT access (${parsed.data.role}) to employee #${parsed.data.employeeId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: access }, { status: 201 });
}
