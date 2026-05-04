// src/app/(dashboard)/dashboard/settings/api-keys/page.tsx
import { connection } from 'next/server';
import ApiKeyManagement from './components/ApiKeyManagement';

export default async function ApiKeysPage(): Promise<React.ReactNode> {
  await connection();
  return <ApiKeyManagement />;
}
