// src/app/(portal)/portal/accounting-and-finance/payments/new/page.tsx
import { connection } from 'next/server';
import { RecordPaymentForm } from './components/RecordPaymentForm';

export default async function NewPaymentPage() {
  await connection();
  return <RecordPaymentForm />;
}
