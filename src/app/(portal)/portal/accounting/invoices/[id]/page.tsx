// src/app/(portal)/portal/accounting/invoices/[id]/page.tsx
'use client';

import { use } from 'react';
import { InvoiceDetailView } from './components/InvoiceDetailView';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <InvoiceDetailView id={id} />;
}
