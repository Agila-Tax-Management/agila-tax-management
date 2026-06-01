// src/app/api/it/access-management/active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import prisma from '@/lib/db';
import { AppPortal } from '@/generated/prisma/client';

/**
 * GET /api/it/access-management/active
 *
 * Returns all EmployeeAppAccess records across all portals.
 * Accessible by users with IT_MANAGEMENT portal access.
 *
 * Query params:
 *  - search  (partial match on employee name)
 *  - portal  (filter by app/portal name)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.portalAccess.IT_MANAGEMENT.canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const portalFilter = searchParams.get('portal') ?? '';

  const records = await prisma.employeeAppAccess.findMany({
    where: {
      ...(portalFilter && Object.values(AppPortal).includes(portalFilter as AppPortal)
        ? { app: { name: portalFilter as AppPortal } }
        : {}),
    },
    select: {
      id: true,
      role: true,
      createdAt: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      app: { select: { id: true, name: true } },
    },
    orderBy: [{ app: { name: 'asc' } }, { employee: { lastName: 'asc' } }],
  });

  const filtered = search
    ? records.filter((r) => {
        const fullName = `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase();
        return fullName.includes(search.toLowerCase());
      })
    : records;

  return NextResponse.json({ data: filtered });
}
