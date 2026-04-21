import { connection } from 'next/server';
import UserClientManagement from '@/components/dashboard/UserClientManagement';

export default async function UserClientManagementPage(): Promise<React.ReactNode> {
  await connection();
	return <UserClientManagement />;
}