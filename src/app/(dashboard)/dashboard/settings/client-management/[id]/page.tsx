// src/app/(dashboard)/dashboard/settings/client-management/[id]/page.tsx
import { connection } from 'next/server';
import ClientDetailPage from './components/ClientDetailPage';

export default async function ClientDetailRoute(): Promise<React.ReactNode> {
  await connection();
  return <ClientDetailPage />;
}
