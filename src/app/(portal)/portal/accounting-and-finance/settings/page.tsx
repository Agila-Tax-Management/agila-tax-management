// src/app/(portal)/portal/accounting-and-finance/settings/page.tsx
import { connection } from 'next/server';
import { AccountingSettings } from '@/components/accounting/AccountingSettings';

export default async function AccountingSettingsPage() {
  await connection();
  return <AccountingSettings />;
}
