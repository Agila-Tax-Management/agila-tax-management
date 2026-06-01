// src/app/(dashboard)/dashboard/it-support/page.tsx
import { connection } from 'next/server';
import { ITSupportPage } from './components/ITSupportPage';

export const metadata = {
  title: 'IT Support',
};

export default async function ITSupportRoute(): Promise<React.ReactNode> {
  await connection();
  return <ITSupportPage />;
}
