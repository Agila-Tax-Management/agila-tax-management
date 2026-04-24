// src/app/(dashboard)/dashboard/settings/user-management/page.tsx
import { connection } from 'next/server';
import UserManagement from './components/UserManagement';

export default async function UserManagementPage(): Promise<React.ReactNode> {
  await connection();
  return <UserManagement />;
}
