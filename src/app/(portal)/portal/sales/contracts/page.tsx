// src/app/(portal)/portal/sales/contracts/page.tsx
import { connection } from 'next/server';
import React from 'react';
import { ContractsPageClient } from './components/ContractsPageClient';

export const metadata = {
  title: 'Contracts | Sales Portal',
};

export default async function ContractsPage() {
  await connection();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">TSA Contracts</h1>
        <p className="text-sm text-slate-500 mt-1">
          View and manage all client TSA contracts, or generate a new contract PDF.
        </p>
      </div>
      <ContractsPageClient />
    </div>
  );
}
