// src/app/api/accounting/settings/payment-methods/ewallets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const createSchema = z.object({
  eWalletName:   z.string().min(1, 'E-Wallet name is required').max(100),
  accountName:   z.string().min(1, 'Account name is required').max(200),
  accountNumber: z.string().min(1, 'Account number is required').max(50),
  sortOrder:     z.number().int().min(0).optional(),
});

/**
 * GET /api/accounting/settings/payment-methods/ewallets
 * Returns all e-wallet payment methods ordered by sortOrder.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ewallets = await prisma.paymentMethodEWallet.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });

  return NextResponse.json({ data: ewallets });
}

/**
 * POST /api/accounting/settings/payment-methods/ewallets
 * Creates a new e-wallet payment method.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const ewallet = await prisma.paymentMethodEWallet.create({ data: parsed.data });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'PaymentMethodEWallet',
    entityId: String(ewallet.id),
    description: `Added e-wallet payment method: ${ewallet.eWalletName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: ewallet }, { status: 201 });
}
