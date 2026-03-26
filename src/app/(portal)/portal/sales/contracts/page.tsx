// src/app/(portal)/portal/sales/contracts/page.tsx
import React from 'react';
import { ContractGenerator } from './components/ContractGenerator';

export const metadata = {
  title: 'Contract Generator | Sales Portal',
};

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Contract Generator</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate a Terms of Service Agreement PDF for any client — fill in the details, select applicable services, then download.
        </p>
      </div>
      <ContractGenerator />
    </div>
  );
}
