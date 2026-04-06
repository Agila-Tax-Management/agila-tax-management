// src/components/accounting/AccountingSettings.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, Search, ChevronDown, X,
  Settings, TrendingUp, Wallet, Scale, BarChart2, Trash2, Pencil,
  PenLine, FileText, CreditCard, Receipt, Download, Hash, ListFilter, SlidersHorizontal,
} from 'lucide-react';
import { SEED_ACCOUNTS } from './ChartofAccounts';
import type { Account, AccountType } from './ChartofAccounts';

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
  'Current Assets':          ['Cash and Cash Equivalents', 'Accounts Receivable', 'Prepaid Expenses', 'Inventory', 'Loans to Owner'],
  'Non-Current Assets':      ['Vehicles', 'Properties', 'Equipment'],
  'Current Liabilities':     ['Accounts Payable', 'Client Funds'],
  'Non-Current Liabilities': ['Loans Payable', 'Mortgage Payable'],
  Equity:                    ['Capital', 'Drawing', 'Adjustments'],
  Revenue:                   ['Service Revenue', 'Sales - Retail', 'Sales - Wholesale', 'Other Income'],
};

const TYPE_BADGE: Record<AccountType, string> = {
  'Current Assets':          'bg-blue-100 text-blue-700',
  'Non-Current Assets':      'bg-indigo-100 text-indigo-700',
  'Current Liabilities':     'bg-rose-100 text-rose-700',
  'Non-Current Liabilities': 'bg-orange-100 text-orange-700',
  Equity:                    'bg-emerald-100 text-emerald-700',
  Revenue:                   'bg-amber-100 text-amber-700',
};

const TYPE_ICON: Record<AccountType, React.ReactNode> = {
  'Current Assets':          <Wallet size={12} />,
  'Non-Current Assets':      <Wallet size={12} />,
  'Current Liabilities':     <Scale size={12} />,
  'Non-Current Liabilities': <Scale size={12} />,
  Equity:                    <TrendingUp size={12} />,
  Revenue:                   <BarChart2 size={12} />,
};

// ─── Journal Settings constants ───────────────────────────────────────────────

type TxType = 'Journal Entry' | 'Invoice' | 'Payment' | 'Expense' | 'Receipt';

const TRANSACTION_TYPE_KEYS: TxType[] = ['Journal Entry', 'Invoice', 'Payment', 'Expense', 'Receipt'];

const TX_DEFAULT_PREFIXES: Record<TxType, string> = {
  'Journal Entry': 'JE',
  'Invoice':       'INV',
  'Payment':       'PMT',
  'Expense':       'EXP',
  'Receipt':       'REC',
};

const TX_ICON: Record<TxType, React.ReactNode> = {
  'Journal Entry': <PenLine size={14} className="text-slate-500" />,
  'Invoice':       <FileText size={14} className="text-blue-500" />,
  'Payment':       <CreditCard size={14} className="text-emerald-500" />,
  'Expense':       <Receipt size={14} className="text-rose-500" />,
  'Receipt':       <Download size={14} className="text-violet-500" />,
};

const TX_DESC: Record<TxType, string> = {
  'Journal Entry': 'Manual double-entry bookkeeping records',
  'Invoice':       'Client billing and accounts receivable',
  'Payment':       'Client payment collection records',
  'Expense':       'Business expense and cost recordings',
  'Receipt':       'Cash receipt acknowledgment entries',
};

// ─── Form types ────────────────────────────────────────────────────────────────

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

const EMPTY_FORM: FormState = { accountName: '', accountType: '', detailType: '', runningBalance: '' };

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
          ${error ? 'border-red-400 ring-1 ring-red-400' : ''}`}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
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
                  onClick={() => { onChange(opt); setOpen(false); setQuery(''); }}
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

// ─── Add / Edit Account Modal ─────────────────────────────────────────────────

interface AccountModalProps {
  initial?: Account;
  onClose: () => void;
  onSave: (data: Omit<Account, 'id' | 'createdAt'>) => void;
}

function AccountModal({ initial, onClose, onSave }: AccountModalProps): React.ReactNode {
  const [form, setForm] = useState<FormState>(
    initial
      ? { accountName: initial.accountName, accountType: initial.accountType, detailType: initial.detailType, runningBalance: String(initial.runningBalance) }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const detailOptions = form.accountType ? DETAIL_TYPE_MAP[form.accountType as AccountType] : [];
  const isEdit = !!initial;

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isEdit ? 'Edit Account' : 'Add New Account'}
              </h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Account Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => { setForm((p) => ({ ...p, accountName: e.target.value })); setErrors((p) => ({ ...p, accountName: undefined })); }}
              placeholder="e.g. Cash on Hand"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors
                ${errors.accountName ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            />
            {errors.accountName && <p className="mt-1 text-xs text-red-500">{errors.accountName}</p>}
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
            {errors.accountType && <p className="mt-1 text-xs text-red-500">{errors.accountType}</p>}
          </div>

          {/* Detail Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Detail Type <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={detailOptions}
              value={form.detailType}
              onChange={(val) => { setForm((p) => ({ ...p, detailType: val })); setErrors((p) => ({ ...p, detailType: undefined })); }}
              placeholder={form.accountType ? 'Select detail type...' : 'Select account type first'}
              disabled={!form.accountType}
              error={errors.detailType}
            />
            {errors.detailType && <p className="mt-1 text-xs text-red-500">{errors.detailType}</p>}
          </div>

          {/* Opening Balance */}
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

          <div className="border-t border-slate-100 pt-1" />

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
              {isEdit ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

interface DeleteModalProps {
  account: Account;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteModal({ account, onClose, onConfirm }: DeleteModalProps): React.ReactNode {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-4">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Delete Account</h2>
          <p className="text-xs text-slate-500">
            Are you sure you want to remove <span className="font-semibold text-slate-700">{account.accountName}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 pb-5">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${checked ? 'bg-amber-600' : 'bg-slate-200'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AccountingSettings(): React.ReactNode {
  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<'accounts' | 'journal'>('accounts');
  const [defaultStatus, setDefaultStatus] = useState<'Draft' | 'Posted'>('Draft');
  const [prefixes, setPrefixes] = useState<Record<TxType, string>>({ ...TX_DEFAULT_PREFIXES });
  const [enabledTypes, setEnabledTypes] = useState<Record<TxType, boolean>>({
    'Journal Entry': true, Invoice: true, Payment: true, Expense: true, Receipt: true,
  });

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

  function handleAdd(data: Omit<Account, 'id' | 'createdAt'>) {
    setAccounts((prev) => [
      ...prev,
      { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString().split('T')[0] },
    ]);
  }

  function handleEdit(data: Omit<Account, 'id' | 'createdAt'>) {
    if (!editTarget) return;
    setAccounts((prev) =>
      prev.map((a) => (a.id === editTarget.id ? { ...a, ...data } : a)),
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">ACF Settings</h1>
          <p className="text-sm text-slate-500">Accounting &amp; Finance configuration</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'accounts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BookOpen size={15} />
          Chart of Accounts
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'journal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <PenLine size={15} />
          Journal
        </button>
      </div>

      {/* ─── Chart of Accounts tab ─── */}
      {activeTab === 'accounts' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <BookOpen size={16} className="text-amber-600" />
              <span className="text-sm font-bold text-slate-900">Chart of Accounts</span>
              <span className="text-xs text-slate-400 font-medium">({accounts.length} accounts)</span>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all"
            >
              <Plus size={13} />
              Add Account
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-slate-100">
            <div className="relative max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Accounts table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <BookOpen size={28} className="text-slate-300" />
              <p className="text-sm text-slate-400">No accounts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Name</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Type</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Detail Type</th>
                    <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Opening Balance</th>
                    <th className="w-20 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((account) => (
                    <tr key={account.id} className="border-b border-slate-100 hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 text-sm">{account.accountName}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[account.accountType]}`}>
                          {TYPE_ICON[account.accountType]}
                          {account.accountType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{account.detailType}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`text-sm font-semibold tabular-nums ${account.runningBalance > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                          {account.runningBalance === 0
                            ? '—'
                            : `₱${account.runningBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditTarget(account)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(account)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Journal Settings tab ─── */}
      {activeTab === 'journal' && (
        <div className="space-y-5">

          {/* Default Entry Status */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-200 bg-slate-50">
              <SlidersHorizontal size={16} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-slate-900">Default Entry Status</p>
                <p className="text-xs text-slate-400 mt-0.5">Status applied when creating a new journal entry.</p>
              </div>
            </div>
            <div className="px-6 py-5 flex flex-wrap items-start gap-8">
              {(['Draft', 'Posted'] as const).map((s) => (
                <label key={s} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultStatus"
                    value={s}
                    checked={defaultStatus === s}
                    onChange={() => setDefaultStatus(s)}
                    className="mt-0.5 w-4 h-4 accent-amber-600 cursor-pointer"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${defaultStatus === s ? 'text-amber-700' : 'text-slate-700'}`}>{s}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s === 'Draft' ? 'Saved but not posted to the ledger' : 'Immediately recorded in the ledger'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reference Number Prefixes */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-200 bg-slate-50">
              <Hash size={16} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-slate-900">Reference Number Prefixes</p>
                <p className="text-xs text-slate-400 mt-0.5">Prefix used when auto-generating reference numbers per transaction type.</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {TRANSACTION_TYPE_KEYS.map((type) => (
                <div key={type} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {TX_ICON[type]}
                    <span className="text-sm font-medium text-slate-800">{type}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="text"
                      value={prefixes[type]}
                      onChange={(e) =>
                        setPrefixes((p) => ({
                          ...p,
                          [type]: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6),
                        }))
                      }
                      maxLength={6}
                      className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono text-slate-900 text-center uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors hover:border-slate-300"
                    />
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                      {prefixes[type] || '??'}-{new Date().getFullYear()}-0001
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Transaction Types */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-200 bg-slate-50">
              <ListFilter size={16} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-slate-900">Allowed Transaction Types</p>
                <p className="text-xs text-slate-400 mt-0.5">Control which transaction types appear when creating journal entries.</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {TRANSACTION_TYPE_KEYS.map((type) => (
                <div key={type} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    {TX_ICON[type]}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{type}</p>
                      <p className="text-xs text-slate-400">{TX_DESC[type]}</p>
                    </div>
                  </div>
                  <Toggle
                    checked={enabledTypes[type]}
                    onChange={(v) => setEnabledTypes((p) => ({ ...p, [type]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <AccountModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}

      {/* Edit modal */}
      {editTarget && (
        <AccountModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteModal
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
