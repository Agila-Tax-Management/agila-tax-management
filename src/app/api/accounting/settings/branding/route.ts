// src/app/api/accounting/settings/branding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

const SINGLETON_ID = 'acf-settings';

/**
 * GET /api/accounting/settings/branding
 * Returns invoice branding settings (email, phone, active payment methods)
 * for rendering in InvoiceTemplate and InvoicePDF.
 * This is a lightweight, read-only endpoint safe to call on every invoice page load.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [setting, banks, ewallets, cashMethods] = await Promise.all([
    prisma.accountingSetting.findUnique({
      where: { id: SINGLETON_ID },
      select: { invoiceEmail: true, invoicePhoneNumber: true },
    }),
    prisma.paymentMethodBank.findMany({
      where: { isActive: true },
      select: { bankName: true, accountName: true, accountNumber: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.paymentMethodEWallet.findMany({
      where: { isActive: true },
      select: { eWalletName: true, accountName: true, accountNumber: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.paymentMethodCash.findMany({
      where: { isActive: true },
      select: { payableTo: true, instructions: true },
      orderBy: { id: 'asc' },
    }),
  ]);

  return NextResponse.json({
    data: {
      invoiceEmail:        setting?.invoiceEmail        ?? null,
      invoicePhoneNumber:  setting?.invoicePhoneNumber  ?? null,
      banks,
      ewallets,
      cashMethods,
    },
  });
}
