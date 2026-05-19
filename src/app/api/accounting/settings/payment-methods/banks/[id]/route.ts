// src/app/api/accounting/settings/payment-methods/banks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const patchSchema = z.object({
  bankName:      z.string().min(1).max(100).optional(),
  accountName:   z.string().min(1).max(200).optional(),
  accountNumber: z.string().min(1).max(50).optional(),
  isActive:      z.boolean().optional(),
  sortOrder:     z.number().int().min(0).optional(),
});

/**
 * PATCH /api/accounting/settings/payment-methods/banks/[id]
 * Updates a bank payment method.
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

  const existing = await prisma.paymentMethodBank.findUnique({ where: { id: numId } });
  if (!existing) return NextResponse.json({ error: 'Bank not found' }, { status: 404 });

  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const updated = await prisma.paymentMethodBank.update({
    where: { id: numId },
    data:  parsed.data,
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'PaymentMethodBank',
    entityId: String(numId),
    description: `Updated bank payment method: ${updated.bankName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/accounting/settings/payment-methods/banks/[id]
 * Deletes a bank payment method.
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

  const existing = await prisma.paymentMethodBank.findUnique({ where: { id: numId } });
  if (!existing) return NextResponse.json({ error: 'Bank not found' }, { status: 404 });

  await prisma.paymentMethodBank.delete({ where: { id: numId } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'PaymentMethodBank',
    entityId: String(numId),
    description: `Deleted bank payment method: ${existing.bankName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: numId } });
}
