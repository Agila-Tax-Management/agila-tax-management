// src/app/(portal)/portal/accounting-and-finance/chartofaccounts/page.tsx
import { connection } from 'next/server';
import { ChartofAccounts } from '@/components/accounting/ChartofAccounts';

export default async function ChartofAccountsPage() {
  await connection();
  return <ChartofAccounts />;
}
