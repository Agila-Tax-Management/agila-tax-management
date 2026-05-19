// src/components/accounting/ClientFundDetail.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientFundTransaction {
  id: string;
  date: string;
  action: string;
  type: string;
  txnId: string;
  assigned: string;
  amount: number;
  balance: number;
}

interface ClientFundData {
  clientName: string;
  transactions: ClientFundTransaction[];
}

// ── Mock data (TODO: replace with /api/accounting/client-funds/[clientId]) ────

const MOCK_FUND_DATA: Record<string, ClientFundData> = {
  'CLT-2026-001': {
    clientName: 'Santos Realty Inc.',
    transactions: [
      { id: '1', date: '2026-05-15', action: 'Deposit',    type: 'Cash',          txnId: 'TXN-2026-0051', assigned: 'M. Santos', amount:  50000, balance: 125000 },
      { id: '2', date: '2026-05-10', action: 'Withdrawal', type: 'Bank Transfer',  txnId: 'TXN-2026-0048', assigned: 'A. Reyes',  amount: -25000, balance:  75000 },
      { id: '3', date: '2026-05-05', action: 'Deposit',    type: 'Check',          txnId: 'TXN-2026-0044', assigned: 'M. Santos', amount:  30000, balance: 100000 },
      { id: '4', date: '2026-05-01', action: 'Transfer',   type: 'Bank Transfer',  txnId: 'TXN-2026-0040', assigned: 'J. Cruz',   amount: -30000, balance:  70000 },
      { id: '5', date: '2026-04-25', action: 'Deposit',    type: 'Cash',           txnId: 'TXN-2026-0038', assigned: 'M. Santos', amount: 100000, balance: 100000 },
    ],
  },
  'CLT-2026-002': {
    clientName: 'Cruz & Associates',
    transactions: [
      { id: '1', date: '2026-05-12', action: 'Withdrawal', type: 'Bank Transfer',  txnId: 'TXN-2026-0050', assigned: 'L. Cruz',  amount: -15000, balance:  45500 },
      { id: '2', date: '2026-05-08', action: 'Deposit',    type: 'Cash',           txnId: 'TXN-2026-0046', assigned: 'L. Cruz',  amount:  20000, balance:  60500 },
      { id: '3', date: '2026-04-30', action: 'Adjustment', type: 'Internal',       txnId: 'TXN-2026-0041', assigned: 'Admin',    amount:  -1000, balance:  40500 },
      { id: '4', date: '2026-04-25', action: 'Deposit',    type: 'Check',          txnId: 'TXN-2026-0037', assigned: 'L. Cruz',  amount:  41500, balance:  41500 },
    ],
  },
  'CLT-2026-003': {
    clientName: 'Dela Cruz Enterprises',
    transactions: [
      { id: '1', date: '2026-05-14', action: 'Transfer',   type: 'Bank Transfer',  txnId: 'TXN-2026-0049', assigned: 'R. Dela Cruz', amount: -10000, balance:  78200 },
      { id: '2', date: '2026-05-09', action: 'Deposit',    type: 'Cash',           txnId: 'TXN-2026-0047', assigned: 'R. Dela Cruz', amount:  25000, balance:  88200 },
      { id: '3', date: '2026-05-02', action: 'Withdrawal', type: 'Bank Transfer',  txnId: 'TXN-2026-0043', assigned: 'J. Santos',    amount: -13800, balance:  63200 },
      { id: '4', date: '2026-04-28', action: 'Deposit',    type: 'Cash',           txnId: 'TXN-2026-0039', assigned: 'R. Dela Cruz', amount:  77000, balance:  77000 },
    ],
  },
  'CLT-2026-004': {
    clientName: 'Mendoza Trading Corp.',
    transactions: [
      { id: '1', date: '2026-05-13', action: 'Adjustment', type: 'Internal',       txnId: 'TXN-2026-0052', assigned: 'Admin',      amount:  -1200, balance:  33800 },
      { id: '2', date: '2026-05-07', action: 'Deposit',    type: 'Check',          txnId: 'TXN-2026-0045', assigned: 'P. Mendoza', amount:  15000, balance:  35000 },
      { id: '3', date: '2026-04-29', action: 'Withdrawal', type: 'Bank Transfer',  txnId: 'TXN-2026-0042', assigned: 'P. Mendoza', amount:  -5000, balance:  20000 },
      { id: '4', date: '2026-04-20', action: 'Deposit',    type: 'Cash',           txnId: 'TXN-2026-0036', assigned: 'P. Mendoza', amount:  25000, balance:  25000 },
    ],
  },
  'CLT-2026-005': {
    clientName: 'Reyes Law Office',
    transactions: [
      { id: '1', date: '2026-05-16', action: 'Deposit',    type: 'Cash',          txnId: 'TXN-2026-0053', assigned: 'C. Reyes',  amount:  30000, balance:  60000 },
      { id: '2', date: '2026-05-11', action: 'Withdrawal', type: 'Bank Transfer', txnId: 'TXN-2026-0049', assigned: 'C. Reyes',  amount: -10000, balance:  30000 },
      { id: '3', date: '2026-05-03', action: 'Deposit',    type: 'Check',         txnId: 'TXN-2026-0043', assigned: 'C. Reyes',  amount:  40000, balance:  40000 },
    ],
  },
};

// ── Action badge styles ───────────────────────────────────────────────────────

function actionBadgeClass(action: string): string {
  if (action === 'Deposit')    return 'bg-green-100 text-green-700';
  if (action === 'Withdrawal') return 'bg-red-100 text-red-700';
  if (action === 'Transfer')   return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ClientFundDetailProps {
  clientId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientFundDetail({ clientId }: ClientFundDetailProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const fundData = MOCK_FUND_DATA[clientId];

  if (!fundData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Client Funds</h1>
        </div>
        <div className="text-center py-16 text-slate-400">Client not found.</div>
      </div>
    );
  }

  const filtered = fundData.transactions.filter(t =>
    t.date.includes(search) ||
    t.action.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase()) ||
    t.txnId.toLowerCase().includes(search.toLowerCase()) ||
    t.assigned.toLowerCase().includes(search.toLowerCase()),
  );

  const currentBalance = fundData.transactions[0]?.balance ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition shrink-0"
          title="Back to Client Funds"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Client Funds</h1>
      </div>

      {/* ── Client info bar + search ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Client:</span>
            <span className="text-sm font-bold text-slate-900">{fundData.clientName}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Current Balance:</span>
            <span className="text-sm font-bold text-slate-900">
              ₱{currentBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition w-64"
          />
        </div>
      </div>

      {/* ── Transactions table ── */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Action</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">ID</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Assigned</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-500">Amount</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-500">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map(txn => (
                <tr key={txn.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(txn.date).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${actionBadgeClass(txn.action)}`}>
                      {txn.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{txn.type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{txn.txnId}</td>
                  <td className="px-4 py-3 text-slate-700">{txn.assigned}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${txn.amount >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {txn.amount >= 0 ? '+' : ''}₱{Math.abs(txn.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    ₱{txn.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
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
