// src/app/(portal)/portal/accounting-and-finance/pettycash/page.tsx
import { connection } from 'next/server';
import { PettyCashFund } from '@/components/accounting/PettyCashFund';

export default async function PettyCashFundPage() {
  await connection();
  return <PettyCashFund />;
}
