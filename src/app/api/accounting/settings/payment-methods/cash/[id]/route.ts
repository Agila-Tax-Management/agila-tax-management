// src/app/api/accounting/settings/payment-methods/cash/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const patchSchema = z.object({
  payableTo:    z.string().min(1).max(200).optional(),
  instructions: z.string().max(1000).nullable().optional(),
  isActive:     z.boolean().optional(),
});

/**
 * PATCH /api/accounting/settings/payment-methods/cash/[id]
 * Updates a cash payment method.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.paymentMethodCash.findUnique({ where: { id: numId } });
  if (!existing) return NextResponse.json({ error: 'Cash payment method not found' }, { status: 404 });

  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const updated = await prisma.paymentMethodCash.update({
    where: { id: numId },
    data:  parsed.data,
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'PaymentMethodCash',
    entityId: String(numId),
    description: `Updated cash payment method: ${updated.payableTo}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/accounting/settings/payment-methods/cash/[id]
 * Deletes a cash payment method.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const existing = await prisma.paymentMethodCash.findUnique({ where: { id: numId } });
  if (!existing) return NextResponse.json({ error: 'Cash payment method not found' }, { status: 404 });

  await prisma.paymentMethodCash.delete({ where: { id: numId } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'PaymentMethodCash',
    entityId: String(numId),
    description: `Deleted cash payment method: ${existing.payableTo}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: numId } });
}
