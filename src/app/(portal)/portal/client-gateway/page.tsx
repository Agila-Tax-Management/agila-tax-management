// src/app/(portal)/portal/client-gateway/page.tsx
import { connection } from 'next/server';
import { ClientGateway } from '@/components/client-gateway/ClientGateway';

export default async function ClientGatewayPage() {
  await connection();
  return <ClientGateway />;
}
