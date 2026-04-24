import { connection } from 'next/server';
import { AOClientList } from '@/components/account-officer/AOClientList';

export default async function ClientsPage() {
  await connection();
  return <AOClientList />;
}
