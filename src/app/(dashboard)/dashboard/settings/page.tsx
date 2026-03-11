// src/app/(dashboard)/dashboard/settings/page.tsx
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/dashboard/settings/user-management');
}

