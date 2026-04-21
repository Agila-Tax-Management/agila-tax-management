// src/app/(portal)/portal/accounting/payments/[id]/page.tsx
import { connection } from 'next/server';
import { use } from 'react';
import { PaymentDetailView } from './components/PaymentDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: Props) {
  await connection();
  const { id } = use(params);
  return <PaymentDetailView id={id} />;
}
