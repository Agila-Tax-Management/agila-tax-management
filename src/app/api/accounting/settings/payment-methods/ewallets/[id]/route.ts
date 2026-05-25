// src/app/api/accounting/settings/payment-methods/ewallets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const patchSchema = z.object({
  eWalletName:   z.string().min(1).max(100).optional(),
  accountName:   z.string().min(1).max(200).optional(),
  accountNumber: z.string().min(1).max(50).optional(),
  isActive:      z.boolean().optional(),
  sortOrder:     z.number().int().min(0).optional(),
});

/**
 * PATCH /api/accounting/settings/payment-methods/ewallets/[id]
 * Updates an e-wallet payment method.
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

  const existing = await prisma.paymentMethodEWallet.findUnique({ where: { id: numId } });
  if (!existing) return NextResponse.json({ error: 'E-Wallet not found' }, { status: 404 });

  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const updated = await prisma.paymentMethodEWallet.update({
    where: { id: numId },
    data:  parsed.data,
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'PaymentMethodEWallet',
    entityId: String(numId),
    description: `Updated e-wallet payment method: ${updated.eWalletName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/accounting/settings/payment-methods/ewallets/[id]
 * Deletes an e-wallet payment method.
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

  const existing = await prisma.paymentMethodEWallet.findUnique({ where: { id: numId } });
  if (!existing) return NextResponse.json({ error: 'E-Wallet not found' }, { status: 404 });

  await prisma.paymentMethodEWallet.delete({ where: { id: numId } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'PaymentMethodEWallet',
    entityId: String(numId),
    description: `Deleted e-wallet payment method: ${existing.eWalletName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id: numId } });
}
