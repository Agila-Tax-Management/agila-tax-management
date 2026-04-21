// src/app/(portal)/portal/accounting/billing/[id]/page.tsx
import { connection } from 'next/server';
import { use } from 'react';
import { SubscriptionDetailView } from './components/SubscriptionDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubscriptionDetailPage({ params }: Props) {
  await connection();
  const { id } = use(params);
  return <SubscriptionDetailView id={id} />;
}
