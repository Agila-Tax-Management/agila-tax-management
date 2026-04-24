// src/app/(portal)/portal/client-gateway/activity-log/page.tsx
import { connection } from 'next/server';
import { ClientGatewayActivityLog } from '@/components/client-gateway/ClientGatewayActivityLog';

export default async function ClientGatewayActivityLogPage() {
  await connection();
  return <ClientGatewayActivityLog />;
}
