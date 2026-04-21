// src/app/(dashboard)/dashboard/settings/client-management/page.tsx
import { connection } from 'next/server';
import ClientManagement from '@/components/dashboard/ClientManagement';

export default async function ClientManagementPage(): Promise<React.ReactNode> {
  await connection();
  return <ClientManagement />;
}
