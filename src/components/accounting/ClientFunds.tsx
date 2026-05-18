// src/components/accounting/ClientFunds.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClientFundRecord {
  id: string;
  clientNo: string;
  clientName: string;
  lastAction: string;
  file: string;
  balanceFund: number;
}

// ── Mock data (TODO: replace with /api/accounting/client-funds) ───────────────

const MOCK_CLIENT_FUNDS: ClientFundRecord[] = [
  {
    id: 'CLT-2026-001',
    clientNo: 'CLT-2026-001',
    clientName: 'Santos Realty Inc.',
    lastAction: 'Deposit',
    file: 'FILE-SRI-001',
    balanceFund: 125000,
  },
  {
    id: 'CLT-2026-002',
    clientNo: 'CLT-2026-002',
    clientName: 'Cruz & Associates',
    lastAction: 'Withdrawal',
    file: 'FILE-CA-001',
    balanceFund: 45500,
  },
  {
    id: 'CLT-2026-003',
    clientNo: 'CLT-2026-003',
    clientName: 'Dela Cruz Enterprises',
    lastAction: 'Transfer',
    file: 'FILE-DCE-001',
    balanceFund: 78200,
  },
  {
    id: 'CLT-2026-004',
    clientNo: 'CLT-2026-004',
    clientName: 'Mendoza Trading Corp.',
    lastAction: 'Adjustment',
    file: 'FILE-MTC-001',
    balanceFund: 33800,
  },
  {
    id: 'CLT-2026-005',
    clientNo: 'CLT-2026-005',
    clientName: 'Reyes Law Office',
    lastAction: 'Deposit',
    file: 'FILE-RLO-001',
    balanceFund: 60000,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientFunds() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = MOCK_CLIENT_FUNDS.filter(c =>
    c.clientNo.toLowerCase().includes(search.toLowerCase()) ||
    c.clientName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastAction.toLowerCase().includes(search.toLowerCase()) ||
    c.file.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRowClick = (clientId: string) => {
    router.push(`/portal/accounting-and-finance/client-funds/${clientId}`);
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Client Funds</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition w-64"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Client No.</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Client Name</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Last Action</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">File</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-500">Balance Fund</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No clients found.
                </td>
              </tr>
            ) : (
              filtered.map(client => (
                <tr
                  key={client.id}
                  onClick={() => handleRowClick(client.id)}
                  className="bg-white hover:bg-amber-50/60 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-slate-700 font-mono text-xs">{client.clientNo}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{client.clientName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      client.lastAction === 'Deposit'    ? 'bg-green-100 text-green-700' :
                      client.lastAction === 'Withdrawal' ? 'bg-red-100 text-red-700' :
                      client.lastAction === 'Transfer'   ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {client.lastAction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{client.file}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    ₱{client.balanceFund.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-3">
                    <ChevronRight
                      size={16}
                      className="text-slate-300 group-hover:text-amber-500 transition"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
