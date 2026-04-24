// src/app/(portal)/portal/client-gateway/announcements/page.tsx
import { connection } from 'next/server';
import { ClientGatewayAnnouncements } from '@/components/client-gateway/ClientGatewayAnnouncements';

export default async function ClientGatewayAnnouncementsPage() {
  await connection();
  return <ClientGatewayAnnouncements />;
}
