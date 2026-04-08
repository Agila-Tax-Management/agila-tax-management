// src/app/api/accounting/account-detail-types/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  accountTypeId: z.number().int().positive().optional(),
});

// ─── PUT /api/accounting/account-detail-types/[id] ───────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.accountDetailType.findUnique({ where: { id: numId } });
  if (!existing) return NextResponse.json({ error: 'Detail type not found' }, { status: 404 });

  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const resolvedTypeId = parsed.data.accountTypeId ?? existing.accountTypeId;
  const resolvedName = parsed.data.name ?? existing.name;

  // Check uniqueness within the (possibly new) account type
  if (parsed.data.name !== existing.name || parsed.data.accountTypeId !== existing.accountTypeId) {
    const duplicate = await prisma.accountDetailType.findUnique({
      where: { accountTypeId_name: { accountTypeId: resolvedTypeId, name: resolvedName } },
    });
    if (duplicate && duplicate.id !== numId) {
      return NextResponse.json(
        { error: `Detail type "${resolvedName}" already exists under this account type.` },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.accountDetailType.update({
    where: { id: numId },
    data: parsed.data,
    include: {
      accountType: { select: { id: true, name: true, group: true } },
      _count: { select: { accounts: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'AccountDetailType',
    entityId: String(numId),
    description: `Updated detail type: ${updated.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

// ─── DELETE /api/accounting/account-detail-types/[id] ────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.accountDetailType.findUnique({
    where: { id: numId },
    include: { _count: { select: { accounts: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Detail type not found' }, { status: 404 });

  if (existing._count.accounts > 0) {
    return NextResponse.json(
      { error: `Cannot delete "${existing.name}" — it is used by ${existing._count.accounts} GL account(s).` },
      { status: 409 },
    );
  }

  // Soft-delete
  await prisma.accountDetailType.update({ where: { id: numId }, data: { isActive: false } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'AccountDetailType',
    entityId: String(numId),
    description: `Deleted detail type: ${existing.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: numId } });
}
