// src/components/accounting/ChartofAccounts.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, BookOpen, TrendingUp, Wallet, Scale, BarChart2, RefreshCw, Download, Upload, X } from 'lucide-react';

/* ── Template download ─────────────────────────────────────────────────────── */
function downloadGlTemplate() {
  const headers = [
    'Account Code',
    'Account Name',
    'Account Type',
    'Detail Type',
    'Description',
    'Opening Balance',
    'Is Bank Account',
  ];
  const example = [
    '1010',
    'Cash on Hand',
    'Current Assets',
    'Cash and Cash Equivalents',
    'Petty cash and physical currency',
    '0',
    'No',
  ];
  const csv = [headers.join(','), example.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chart-of-accounts-import-template.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

type GlImportResult = {
  row: number;
  accountCode: string;
  status: 'ok' | 'error' | 'skipped';
  error?: string;
};

// ─── Types ─────────────────────────────────────────────────────────────────────

// DB group → display group
type FinancialGroup = 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';

// The shape returned by GET /api/accounting/gl-accounts
export interface GlAccountRecord {
  id: string;
  accountCode: string;
  name: string;
  description: string | null;
  accountTypeId: number;
  accountType: { id: number; name: string; group: string; normalBalance: string };
  accountDetailTypeId: number;
  accountDetailType: { id: number; name: string };
  parentId: string | null;
  clientId: number;
  isActive: boolean;
  isBankAccount: boolean;
  openingBalance: number | null;
  runningBalance?: number;
  createdAt: string;
  updatedAt: string;
}

// Legacy type kept for AccountingSettings compatibility
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

// Keep seed accounts for AccountingSettings local fallback (replaced by API)
export const SEED_ACCOUNTS: Account[] = [];

// ─── Constants ──────────────────────────────────────────────────────────────────

const DB_GROUP_TO_DISPLAY: Record<string, FinancialGroup> = {
  ASSET:     'Assets',
  LIABILITY: 'Liabilities',
  EQUITY:    'Equity',
  REVENUE:   'Revenue',
  EXPENSE:   'Expenses',
};

const FINANCIAL_GROUPS: FinancialGroup[] = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'];

interface GroupMeta { icon: React.ReactNode; color: string; bg: string }
const GROUP_META: Record<FinancialGroup, GroupMeta> = {
  Assets:      { icon: <Wallet size={14} />,     color: 'text-blue-700',     bg: 'bg-blue-50 border-blue-100'       },
  Liabilities: { icon: <Scale size={14} />,      color: 'text-rose-700',     bg: 'bg-rose-50 border-rose-100'       },
  Equity:      { icon: <TrendingUp size={14} />, color: 'text-emerald-700',  bg: 'bg-emerald-50 border-emerald-100' },
  Revenue:     { icon: <BarChart2 size={14} />,  color: 'text-amber-700',    bg: 'bg-amber-50 border-amber-100'     },
  Expenses:    { icon: <BookOpen size={14} />,   color: 'text-violet-700',   bg: 'bg-violet-50 border-violet-100'   },
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export function ChartofAccounts(): React.ReactNode {
  const [accounts, setAccounts] = useState<GlAccountRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  // Import state
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<GlImportResult[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/accounting/gl-accounts/balances');
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to load accounts');
      }
      const json = await res.json() as { data: GlAccountRecord[] };
      setAccounts(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAccounts(); }, [fetchAccounts]);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsImporting(true);
    setImportError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/accounting/gl-accounts/import', { method: 'POST', body: form });
      const data = await res.json() as { error?: string; data?: { total: number; imported: number; errors: number; skipped: number; results: GlImportResult[] } };
      if (!res.ok) { setImportError(data.error ?? 'Import failed'); return; }
      setImportResults(data.data?.results ?? []);
      void fetchAccounts();
    } catch {
      setImportError('An unexpected error occurred.');
    } finally {
      setIsImporting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.accountCode.toLowerCase().includes(q) ||
        a.accountDetailType.name.toLowerCase().includes(q) ||
        a.accountType.name.toLowerCase().includes(q),
    );
  }, [accounts, search]);

  // Group accounts by their financial group
  const groupedAccounts = useMemo(() => {
    const groups: Record<FinancialGroup, Map<string, GlAccountRecord[]>> = {
      Assets: new Map(), Liabilities: new Map(), Equity: new Map(),
      Revenue: new Map(), Expenses: new Map(),
    };
    for (const account of filtered) {
      const group = DB_GROUP_TO_DISPLAY[account.accountType.group] ?? 'Assets';
      const typeName = account.accountType.name;
      if (!groups[group].has(typeName)) groups[group].set(typeName, []);
      groups[group].get(typeName)!.push(account);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View your account structure for accurate financial reporting.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadGlTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={13} /> Template
          </button>
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Upload size={13} /> {isImporting ? 'Importing…' : 'Import'}
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => void handleImportFile(e)}
          />
          <button
            onClick={() => void fetchAccounts()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
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

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Import error banner */}
      {importError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center justify-between gap-4">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Accounts Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw size={24} className="text-slate-300 animate-spin" />
            <p className="text-sm text-slate-400">Loading accounts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen size={32} className="text-slate-300" />
            <p className="text-sm text-slate-400">No accounts found.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Code</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Detail Type</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {FINANCIAL_GROUPS.map((group) => {
                  const gMeta = GROUP_META[group];
                  const typeMap = groupedAccounts[group];
                  if (typeMap.size === 0) return null;
                  const typeEntries = Array.from(typeMap.entries());

                  return (
                    <React.Fragment key={group}>
                      {/* ─── Financial group header ─── */}
                      <tr className="border-y border-slate-200">
                        <td colSpan={4} className={`px-5 py-2.5 ${gMeta.bg}`}>
                          <div className={`flex items-center gap-2 ${gMeta.color}`}>
                            {gMeta.icon}
                            <span className="text-xs font-black uppercase tracking-widest">{group}</span>
                          </div>
                        </td>
                      </tr>

                      {/* ─── Account type sub-sections ─── */}
                      {typeEntries.map(([typeName, typeAccounts]) => (
                        <React.Fragment key={typeName}>
                          {/* Type sub-header */}
                          {typeEntries.length > 1 && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={4} className="pl-10 pr-5 py-1.5">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  {typeName}
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
                              <td className="pl-12 pr-4 py-3 font-mono text-xs text-slate-500">{account.accountCode}</td>
                              <td className="px-4 py-3">
                                <span className="font-medium text-slate-800 text-sm">{account.name}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">{account.accountDetailType.name}</td>
                              <td className="px-5 py-3 text-right">
                                {(() => {
                                  const bal = account.runningBalance ?? account.openingBalance ?? 0;
                                  if (bal === 0) return <span className="font-semibold tabular-nums text-sm text-slate-400">—</span>;
                                  const isNeg = bal < 0;
                                  const fmt = `₱${Math.abs(bal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
                                  return (
                                    <span className={`font-semibold tabular-nums text-sm ${isNeg ? 'text-rose-600' : 'text-slate-800'}`}>
                                      {isNeg ? `(${fmt})` : fmt}
                                    </span>
                                  );
                                })()}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Results Modal */}
      {importResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setImportResults(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">Import Results</h2>
              <button onClick={() => setImportResults(null)} className="p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-2 font-black text-slate-400 uppercase tracking-widest">Row</th>
                    <th className="pb-2 font-black text-slate-400 uppercase tracking-widest">Account Code</th>
                    <th className="pb-2 font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="pb-2 font-black text-slate-400 uppercase tracking-widest">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {importResults.map((r) => (
                    <tr key={r.row}>
                      <td className="py-2 text-slate-500">{r.row}</td>
                      <td className="py-2 font-mono text-slate-700 font-medium">{r.accountCode}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          r.status === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{r.status}</span>
                      </td>
                      <td className="py-2 text-slate-400">{r.error ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setImportResults(null)}
                className="w-full h-9 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}