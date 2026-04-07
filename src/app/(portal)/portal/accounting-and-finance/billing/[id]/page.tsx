// src/app/(portal)/portal/accounting/billing/[id]/page.tsx
import { use } from 'react';
import { SubscriptionDetailView } from './components/SubscriptionDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default function SubscriptionDetailPage({ params }: Props) {
  const { id } = use(params);
  return <SubscriptionDetailView id={id} />;
}
