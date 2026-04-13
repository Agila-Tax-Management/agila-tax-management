// src/app/api/accounting/gl-accounts/balances/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.glAccount.findMany({
    where: { isActive: true },
    select: {
      id:                  true,
      accountCode:         true,
      name:                true,
      description:         true,
      accountTypeId:       true,
      accountType:         { select: { id: true, name: true, group: true, normalBalance: true } },
      accountDetailTypeId: true,
      accountDetailType:   { select: { id: true, name: true } },
      parentId:            true,
      clientId:            true,
      isActive:            true,
      isBankAccount:       true,
      openingBalance:      true,
      createdAt:           true,
      updatedAt:           true,
      journalLines: {
        where: { journalEntry: { status: 'POSTED' } },
        select: { debit: true, credit: true },
      },
    },
    orderBy: { accountCode: 'asc' },
  });

  const data = accounts.map((account) => {
    const sumDebit  = account.journalLines.reduce((s, l) => s + Number(l.debit  ?? 0), 0);
    const sumCredit = account.journalLines.reduce((s, l) => s + Number(l.credit ?? 0), 0);
    const opening   = Number(account.openingBalance ?? 0);

    // T-account rule: use normalBalance stored on the account type in the DB
    const isDebitNormal = account.accountType.normalBalance === 'DEBIT';
    const runningBalance = isDebitNormal
      ? opening + sumDebit - sumCredit
      : opening + sumCredit - sumDebit;

    return {
      id:                  account.id,
      accountCode:         account.accountCode,
      name:                account.name,
      description:         account.description,
      accountTypeId:       account.accountTypeId,
      accountType:         account.accountType,
      accountDetailTypeId: account.accountDetailTypeId,
      accountDetailType:   account.accountDetailType,
      parentId:            account.parentId,
      clientId:            account.clientId,
      isActive:            account.isActive,
      isBankAccount:       account.isBankAccount,
      openingBalance:      account.openingBalance != null ? Number(account.openingBalance) : null,
      runningBalance,
      createdAt:           account.createdAt.toISOString(),
      updatedAt:           account.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({ data });
}
