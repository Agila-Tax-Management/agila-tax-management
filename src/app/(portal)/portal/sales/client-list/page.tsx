import { connection } from 'next/server';
import { ClientList } from '@/components/sales/ClientList';

export default async function ClientListPage() {
  await connection();
  return <ClientList />;
}
