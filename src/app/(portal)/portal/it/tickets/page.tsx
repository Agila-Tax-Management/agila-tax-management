// src/app/(portal)/portal/it/tickets/page.tsx
import { connection } from 'next/server';
import { ITTickets } from '@/components/it/ITTickets';

export default async function ITTicketsPage() {
  await connection();
  return <ITTickets />;
}
