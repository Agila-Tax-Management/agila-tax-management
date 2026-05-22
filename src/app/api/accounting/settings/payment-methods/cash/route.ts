// src/app/api/accounting/settings/payment-methods/cash/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const createSchema = z.object({
  payableTo:    z.string().min(1, '"Payable to" is required').max(200),
  instructions: z.string().max(1000).nullable().optional(),
});

/**
 * GET /api/accounting/settings/payment-methods/cash
 * Returns all cash payment methods.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cashMethods = await prisma.paymentMethodCash.findMany({
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({ data: cashMethods });
}

/**
 * POST /api/accounting/settings/payment-methods/cash
 * Creates a new cash payment method.
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

  const cashMethod = await prisma.paymentMethodCash.create({ data: parsed.data });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'PaymentMethodCash',
    entityId: String(cashMethod.id),
    description: `Added cash payment method: ${cashMethod.payableTo}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: cashMethod }, { status: 201 });
}
