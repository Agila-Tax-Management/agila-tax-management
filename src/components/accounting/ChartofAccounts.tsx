// src/components/accounting/ChartofAccounts.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Search, BookOpen, TrendingUp, Wallet, Scale, BarChart2 } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AccountType =
  | 'Current Assets'
  | 'Non-Current Assets'
  | 'Current Liabilities'
  | 'Non-Current Liabilities'
  | 'Equity'
  | 'Revenue';

export interface Account {
  id: string;
  accountName: string;
  accountType: AccountType;
  detailType: string;
  runningBalance: number;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

type FinancialGroup = 'Assets' | 'Liabilities' | 'Equity' | 'Revenue';

const GROUP_TYPES: Record<FinancialGroup, AccountType[]> = {
  Assets:      ['Current Assets', 'Non-Current Assets'],
  Liabilities: ['Current Liabilities', 'Non-Current Liabilities'],
  Equity:      ['Equity'],
  Revenue:     ['Revenue'],
};

const FINANCIAL_GROUPS: FinancialGroup[] = ['Assets', 'Liabilities', 'Equity', 'Revenue'];

interface GroupMeta { icon: React.ReactNode; color: string; bg: string }
const GROUP_META: Record<FinancialGroup, GroupMeta> = {
  Assets:      { icon: <Wallet size={14} />,    color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100'    },
  Liabilities: { icon: <Scale size={14} />,     color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-100'    },
  Equity:      { icon: <TrendingUp size={14} />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  Revenue:     { icon: <BarChart2 size={14} />,  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100'  },
};

interface TypeMeta { badge: string }
const TYPE_META: Record<AccountType, TypeMeta> = {
  'Current Assets':          { badge: 'bg-blue-100 text-blue-700'    },
  'Non-Current Assets':      { badge: 'bg-indigo-100 text-indigo-700' },
  'Current Liabilities':     { badge: 'bg-rose-100 text-rose-700'    },
  'Non-Current Liabilities': { badge: 'bg-orange-100 text-orange-700' },
  Equity:                    { badge: 'bg-emerald-100 text-emerald-700' },
  Revenue:                   { badge: 'bg-amber-100 text-amber-700'  },
};

export const SEED_ACCOUNTS: Account[] = [
  { id: '1', accountName: 'Cash on Hand',       accountType: 'Current Assets',          detailType: 'Cash and Cash Equivalents', runningBalance: 0,      createdAt: '2026-01-01' },
  { id: '2', accountName: 'Petty Cash Fund',     accountType: 'Current Assets',          detailType: 'Cash and Cash Equivalents', runningBalance: 5000,   createdAt: '2026-01-01' },
  { id: '3', accountName: 'Accounts Receivable', accountType: 'Current Assets',          detailType: 'Accounts Receivable',       runningBalance: 0,      createdAt: '2026-01-01' },
  { id: '4', accountName: 'Office Equipment',    accountType: 'Non-Current Assets',      detailType: 'Equipment',                 runningBalance: 120000, createdAt: '2026-01-01' },
  { id: '5', accountName: 'Accounts Payable',    accountType: 'Current Liabilities',     detailType: 'Accounts Payable',          runningBalance: 0,      createdAt: '2026-01-01' },
  { id: '6', accountName: "Owner's Capital",     accountType: 'Equity',                  detailType: 'Capital',                   runningBalance: 500000, createdAt: '2026-01-01' },
  { id: '7', accountName: 'Service Revenue',     accountType: 'Revenue',                 detailType: 'Service Revenue',           runningBalance: 0,      createdAt: '2026-01-01' },
];

// ─── Main Component ─────────────────────────────────────────────────────────────

export function ChartofAccounts(): React.ReactNode {
  const [accounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        a.detailType.toLowerCase().includes(q) ||
        a.accountType.toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const grandTotal = filtered.reduce((s, a) => s + a.runningBalance, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Chart of Accounts</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View your account structure for accurate financial reporting.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accounts..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Accounts Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen size={32} className="text-slate-300" />
            <p className="text-sm text-slate-400">No accounts found.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Detail Type</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Balance</th>
                </tr>
              </thead>
              <tbody>
                {FINANCIAL_GROUPS.map((group) => {
                  const gMeta = GROUP_META[group];
                  const groupAccounts = GROUP_TYPES[group].flatMap((t) =>
                    filtered.filter((a) => a.accountType === t),
                  );
                  if (groupAccounts.length === 0) return null;

                  return (
                    <React.Fragment key={group}>
                      {/* ─── Financial group header ─── */}
                      <tr className={`border-y border-slate-200`}>
                        <td colSpan={3} className={`px-5 py-2.5 ${gMeta.bg}`}>
                          <div className={`flex items-center gap-2 ${gMeta.color}`}>
                            {gMeta.icon}
                            <span className="text-xs font-black uppercase tracking-widest">{group}</span>
                          </div>
                        </td>
                      </tr>

                      {/* ─── Account type sub-sections ─── */}
                      {GROUP_TYPES[group].map((type) => {
                        const typeAccounts = filtered.filter((a) => a.accountType === type);
                        if (typeAccounts.length === 0) return null;
                        const tMeta = TYPE_META[type];

                        return (
                          <React.Fragment key={type}>
                            {/* Type sub-header (only when group has multiple types) */}
                            {GROUP_TYPES[group].length > 1 && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={3} className="pl-10 pr-5 py-1.5">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tMeta.badge}`}>
                                    {type}
                                  </span>
                                </td>
                              </tr>
                            )}

                            {/* Account rows */}
                            {typeAccounts.map((account) => (
                              <tr
                                key={account.id}
                                className="border-b border-slate-100 hover:bg-amber-50/30 transition-colors"
                              >
                                <td className="pl-12 pr-4 py-3">
                                  <span className="font-medium text-slate-800 text-sm">{account.accountName}</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">{account.detailType}</td>
                                <td className="px-5 py-3 text-right">
                                  <span className={`font-semibold tabular-nums text-sm ${account.runningBalance > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {account.runningBalance === 0
                                      ? '—'
                                      : `₱${account.runningBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* Single grand total row */}
              <tfoot>
                <tr className="bg-amber-600 text-white">
                  <td colSpan={2} className="px-5 py-3.5">
                    <span className="text-xs font-black uppercase tracking-widest">Total</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-black tabular-nums">
                      ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


