// src/app/(portal)/portal/accounting/payments/[id]/page.tsx
import { connection } from 'next/server';
import { PaymentDetailView } from './components/PaymentDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: Props) {
  await connection();
  const { id } = await params;
  return <PaymentDetailView id={id} />;
}
