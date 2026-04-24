// src/app/(dashboard)/dashboard/sop/liaison/page.tsx
import { connection } from 'next/server';
import { LiaisonDepartment } from '@/components/quick-links/LiaisonDepartment';

export default async function LiaisonDepartmentPage() {
  await connection();
  return <LiaisonDepartment />;
}
