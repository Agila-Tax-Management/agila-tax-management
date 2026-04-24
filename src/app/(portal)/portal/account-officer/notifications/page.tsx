import { connection } from 'next/server';
import { AONotifications } from '@/components/account-officer/AONotifications';

export default async function NotificationsPage() {
  await connection();
  return <AONotifications />;
}
