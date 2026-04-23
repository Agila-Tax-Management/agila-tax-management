// src/app/api/sales/task-templates/route.ts
import { NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import { getSalesTaskTemplates } from '@/lib/data/sales/reference';

/**
 * GET /api/sales/task-templates
 * Returns all task templates for the service plan template picker.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = await getSalesTaskTemplates();

  return NextResponse.json({ data: templates });
}
