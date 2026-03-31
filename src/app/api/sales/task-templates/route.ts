// src/app/api/sales/task-templates/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';

/**
 * GET /api/sales/task-templates
 * Returns all task templates for the service plan template picker.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = await prisma.taskTemplate.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true },
  });

  return NextResponse.json({ data: templates });
}
