// src/app/(portal)/portal/accounting/payments/[id]/page.tsx
import { use } from 'react';
import { PaymentDetailView } from './components/PaymentDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default function PaymentDetailPage({ params }: Props) {
  const { id } = use(params);
  return <PaymentDetailView id={id} />;
}
