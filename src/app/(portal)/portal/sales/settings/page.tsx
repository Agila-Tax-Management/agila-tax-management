import { connection } from 'next/server';
import { ASPSettings } from '@/components/sales/ASPSettings';

export default async function SettingsPage() {
  await connection();
  return <ASPSettings />;
}