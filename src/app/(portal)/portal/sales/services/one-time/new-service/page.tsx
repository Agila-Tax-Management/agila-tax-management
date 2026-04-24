// src/app/(portal)/portal/sales/services/one-time/new-service/page.tsx
import { connection } from 'next/server';
import { NewServiceForm } from '@/components/sales/NewServiceForm';

export default async function NewOneTimeServicePage() {
  await connection();
  return <NewServiceForm billingType="ONE_TIME" />;
}
