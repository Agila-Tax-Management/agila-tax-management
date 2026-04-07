// src/components/accounting/AccountingSettings.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, Plus, Search, X,
  Settings, TrendingUp, Wallet, Scale, BarChart2, Trash2, Pencil,
  PenLine, FileText, CreditCard, Receipt, Download, Hash, ListFilter, SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import type { GlAccountRecord } from './ChartofAccounts';
import { useToast } from '@/context/ToastContext';

// ─── API types ─────────────────────────────────────────────────────────────────

interface ApiDetailType { id: number; name: string }
interface ApiAccountType {
  id: number;
  name: string;
  group: string;
  normalBalance: string;
  detailTypes: ApiDetailType[];
}

// ─── Badge / Icon maps per DB financial group ────────────────────────────────

const GROUP_BADGE: Record<string, string> = {
  ASSET:     'bg-blue-100 text-blue-700',
  LIABILITY: 'bg-rose-100 text-rose-700',
  EQUITY:    'bg-emerald-100 text-emerald-700',
  REVENUE:   'bg-amber-100 text-amber-700',
  EXPENSE:   'bg-violet-100 text-violet-700',
};

const GROUP_ICON: Record<string, React.ReactNode> = {
  ASSET:     <Wallet size={12} />,
  LIABILITY: <Scale size={12} />,
  EQUITY:    <TrendingUp size={12} />,
  REVENUE:   <BarChart2 size={12} />,
  EXPENSE:   <BookOpen size={12} />,
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

// ─── GL Account form types ────────────────────────────────────────────────────

interface GlFormState {
  accountCode: string;
  name: string;
  accountTypeId: number | '';
  accountDetailTypeId: number | '';
  openingBalance: string;
  isBankAccount: boolean;
  description: string;
}

interface GlFormErrors {
  accountCode?: string;
  name?: string;
  accountTypeId?: string;
  accountDetailTypeId?: string;
}

const EMPTY_GL_FORM: GlFormState = {
  accountCode: '',
  name: '',
  accountTypeId: '',
  accountDetailTypeId: '',
  openingBalance: '',
  isBankAccount: false,
  description: '',
};

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

// ─── GL Account Modal (Add / Edit) ────────────────────────────────────────────

interface GlAccountModalProps {
  initial?: GlAccountRecord;
  accountTypes: ApiAccountType[];
  onClose: () => void;
  onSuccess: () => void;
}

function GlAccountModal({ initial, accountTypes, onClose, onSuccess }: GlAccountModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const isEdit = !!initial;

  const [form, setForm] = useState<GlFormState>(() =>
    initial
      ? {
          accountCode: initial.accountCode,
          name: initial.name,
          accountTypeId: initial.accountTypeId,
          accountDetailTypeId: initial.accountDetailTypeId,
          openingBalance: initial.openingBalance != null ? String(initial.openingBalance) : '',
          isBankAccount: initial.isBankAccount,
          description: initial.description ?? '',
        }
      : EMPTY_GL_FORM,
  );
  const [errors, setErrors] = useState<GlFormErrors>({});
  const [saving, setSaving] = useState(false);

  const detailOptions =
    form.accountTypeId !== ''
      ? (accountTypes.find((t) => t.id === form.accountTypeId)?.detailTypes ?? [])
      : [];

  function validate(): boolean {
    const e: GlFormErrors = {};
    if (!form.accountCode.trim()) e.accountCode = 'Account code is required.';
    if (!form.name.trim()) e.name = 'Account name is required.';
    if (form.accountTypeId === '') e.accountTypeId = 'Account type is required.';
    if (form.accountDetailTypeId === '') e.accountDetailTypeId = 'Detail type is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        accountCode: form.accountCode.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        accountTypeId: Number(form.accountTypeId),
        accountDetailTypeId: Number(form.accountDetailTypeId),
        openingBalance: form.openingBalance !== '' ? parseFloat(form.openingBalance) : null,
        isBankAccount: form.isBankAccount,
        isActive: true,
      };
      const url = isEdit ? `/api/accounting/gl-accounts/${initial!.id}` : '/api/accounting/gl-accounts';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Failed to save', json.error ?? 'Something went wrong.');
        return;
      }
      success(
        isEdit ? 'Account updated' : 'Account added',
        isEdit
          ? `${form.name} has been updated.`
          : `${form.name} (${form.accountCode}) has been added.`,
      );
      onSuccess();
      onClose();
    } catch {
      toastError('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
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
              <h2 className="text-sm font-bold text-slate-900">{isEdit ? 'Edit Account' : 'Add New Account'}</h2>
              <p className="text-xs text-slate-500">Chart of Accounts</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="p-6 space-y-4">
          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Account Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.accountCode}
                onChange={(e) => { setForm((p) => ({ ...p, accountCode: e.target.value })); setErrors((p) => ({ ...p, accountCode: undefined })); }}
                placeholder="e.g. 1001"
                className={`w-full rounded-lg border px-3 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.accountCode ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
              />
              {errors.accountCode && <p className="mt-1 text-xs text-red-500">{errors.accountCode}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })); }}
                placeholder="e.g. Cash on Hand"
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.accountTypeId}
              onChange={(e) => {
                const id = e.target.value === '' ? '' : Number(e.target.value);
                setForm((p) => ({ ...p, accountTypeId: id, accountDetailTypeId: '' }));
                setErrors((p) => ({ ...p, accountTypeId: undefined, accountDetailTypeId: undefined }));
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.accountTypeId ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            >
              <option value="">Select account type…</option>
              {accountTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.accountTypeId && <p className="mt-1 text-xs text-red-500">{errors.accountTypeId}</p>}
          </div>

          {/* Detail Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Detail Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.accountDetailTypeId}
              disabled={form.accountTypeId === ''}
              onChange={(e) => {
                const id = e.target.value === '' ? '' : Number(e.target.value);
                setForm((p) => ({ ...p, accountDetailTypeId: id }));
                setErrors((p) => ({ ...p, accountDetailTypeId: undefined }));
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 ${errors.accountDetailTypeId ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            >
              <option value="">{form.accountTypeId === '' ? 'Select account type first' : 'Select detail type…'}</option>
              {detailOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.accountDetailTypeId && <p className="mt-1 text-xs text-red-500">{errors.accountDetailTypeId}</p>}
          </div>

          {/* Opening Balance + Bank Account toggle */}
          <div className="grid grid-cols-2 gap-4">
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
                  value={form.openingBalance}
                  onChange={(e) => setForm((p) => ({ ...p, openingBalance: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="text-xs font-semibold text-slate-700">Bank Account</span>
                <Toggle checked={form.isBankAccount} onChange={(v) => setForm((p) => ({ ...p, isBankAccount: v }))} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Description <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this account…"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
            />
          </div>

          <div className="border-t border-slate-100 pt-1" />

          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60">
              {saving && <RefreshCw size={12} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

interface DeleteConfirmProps {
  account: GlAccountRecord;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteConfirmModal({ account, onClose, onSuccess }: DeleteConfirmProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounting/gl-accounts/${account.id}`, { method: 'DELETE' });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Cannot delete', json.error ?? 'Something went wrong.');
        onClose();
        return;
      }
      success('Account deleted', `${account.name} has been removed.`);
      onSuccess();
      onClose();
    } catch {
      toastError('Network error', 'Could not connect to the server.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-4">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Delete Account</h2>
          <p className="text-xs text-slate-500">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-slate-700">{account.name}</span> ({account.accountCode})?
            This cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 pb-5">
          <button onClick={onClose} disabled={deleting} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => { void handleDelete(); }} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:scale-95 transition-all disabled:opacity-60">
            {deleting && <RefreshCw size={12} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountingSettings(): React.ReactNode {
  const [accounts, setAccounts] = useState<GlAccountRecord[]>([]);
  const [accountTypes, setAccountTypes] = useState<ApiAccountType[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<GlAccountRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlAccountRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'accounts' | 'journal'>('accounts');
  const [defaultStatus, setDefaultStatus] = useState<'Draft' | 'Posted'>('Draft');
  const [prefixes, setPrefixes] = useState<Record<TxType, string>>({ ...TX_DEFAULT_PREFIXES });
  const [enabledTypes, setEnabledTypes] = useState<Record<TxType, boolean>>({
    'Journal Entry': true, Invoice: true, Payment: true, Expense: true, Receipt: true,
  });

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/accounting/gl-accounts?isActive=true');
      if (res.ok) {
        const json = await res.json() as { data: GlAccountRecord[] };
        setAccounts(json.data);
      }
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const fetchAccountTypes = useCallback(async () => {
    const res = await fetch('/api/accounting/gl-accounts/account-types');
    if (res.ok) {
      const json = await res.json() as { data: ApiAccountType[] };
      setAccountTypes(json.data);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
    void fetchAccountTypes();
  }, [fetchAccounts, fetchAccountTypes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.accountCode.toLowerCase().includes(q) ||
        a.accountType.name.toLowerCase().includes(q) ||
        a.accountDetailType.name.toLowerCase().includes(q),
    );
  }, [accounts, search]);

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
              {!loadingAccounts && (
                <span className="text-xs text-slate-400 font-medium">({accounts.length} accounts)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { void fetchAccounts(); }}
                disabled={loadingAccounts}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={loadingAccounts ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all"
              >
                <Plus size={13} />
                Add Account
              </button>
            </div>
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
          {loadingAccounts ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <RefreshCw size={22} className="text-slate-300 animate-spin" />
              <p className="text-sm text-slate-400">Loading accounts…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <BookOpen size={28} className="text-slate-300" />
              <p className="text-sm text-slate-400">
                {search.trim() ? 'No accounts match your search.' : 'No accounts found. Add your first account.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Code</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Name</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Type</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Detail Type</th>
                    <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Opening Balance</th>
                    <th className="w-20 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((account) => {
                    const badge = GROUP_BADGE[account.accountType.group] ?? 'bg-slate-100 text-slate-700';
                    const icon  = GROUP_ICON[account.accountType.group];
                    return (
                      <tr key={account.id} className="border-b border-slate-100 hover:bg-amber-50/30 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{account.accountCode}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-sm">{account.name}</span>
                            {account.isBankAccount && (
                              <span className="text-[10px] font-semibold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">Bank</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
                            {icon}
                            {account.accountType.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">{account.accountDetailType.name}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`text-sm font-semibold tabular-nums ${account.openingBalance != null && account.openingBalance > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                            {account.openingBalance != null && account.openingBalance > 0
                              ? `₱${account.openingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                              : '—'}
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
                    );
                  })}
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
        <GlAccountModal
          accountTypes={accountTypes}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { void fetchAccounts(); }}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <GlAccountModal
          initial={editTarget}
          accountTypes={accountTypes}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { void fetchAccounts(); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { void fetchAccounts(); }}
        />
      )}
    </div>
  );
}
