// src/components/accounting/ChartofAccounts.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Search, X, ChevronDown, BookOpen, TrendingUp, Wallet, Landmark, Scale, BarChart2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType =
  | 'Current Assets'
  | 'Non-Current Assets'
  | 'Current Liabilities'
  | 'Non-Current Liabilities'
  | 'Equity'
  | 'Revenue';

interface Account {
  id: string;
  accountName: string;
  accountType: AccountType;
  detailType: string;
  runningBalance: number;
  createdAt: string;
}

interface FormState {
  accountName: string;
  accountType: AccountType | '';
  detailType: string;
  runningBalance: string;
}

interface FormErrors {
  accountName?: string;
  accountType?: string;
  detailType?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: AccountType[] = [
  'Current Assets',
  'Non-Current Assets',
  'Current Liabilities',
  'Non-Current Liabilities',
  'Equity',
  'Revenue',
];

const DETAIL_TYPE_MAP: Record<AccountType, string[]> = {
  'Current Assets': [
    'Cash and Cash Equivalents',
    'Accounts Receivable',
    'Prepaid Expenses',
    'Inventory',
    'Loans to Owner',
  ],
  'Non-Current Assets': ['Vehicles', 'Properties', 'Equipment'],
  'Current Liabilities': ['Accounts Payable', 'Client Funds'],
  'Non-Current Liabilities': ['Loans Payable', 'Mortgage Payable'],
  Equity: ['Capital', 'Drawing', 'Adjustments'],
  Revenue: ['Service Revenue', 'Sales - Retail', 'Sales - Wholesale', 'Other Income'],
};

const TYPE_META: Record<AccountType, { icon: React.ReactNode; color: string; badge: string }> = {
  'Current Assets':          { icon: <Wallet size={13} />,    color: 'bg-blue-50 text-blue-700 border-blue-200',    badge: 'bg-blue-100 text-blue-700'    },
  'Non-Current Assets':      { icon: <Landmark size={13} />,  color: 'bg-indigo-50 text-indigo-700 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  'Current Liabilities':     { icon: <Scale size={13} />,     color: 'bg-rose-50 text-rose-700 border-rose-200',    badge: 'bg-rose-100 text-rose-700'    },
  'Non-Current Liabilities': { icon: <Scale size={13} />,     color: 'bg-orange-50 text-orange-700 border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  Equity:                    { icon: <TrendingUp size={13} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  Revenue:                   { icon: <BarChart2 size={13} />,  color: 'bg-amber-50 text-amber-700 border-amber-200', badge: 'bg-amber-100 text-amber-700'   },
};

const SEED_ACCOUNTS: Account[] = [
  { id: '1', accountName: 'Cash on Hand',        accountType: 'Current Assets',          detailType: 'Cash and Cash Equivalents', runningBalance: 0,       createdAt: '2026-01-01' },
  { id: '2', accountName: 'Petty Cash Fund',      accountType: 'Current Assets',          detailType: 'Cash and Cash Equivalents', runningBalance: 5000,    createdAt: '2026-01-01' },
  { id: '3', accountName: 'Accounts Receivable',  accountType: 'Current Assets',          detailType: 'Accounts Receivable',       runningBalance: 0,       createdAt: '2026-01-01' },
  { id: '4', accountName: 'Office Equipment',     accountType: 'Non-Current Assets',      detailType: 'Equipment',                 runningBalance: 120000,  createdAt: '2026-01-01' },
  { id: '5', accountName: 'Accounts Payable',     accountType: 'Current Liabilities',     detailType: 'Accounts Payable',          runningBalance: 0,       createdAt: '2026-01-01' },
  { id: '6', accountName: 'Owner\'s Capital',     accountType: 'Equity',                  detailType: 'Capital',                   runningBalance: 500000,  createdAt: '2026-01-01' },
  { id: '7', accountName: 'Service Revenue',      accountType: 'Revenue',                 detailType: 'Service Revenue',           runningBalance: 0,       createdAt: '2026-01-01' },
];

const EMPTY_FORM: FormState = {
  accountName: '',
  accountType: '',
  detailType: '',
  runningBalance: '',
};

// ─── Searchable Select ────────────────────────────────────────────────────────

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  error?: string;
}

function SearchableSelect({ options, value, onChange, placeholder, disabled, error }: SearchableSelectProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

   
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);
   

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
          ${disabled ? 'cursor-not-allowed opacity-50 bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400 cursor-pointer'}
          ${error ? 'border-red-400 ring-1 ring-red-400' : ''}
        `}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">No options found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-amber-50 hover:text-amber-800
                    ${value === opt ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-slate-700'}`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Account Modal ────────────────────────────────────────────────────────

interface AddAccountModalProps {
  onClose: () => void;
  onSave: (account: Omit<Account, 'id' | 'createdAt'>) => void;
}

function AddAccountModal({ onClose, onSave }: AddAccountModalProps): React.ReactNode {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const detailOptions = form.accountType ? DETAIL_TYPE_MAP[form.accountType as AccountType] : [];

  function handleAccountTypeChange(val: string) {
    setForm((p) => ({ ...p, accountType: val as AccountType, detailType: '' }));
    setErrors((p) => ({ ...p, accountType: undefined, detailType: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.accountName.trim()) e.accountName = 'Account Name is required.';
    if (!form.accountType) e.accountType = 'Account Type is required.';
    if (!form.detailType) e.detailType = 'Detail Type is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      accountName: form.accountName.trim(),
      accountType: form.accountType as AccountType,
      detailType: form.detailType,
      runningBalance: parseFloat(form.runningBalance) || 0,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Add New Account</h2>
              <p className="text-xs text-slate-500">Chart of Accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Account Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => {
                setForm((p) => ({ ...p, accountName: e.target.value }));
                setErrors((p) => ({ ...p, accountName: undefined }));
              }}
              placeholder="e.g. Cash on Hand"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors
                ${errors.accountName ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            />
            {errors.accountName && (
              <p className="mt-1 text-xs text-red-500">{errors.accountName}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Account Type <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={ACCOUNT_TYPES}
              value={form.accountType}
              onChange={handleAccountTypeChange}
              placeholder="Select account type..."
              error={errors.accountType}
            />
            {errors.accountType && (
              <p className="mt-1 text-xs text-red-500">{errors.accountType}</p>
            )}
          </div>

          {/* Detail Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Detail Type <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={detailOptions}
              value={form.detailType}
              onChange={(val) => {
                setForm((p) => ({ ...p, detailType: val }));
                setErrors((p) => ({ ...p, detailType: undefined }));
              }}
              placeholder={form.accountType ? 'Select detail type...' : 'Select account type first'}
              disabled={!form.accountType}
              error={errors.detailType}
            />
            {errors.detailType && (
              <p className="mt-1 text-xs text-red-500">{errors.detailType}</p>
            )}
          </div>

          {/* Running Balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Opening Balance <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium select-none">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.runningBalance}
                onChange={(e) => setForm((p) => ({ ...p, runningBalance: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 pt-1" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all"
            >
              Save Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ChartofAccounts(): React.ReactNode {
  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AccountType | 'All'>('All');

  function handleSave(data: Omit<Account, 'id' | 'createdAt'>) {
    setAccounts((prev) => [
      ...prev,
      {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().split('T')[0],
      },
    ]);
  }

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchesSearch =
        search.trim() === '' ||
        a.accountName.toLowerCase().includes(search.toLowerCase()) ||
        a.detailType.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'All' || a.accountType === filterType;
      return matchesSearch && matchesType;
    });
  }, [accounts, search, filterType]);

  // Group by account type for the table sections
  const grouped = useMemo(() => {
    const order: AccountType[] = [
      'Current Assets',
      'Non-Current Assets',
      'Current Liabilities',
      'Non-Current Liabilities',
      'Equity',
      'Revenue',
    ];
    return order
      .map((type) => ({
        type,
        items: filtered.filter((a) => a.accountType === type),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const typeTotal = (type: AccountType) =>
    accounts
      .filter((a) => a.accountType === type)
      .reduce((s, a) => s + a.runningBalance, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your account structure for accurate financial reporting.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all shrink-0"
        >
          <Plus size={16} />
          Add New Account
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {ACCOUNT_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const count = accounts.filter((a) => a.accountType === type).length;
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? 'All' : type)}
              className={`text-left rounded-xl border p-3.5 transition-all hover:shadow-sm
                ${filterType === type ? `${meta.color} border-current shadow-sm` : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={filterType === type ? '' : 'text-slate-400'}>{meta.icon}</span>
                <span className={`text-xs font-bold uppercase tracking-wide ${filterType === type ? '' : 'text-slate-500'}`}>
                  {type}
                </span>
              </div>
              <p className={`text-lg font-black ${filterType === type ? '' : 'text-slate-900'}`}>
                {count}
              </p>
              <p className={`text-[11px] mt-0.5 ${filterType === type ? 'opacity-75' : 'text-slate-400'}`}>
                ₱{typeTotal(type).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          />
        </div>
        {filterType !== 'All' && (
          <button
            onClick={() => setFilterType('All')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X size={13} />
            Clear filter
          </button>
        )}
      </div>

      {/* Accounts Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen size={32} className="text-slate-300" />
            <p className="text-sm text-slate-400">No accounts found.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              Add your first account
            </button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-8">#</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Detail Type</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(({ type, items }) => {
                  const meta = TYPE_META[type];
                  const subtotal = items.reduce((s, a) => s + a.runningBalance, 0);
                  return (
                    <React.Fragment key={type}>
                      {/* Group header row */}
                      <tr className="bg-slate-50/70 border-y border-slate-200">
                        <td colSpan={5} className="px-5 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.color}`}>
                              {meta.icon}
                              {type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {items.length} account{items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Data rows */}
                      {items.map((account, idx) => (
                        <tr
                          key={account.id}
                          className={`border-b border-slate-100 hover:bg-amber-50/40 transition-colors ${idx === items.length - 1 ? 'border-b-slate-200' : ''}`}
                        >
                          <td className="px-5 py-3.5 text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-800">{account.accountName}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                              {account.accountType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            {account.detailType}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`font-bold tabular-nums ${account.runningBalance > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                              {account.runningBalance === 0
                                ? '—'
                                : `₱${account.runningBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Subtotal row */}
                      <tr className="bg-slate-50 border-b-2 border-slate-300">
                        <td colSpan={4} className="px-5 py-2.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            Total {type}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span className="text-xs font-black text-slate-700 tabular-nums">
                            ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* Grand total footer */}
              <tfoot>
                <tr className="bg-amber-600 text-white">
                  <td colSpan={4} className="px-5 py-3">
                    <span className="text-xs font-black uppercase tracking-widest">Grand Total</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm font-black tabular-nums">
                      ₱{filtered.reduce((s, a) => s + a.runningBalance, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && <AddAccountModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}
