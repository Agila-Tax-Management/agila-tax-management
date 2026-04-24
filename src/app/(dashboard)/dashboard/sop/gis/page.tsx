// src/app/(dashboard)/dashboard/sop/gis/page.tsx
import { connection } from 'next/server';
import { ComplianceGIS } from '@/components/quick-links/ComplianceGIS';

export default async function ComplianceGISPage() {
  await connection();
  return <ComplianceGIS />;
}
