// src/app/(portal)/portal/sales/contracts/components/ContractsPageClient.tsx
'use client';

import { useState } from 'react';
import { List, FileText } from 'lucide-react';
import { ContractList } from './ContractList';
import { ContractGenerator } from './ContractGenerator';

type Tab = 'list' | 'generate';

export function ContractsPageClient() {
  const [tab, setTab] = useState<Tab>('list');

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'list'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <List size={14} />
          All Contracts
        </button>
        <button
          type="button"
          onClick={() => setTab('generate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'generate'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={14} />
          Generate Contract
        </button>
      </div>

      {/* Tab content */}
      {tab === 'list' ? <ContractList /> : <ContractGenerator />}
    </div>
  );
}
