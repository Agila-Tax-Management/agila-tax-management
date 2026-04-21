// src/app/(portal)/portal/client-gateway/client-list/page.tsx
import { connection } from 'next/server';
import { ClientGatewayClientList } from '@/components/client-gateway/ClientGatewayClientList';

export default async function ClientGatewayClientListPage() {
  await connection();
  return <ClientGatewayClientList />;
}
