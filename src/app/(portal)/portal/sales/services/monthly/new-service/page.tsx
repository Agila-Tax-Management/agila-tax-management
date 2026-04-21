// src/app/(portal)/portal/sales/services/monthly/new-service/page.tsx
import { connection } from 'next/server';
import { NewServiceForm } from '@/components/sales/NewServiceForm';

export default async function NewServicePage() {
  await connection();
  return <NewServiceForm billingType="RECURRING" />;
}
