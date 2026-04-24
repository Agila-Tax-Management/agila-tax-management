// src/app/(dashboard)/dashboard/settings/page.tsx
import { connection } from 'next/server';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  await connection();
  redirect('/dashboard/settings/user-management');
}

