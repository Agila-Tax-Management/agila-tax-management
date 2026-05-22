// src/app/api/accounting/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

/** Fixed ID for the singleton AccountingSetting row. */
const SINGLETON_ID = 'acf-settings';

const patchSchema = z.object({
  // Invoice Branding
  invoiceEmail:       z.string().email('Invalid email').nullable().optional(),
  invoicePhoneNumber: z.string().max(30).nullable().optional(),
  // Petty Cash Workflow
  defaultCustodianId:         z.string().nullable().optional(),
  defaultAccountingManagerId: z.string().nullable().optional(),
  pcfNumberPrefix: z.string().min(1).max(10).optional(),
  cftNumberPrefix: z.string().min(1).max(10).optional(),
});

/**
 * GET /api/accounting/settings
 * Returns the singleton AccountingSetting, creating it with defaults on first access.
 * Also resolves and returns the display names for custodian / accounting manager.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const setting = await prisma.accountingSetting.upsert({
    where:  { id: SINGLETON_ID },
    create: { id: SINGLETON_ID },
    update: {},
  });

  // Resolve user display names for the stored IDs (IDs are plain strings, no FK)
  const userIds = [setting.defaultCustodianId, setting.defaultAccountingManagerId].filter(Boolean) as string[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name ?? u.email]));

  return NextResponse.json({
    data: {
      ...setting,
      defaultCustodianName:         setting.defaultCustodianId         ? (userMap[setting.defaultCustodianId]         ?? null) : null,
      defaultAccountingManagerName: setting.defaultAccountingManagerId ? (userMap[setting.defaultAccountingManagerId] ?? null) : null,
    },
  });
}

/**
 * PATCH /api/accounting/settings
 * Updates the singleton AccountingSetting.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const updated = await prisma.accountingSetting.upsert({
    where:  { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...parsed.data },
    update: parsed.data,
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'AccountingSetting',
    entityId: SINGLETON_ID,
    description: 'Updated accounting & finance settings',
    ...getRequestMeta(request),
  });

  // Resolve user display names so the client can show names immediately after save
  const userIds = [updated.defaultCustodianId, updated.defaultAccountingManagerId].filter(Boolean) as string[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name ?? u.email]));

  return NextResponse.json({
    data: {
      ...updated,
      defaultCustodianName:         updated.defaultCustodianId         ? (userMap[updated.defaultCustodianId]         ?? null) : null,
      defaultAccountingManagerName: updated.defaultAccountingManagerId ? (userMap[updated.defaultAccountingManagerId] ?? null) : null,
    },
  });
}
