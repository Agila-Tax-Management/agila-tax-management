// src/app/(portal)/portal/compliance/settings/page.tsx
import { connection } from 'next/server';
import { ComplianceSettings } from './components/ComplianceSettings';

export default async function ComplianceSettingsPage() {
  await connection();
  return <ComplianceSettings />;
}
