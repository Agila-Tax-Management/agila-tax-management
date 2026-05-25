// src/components/accounting/AccountingSettings.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, Plus, Search, X,
  Settings, TrendingUp, Wallet, Scale, BarChart2, Trash2, Pencil,
  PenLine, FileText, CreditCard, Receipt, Download, Hash, ListFilter,
  RefreshCw, AlertTriangle, Tag, Mail, Smartphone, Landmark, Wallet2,
  Banknote, Users,
} from 'lucide-react';
import type { GlAccountRecord } from './ChartofAccounts';
import { useToast } from '@/context/ToastContext';

// ─── API types ─────────────────────────────────────────────────────────────────

interface ApiDetailType {
  id: number;
  name: string;
  accountTypeId: number;
  accountType: { id: number; name: string; group: string };
  _count: { accounts: number };
}

interface ApiAccountType {
  id: number;
  name: string;
  group: string;
  normalBalance: string;
  detailTypes?: { id: number; name: string }[];
  _count?: { detailTypes: number; accounts: number };
}

// ─── Accounting Settings (singleton) ─────────────────────────────────────────

interface ApiAccountingSetting {
  id: string;
  invoiceEmail: string | null;
  invoicePhoneNumber: string | null;
  defaultCustodianId: string | null;
  defaultCustodianName: string | null;
  defaultAccountingManagerId: string | null;
  defaultAccountingManagerName: string | null;
  pcfNumberPrefix: string;
  cftNumberPrefix: string;
}

// ─── Payment Method types ─────────────────────────────────────────────────────

interface ApiPaymentMethodBank {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
  sortOrder: number;
}

interface ApiPaymentMethodEWallet {
  id: number;
  eWalletName: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
  sortOrder: number;
}

interface ApiPaymentMethodCash {
  id: number;
  payableTo: string;
  instructions: string | null;
  isActive: boolean;
}

// ─── User search result ───────────────────────────────────────────────────────

interface ApiUserSearchResult {
  id: string;
  name: string | null;
  email: string;
}

// ─── Badge / Icon maps per DB financial group ─────────────────────────────────

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

const GROUP_LABELS: Record<string, string> = {
  ASSET:     'Asset',
  LIABILITY: 'Liability',
  EQUITY:    'Equity',
  REVENUE:   'Revenue',
  EXPENSE:   'Expense',
};

const FINANCIAL_GROUPS = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const;
const NORMAL_BALANCES = ['DEBIT', 'CREDIT'] as const;

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

// ─── Account Type Modal (Add / Edit) ─────────────────────────────────────────

interface AccountTypeModalProps {
  initial?: ApiAccountType;
  onClose: () => void;
  onSuccess: () => void;
}

function AccountTypeModal({ initial, onClose, onSuccess }: AccountTypeModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [group, setGroup] = useState<string>(initial?.group ?? '');
  const [normalBalance, setNormalBalance] = useState<string>(initial?.normalBalance ?? '');
  const [errors, setErrors] = useState<{ name?: string; group?: string; normalBalance?: string }>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!group) e.group = 'Financial group is required.';
    if (!normalBalance) e.normalBalance = 'Normal balance is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/accounting/account-types/${initial!.id}` : '/api/accounting/account-types';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), group, normalBalance }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Failed to save', json.error ?? 'Something went wrong.');
        return;
      }
      success(isEdit ? 'Type updated' : 'Type added', `"${name.trim()}" has been ${isEdit ? 'updated' : 'added'}.`);
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
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <Tag size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{isEdit ? 'Edit Account Type' : 'Add Account Type'}</h2>
              <p className="text-xs text-slate-500">Account Settings</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="e.g. Current Assets"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Financial Group <span className="text-red-500">*</span>
            </label>
            <select
              value={group}
              onChange={(e) => { setGroup(e.target.value); setErrors((p) => ({ ...p, group: undefined })); }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.group ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            >
              <option value="">Select group…</option>
              {FINANCIAL_GROUPS.map((g) => (
                <option key={g} value={g}>{GROUP_LABELS[g]}</option>
              ))}
            </select>
            {errors.group && <p className="mt-1 text-xs text-red-500">{errors.group}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Normal Balance <span className="text-red-500">*</span>
            </label>
            <select
              value={normalBalance}
              onChange={(e) => { setNormalBalance(e.target.value); setErrors((p) => ({ ...p, normalBalance: undefined })); }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.normalBalance ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            >
              <option value="">Select normal balance…</option>
              {NORMAL_BALANCES.map((nb) => (
                <option key={nb} value={nb}>{nb.charAt(0) + nb.slice(1).toLowerCase()}</option>
              ))}
            </select>
            {errors.normalBalance && <p className="mt-1 text-xs text-red-500">{errors.normalBalance}</p>}
          </div>
          <div className="border-t border-slate-100 pt-1" />
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60">
              {saving && <RefreshCw size={12} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Account Type Modal ────────────────────────────────────────────────

interface DeleteAccountTypeProps {
  accountType: ApiAccountType;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteAccountTypeModal({ accountType, onClose, onSuccess }: DeleteAccountTypeProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [deleting, setDeleting] = useState(false);
  const accountCount = accountType._count?.accounts ?? 0;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounting/account-types/${accountType.id}`, { method: 'DELETE' });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Cannot delete', json.error ?? 'Something went wrong.');
        onClose();
        return;
      }
      success('Type deleted', `"${accountType.name}" has been removed.`);
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
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-2">Delete Account Type</h2>
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-3">
            <p className="text-xs font-semibold text-red-700 mb-1">⚠ This may destroy ledger integrity</p>
            <p className="text-xs text-red-600">
              All detail types and GL accounts linked to <span className="font-semibold">{accountType.name}</span> will be affected.
              {accountCount > 0 && (
                <span> This type currently has <span className="font-bold">{accountCount} GL account{accountCount !== 1 ? 's' : ''}</span> linked — deletion is blocked until they are removed.</span>
              )}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-700">{accountType.name}</span>? This cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 pb-5">
          <button onClick={onClose} disabled={deleting} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => { void handleDelete(); }}
            disabled={deleting || accountCount > 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting && <RefreshCw size={12} className="animate-spin" />}
            Delete Type
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Type Modal (Add / Edit) ──────────────────────────────────────────

interface DetailTypeModalProps {
  initial?: ApiDetailType;
  accountTypes: ApiAccountType[];
  onClose: () => void;
  onSuccess: () => void;
}

function DetailTypeModal({ initial, accountTypes, onClose, onSuccess }: DetailTypeModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [accountTypeId, setAccountTypeId] = useState<number | ''>(initial?.accountTypeId ?? '');
  const [errors, setErrors] = useState<{ name?: string; accountTypeId?: string }>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (accountTypeId === '') e.accountTypeId = 'Account type is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/accounting/account-detail-types/${initial!.id}` : '/api/accounting/account-detail-types';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), accountTypeId: Number(accountTypeId) }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Failed to save', json.error ?? 'Something went wrong.');
        return;
      }
      success(isEdit ? 'Detail type updated' : 'Detail type added', `"${name.trim()}" has been ${isEdit ? 'updated' : 'added'}.`);
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
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <Tag size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{isEdit ? 'Edit Detail Type' : 'Add Detail Type'}</h2>
              <p className="text-xs text-slate-500">Account Settings</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              value={accountTypeId}
              onChange={(e) => { setAccountTypeId(e.target.value === '' ? '' : Number(e.target.value)); setErrors((p) => ({ ...p, accountTypeId: undefined })); }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.accountTypeId ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            >
              <option value="">Select account type…</option>
              {accountTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.accountTypeId && <p className="mt-1 text-xs text-red-500">{errors.accountTypeId}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Detail Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="e.g. Cash and Cash Equivalents"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="border-t border-slate-100 pt-1" />
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60">
              {saving && <RefreshCw size={12} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Detail Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Detail Type Modal ─────────────────────────────────────────────────

interface DeleteDetailTypeProps {
  detailType: ApiDetailType;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteDetailTypeModal({ detailType, onClose, onSuccess }: DeleteDetailTypeProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounting/account-detail-types/${detailType.id}`, { method: 'DELETE' });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Cannot delete', json.error ?? 'Something went wrong.');
        onClose();
        return;
      }
      success('Detail type deleted', `"${detailType.name}" has been removed.`);
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
          <h2 className="text-sm font-bold text-slate-900 mb-1">Delete Detail Type</h2>
          <p className="text-xs text-slate-500">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-700">{detailType.name}</span>? This cannot be undone.
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
              <p className="text-xs text-slate-500">Account Settings</p>
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

          {/* Detail Type — only shown after account type is selected */}
          {form.accountTypeId !== '' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Detail Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.accountDetailTypeId}
                onChange={(e) => {
                  const id = e.target.value === '' ? '' : Number(e.target.value);
                  setForm((p) => ({ ...p, accountDetailTypeId: id }));
                  setErrors((p) => ({ ...p, accountDetailTypeId: undefined }));
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${errors.accountDetailTypeId ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}`}
              >
                <option value="">Select detail type…</option>
                {detailOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.accountDetailTypeId && <p className="mt-1 text-xs text-red-500">{errors.accountDetailTypeId}</p>}
            </div>
          )}

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

// ─── Delete GL Account Modal ─────────────────────────────────────────────────

interface DeleteGlAccountProps {
  account: GlAccountRecord;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteGlAccountModal({ account, onClose, onSuccess }: DeleteGlAccountProps): React.ReactNode {
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

// ─── UserSearchInput ──────────────────────────────────────────────────────────

interface UserSearchInputProps {
  label: string;
  selectedId: string | null;
  selectedName: string;
  onSelect: (id: string, name: string) => void;
  onClear: () => void;
}

function UserSearchInput({ label, selectedId, selectedName, onSelect, onClear }: UserSearchInputProps): React.ReactNode {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiUserSearchResult[]>([]);
  const [open, setOpen] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=6`);
    if (res.ok) {
      const json = await res.json() as { data: ApiUserSearchResult[] };
      setResults(json.data);
    }
  }, []);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">{label}</label>
      {selectedId ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-amber-50 px-3 py-2">
          <Users size={14} className="text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1 truncate">{selectedName || selectedId}</span>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-red-600 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); void doSearch(e.target.value); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          />
          {open && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-white shadow-lg overflow-hidden">
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onSelect(u.id, u.name ?? u.email); setQuery(''); setResults([]); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Users size={11} className="text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{u.name ?? '—'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BankMethodModal ──────────────────────────────────────────────────────────

interface BankMethodModalProps {
  initial?: ApiPaymentMethodBank;
  onClose: () => void;
  onSuccess: () => void;
}

function BankMethodModal({ initial, onClose, onSuccess }: BankMethodModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const isEdit = !!initial;
  const [bankName, setBankName]       = useState(initial?.bankName ?? '');
  const [accountName, setAccountName] = useState(initial?.accountName ?? '');
  const [accountNo, setAccountNo]     = useState(initial?.accountNumber ?? '');
  const [errors, setErrors]           = useState<{ bankName?: string; accountName?: string; accountNo?: string }>({});
  const [saving, setSaving]           = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!bankName.trim())   e.bankName    = 'Bank name is required.';
    if (!accountName.trim()) e.accountName = 'Account name is required.';
    if (!accountNo.trim())  e.accountNo   = 'Account number is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/accounting/settings/payment-methods/banks/${initial!.id}`
        : '/api/accounting/settings/payment-methods/banks';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName: bankName.trim(), accountName: accountName.trim(), accountNumber: accountNo.trim() }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toastError('Failed to save', json.error ?? 'Something went wrong.'); return; }
      success(isEdit ? 'Bank updated' : 'Bank added', `${bankName.trim()} has been ${isEdit ? 'updated' : 'added'}.`);
      onSuccess(); onClose();
    } catch { toastError('Network error', 'Could not connect to the server.'); }
    finally { setSaving(false); }
  }

  const inputCls = (err?: string) => `w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${err ? 'border-red-400 ring-1 ring-red-400' : 'border-border hover:border-slate-400'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center"><Landmark size={15} className="text-white" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{isEdit ? 'Edit Bank' : 'Add Bank'}</h2>
              <p className="text-xs text-slate-500">Payment Methods</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"><X size={15} /></button>
        </div>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Bank Name <span className="text-red-500">*</span></label>
            <input type="text" value={bankName} onChange={(e) => { setBankName(e.target.value); setErrors((p) => ({ ...p, bankName: undefined })); }} placeholder="e.g. BDO Unibank" className={inputCls(errors.bankName)} />
            {errors.bankName && <p className="mt-1 text-xs text-red-500">{errors.bankName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Account Name <span className="text-red-500">*</span></label>
            <input type="text" value={accountName} onChange={(e) => { setAccountName(e.target.value); setErrors((p) => ({ ...p, accountName: undefined })); }} placeholder="e.g. Agila Tax Management Solutions" className={inputCls(errors.accountName)} />
            {errors.accountName && <p className="mt-1 text-xs text-red-500">{errors.accountName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Account Number <span className="text-red-500">*</span></label>
            <input type="text" value={accountNo} onChange={(e) => { setAccountNo(e.target.value); setErrors((p) => ({ ...p, accountNo: undefined })); }} placeholder="e.g. 1234 5678 9012" className={inputCls(errors.accountNo)} />
            {errors.accountNo && <p className="mt-1 text-xs text-red-500">{errors.accountNo}</p>}
          </div>
          <div className="border-t border-slate-100 pt-1" />
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60">
              {saving && <RefreshCw size={12} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EWalletMethodModal ───────────────────────────────────────────────────────

interface EWalletMethodModalProps {
  initial?: ApiPaymentMethodEWallet;
  onClose: () => void;
  onSuccess: () => void;
}

function EWalletMethodModal({ initial, onClose, onSuccess }: EWalletMethodModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const isEdit = !!initial;
  const [walletName, setWalletName]   = useState(initial?.eWalletName ?? '');
  const [accountName, setAccountName] = useState(initial?.accountName ?? '');
  const [accountNo, setAccountNo]     = useState(initial?.accountNumber ?? '');
  const [errors, setErrors]           = useState<{ walletName?: string; accountName?: string; accountNo?: string }>({});
  const [saving, setSaving]           = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!walletName.trim())  e.walletName  = 'E-Wallet name is required.';
    if (!accountName.trim()) e.accountName = 'Account name is required.';
    if (!accountNo.trim())   e.accountNo   = 'Account number / mobile number is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/accounting/settings/payment-methods/ewallets/${initial!.id}`
        : '/api/accounting/settings/payment-methods/ewallets';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eWalletName: walletName.trim(), accountName: accountName.trim(), accountNumber: accountNo.trim() }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toastError('Failed to save', json.error ?? 'Something went wrong.'); return; }
      success(isEdit ? 'E-Wallet updated' : 'E-Wallet added', `${walletName.trim()} has been ${isEdit ? 'updated' : 'added'}.`);
      onSuccess(); onClose();
    } catch { toastError('Network error', 'Could not connect to the server.'); }
    finally { setSaving(false); }
  }

  const inputCls = (err?: string) => `w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${err ? 'border-red-400 ring-1 ring-red-400' : 'border-border hover:border-slate-400'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center"><Wallet2 size={15} className="text-white" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{isEdit ? 'Edit E-Wallet' : 'Add E-Wallet'}</h2>
              <p className="text-xs text-slate-500">Payment Methods</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"><X size={15} /></button>
        </div>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">E-Wallet Name <span className="text-red-500">*</span></label>
            <input type="text" value={walletName} onChange={(e) => { setWalletName(e.target.value); setErrors((p) => ({ ...p, walletName: undefined })); }} placeholder="e.g. GCash, Maya" className={inputCls(errors.walletName)} />
            {errors.walletName && <p className="mt-1 text-xs text-red-500">{errors.walletName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Account Name <span className="text-red-500">*</span></label>
            <input type="text" value={accountName} onChange={(e) => { setAccountName(e.target.value); setErrors((p) => ({ ...p, accountName: undefined })); }} placeholder="e.g. Agila Tax Management" className={inputCls(errors.accountName)} />
            {errors.accountName && <p className="mt-1 text-xs text-red-500">{errors.accountName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Mobile / Account No. <span className="text-red-500">*</span></label>
            <input type="text" value={accountNo} onChange={(e) => { setAccountNo(e.target.value); setErrors((p) => ({ ...p, accountNo: undefined })); }} placeholder="e.g. 0917 123 4567" className={inputCls(errors.accountNo)} />
            {errors.accountNo && <p className="mt-1 text-xs text-red-500">{errors.accountNo}</p>}
          </div>
          <div className="border-t border-slate-100 pt-1" />
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60">
              {saving && <RefreshCw size={12} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add E-Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CashMethodModal ──────────────────────────────────────────────────────────

interface CashMethodModalProps {
  initial?: ApiPaymentMethodCash;
  onClose: () => void;
  onSuccess: () => void;
}

function CashMethodModal({ initial, onClose, onSuccess }: CashMethodModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const isEdit = !!initial;
  const [payableTo, setPayableTo]         = useState(initial?.payableTo ?? '');
  const [instructions, setInstructions]   = useState(initial?.instructions ?? '');
  const [errors, setErrors]               = useState<{ payableTo?: string }>({});
  const [saving, setSaving]               = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!payableTo.trim()) e.payableTo = '"Payable to" is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/accounting/settings/payment-methods/cash/${initial!.id}`
        : '/api/accounting/settings/payment-methods/cash';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payableTo: payableTo.trim(), instructions: instructions.trim() || null }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toastError('Failed to save', json.error ?? 'Something went wrong.'); return; }
      success(isEdit ? 'Cash method updated' : 'Cash method added', `${payableTo.trim()} has been ${isEdit ? 'updated' : 'added'}.`);
      onSuccess(); onClose();
    } catch { toastError('Network error', 'Could not connect to the server.'); }
    finally { setSaving(false); }
  }

  const inputCls = (err?: string) => `w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${err ? 'border-red-400 ring-1 ring-red-400' : 'border-border hover:border-slate-400'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center"><Banknote size={15} className="text-white" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{isEdit ? 'Edit Cash Method' : 'Add Cash Method'}</h2>
              <p className="text-xs text-slate-500">Payment Methods</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"><X size={15} /></button>
        </div>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Payable To <span className="text-red-500">*</span></label>
            <input type="text" value={payableTo} onChange={(e) => { setPayableTo(e.target.value); setErrors((p) => ({ ...p, payableTo: undefined })); }} placeholder="e.g. Agila Tax Management Solutions" className={inputCls(errors.payableTo)} />
            {errors.payableTo && <p className="mt-1 text-xs text-red-500">{errors.payableTo}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Payment Instructions <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Please bring exact change during office hours." rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none" />
          </div>
          <div className="border-t border-slate-100 pt-1" />
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60">
              {saving && <RefreshCw size={12} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Cash Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DeletePaymentMethodModal ─────────────────────────────────────────────────

interface DeletePaymentMethodModalProps {
  label: string;
  name: string;
  apiUrl: string;
  onClose: () => void;
  onSuccess: () => void;
}

function DeletePaymentMethodModal({ label, name, apiUrl, onClose, onSuccess }: DeletePaymentMethodModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(apiUrl, { method: 'DELETE' });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toastError('Cannot delete', json.error ?? 'Something went wrong.'); onClose(); return; }
      success(`${label} deleted`, `"${name}" has been removed.`);
      onSuccess(); onClose();
    } catch { toastError('Network error', 'Could not connect to the server.'); }
    finally { setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-4"><Trash2 size={18} className="text-red-600" /></div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Delete {label}</h2>
          <p className="text-xs text-slate-500">Are you sure you want to remove <span className="font-semibold text-slate-700">{name}</span>? This cannot be undone.</p>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 pb-5">
          <button onClick={onClose} disabled={deleting} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
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
  // ── Main tabs
  type MainTab = 'general' | 'accounting';
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('general');

  // ── Accounting sub-tabs
  type ActiveTab = 'account-names' | 'account-types' | 'detail-types' | 'journal';
  const [activeTab, setActiveTab] = useState<ActiveTab>('account-names');

  // ── General Settings singleton state
  const [generalSettings, setGeneralSettings] = useState<ApiAccountingSetting | null>(null);
  const [prevGeneralSettings, setPrevGeneralSettings] = useState<ApiAccountingSetting | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // ── Invoice Branding form
  const [brandingEmail, setBrandingEmail] = useState('');
  const [brandingPhone, setBrandingPhone] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);

  // ── Petty Cash Workflow form
  const [pcfPrefix, setPcfPrefix] = useState('PCF');
  const [cftPrefix, setCftPrefix] = useState('CFT');
  const [custodianId, setCustodianId]     = useState<string | null>(null);
  const [custodianName, setCustodianName] = useState('');
  const [managerId, setManagerId]         = useState<string | null>(null);
  const [managerName, setManagerName]     = useState('');
  const [savingPettyCash, setSavingPettyCash] = useState(false);

  // ── Payment Methods state
  const [banks, setBanks]           = useState<ApiPaymentMethodBank[]>([]);
  const [loadingBanks, setLoadingBanks]     = useState(true);
  const [showAddBank, setShowAddBank]       = useState(false);
  const [editBank, setEditBank]             = useState<ApiPaymentMethodBank | null>(null);
  const [deleteBank, setDeleteBank]         = useState<ApiPaymentMethodBank | null>(null);

  const [ewallets, setEWallets]             = useState<ApiPaymentMethodEWallet[]>([]);
  const [loadingEWallets, setLoadingEWallets] = useState(true);
  const [showAddEWallet, setShowAddEWallet] = useState(false);
  const [editEWallet, setEditEWallet]       = useState<ApiPaymentMethodEWallet | null>(null);
  const [deleteEWallet, setDeleteEWallet]   = useState<ApiPaymentMethodEWallet | null>(null);

  const [cashMethods, setCashMethods]       = useState<ApiPaymentMethodCash[]>([]);
  const [loadingCash, setLoadingCash]       = useState(true);
  const [showAddCash, setShowAddCash]       = useState(false);
  const [editCash, setEditCash]             = useState<ApiPaymentMethodCash | null>(null);
  const [deleteCash, setDeleteCash]         = useState<ApiPaymentMethodCash | null>(null);

  // Sync form fields when general settings load (adjust state during render pattern)
  if (generalSettings !== prevGeneralSettings) {
    setPrevGeneralSettings(generalSettings);
    if (generalSettings) {
      setBrandingEmail(generalSettings.invoiceEmail ?? '');
      setBrandingPhone(generalSettings.invoicePhoneNumber ?? '');
      setPcfPrefix(generalSettings.pcfNumberPrefix);
      setCftPrefix(generalSettings.cftNumberPrefix);
      setCustodianId(generalSettings.defaultCustodianId);
      setCustodianName(generalSettings.defaultCustodianName ?? '');
      setManagerId(generalSettings.defaultAccountingManagerId);
      setManagerName(generalSettings.defaultAccountingManagerName ?? '');
    }
  }

  // ── GL Accounts state
  const [accounts, setAccounts] = useState<GlAccountRecord[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editAccount, setEditAccount] = useState<GlAccountRecord | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<GlAccountRecord | null>(null);

  // ── Account Types state
  const [accountTypes, setAccountTypes] = useState<ApiAccountType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typeSearch, setTypeSearch] = useState('');
  const [showAddType, setShowAddType] = useState(false);
  const [editType, setEditType] = useState<ApiAccountType | null>(null);
  const [deleteType, setDeleteType] = useState<ApiAccountType | null>(null);

  // ── Detail Types state
  const [detailTypes, setDetailTypes] = useState<ApiDetailType[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [detailSearch, setDetailSearch] = useState('');
  const [showAddDetail, setShowAddDetail] = useState(false);
  const [editDetail, setEditDetail] = useState<ApiDetailType | null>(null);
  const [deleteDetail, setDeleteDetail] = useState<ApiDetailType | null>(null);

  // ── Journal settings
  const [prefixes, setPrefixes] = useState<Record<TxType, string>>({ ...TX_DEFAULT_PREFIXES });
  const [enabledTypes, setEnabledTypes] = useState<Record<TxType, boolean>>({
    'Journal Entry': true, Invoice: true, Payment: true, Expense: true, Receipt: true,
  });

  // ── Account types with nested detail types (for GL account modal)
  const [accountTypesWithDetails, setAccountTypesWithDetails] = useState<ApiAccountType[]>([]);

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
    setLoadingTypes(true);
    try {
      const res = await fetch('/api/accounting/account-types');
      if (res.ok) {
        const json = await res.json() as { data: ApiAccountType[] };
        setAccountTypes(json.data);
      }
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  const fetchDetailTypes = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const res = await fetch('/api/accounting/account-detail-types');
      if (res.ok) {
        const json = await res.json() as { data: ApiDetailType[] };
        setDetailTypes(json.data);
      }
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const fetchAccountTypesWithDetails = useCallback(async () => {
    const res = await fetch('/api/accounting/gl-accounts/account-types');
    if (res.ok) {
      const json = await res.json() as { data: ApiAccountType[] };
      setAccountTypesWithDetails(json.data);
    }
  }, []);

  const fetchGeneralSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/accounting/settings');
      if (res.ok) {
        const json = await res.json() as { data: ApiAccountingSetting };
        setGeneralSettings(json.data);
      }
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const fetchBanks = useCallback(async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch('/api/accounting/settings/payment-methods/banks');
      if (res.ok) {
        const json = await res.json() as { data: ApiPaymentMethodBank[] };
        setBanks(json.data);
      }
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  const fetchEWallets = useCallback(async () => {
    setLoadingEWallets(true);
    try {
      const res = await fetch('/api/accounting/settings/payment-methods/ewallets');
      if (res.ok) {
        const json = await res.json() as { data: ApiPaymentMethodEWallet[] };
        setEWallets(json.data);
      }
    } finally {
      setLoadingEWallets(false);
    }
  }, []);

  const fetchCashMethods = useCallback(async () => {
    setLoadingCash(true);
    try {
      const res = await fetch('/api/accounting/settings/payment-methods/cash');
      if (res.ok) {
        const json = await res.json() as { data: ApiPaymentMethodCash[] };
        setCashMethods(json.data);
      }
    } finally {
      setLoadingCash(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
    void fetchAccountTypes();
    void fetchDetailTypes();
    void fetchAccountTypesWithDetails();
    void fetchGeneralSettings();
    void fetchBanks();
    void fetchEWallets();
    void fetchCashMethods();
  }, [fetchAccounts, fetchAccountTypes, fetchDetailTypes, fetchAccountTypesWithDetails, fetchGeneralSettings, fetchBanks, fetchEWallets, fetchCashMethods]);

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts;
    const q = accountSearch.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.accountCode.toLowerCase().includes(q) ||
        a.accountType.name.toLowerCase().includes(q) ||
        a.accountDetailType.name.toLowerCase().includes(q),
    );
  }, [accounts, accountSearch]);

  const filteredTypes = useMemo(() => {
    if (!typeSearch.trim()) return accountTypes;
    const q = typeSearch.toLowerCase();
    return accountTypes.filter(
      (t) => t.name.toLowerCase().includes(q) || (GROUP_LABELS[t.group] ?? '').toLowerCase().includes(q),
    );
  }, [accountTypes, typeSearch]);

  const filteredDetails = useMemo(() => {
    if (!detailSearch.trim()) return detailTypes;
    const q = detailSearch.toLowerCase();
    return detailTypes.filter(
      (d) => d.name.toLowerCase().includes(q) || d.accountType.name.toLowerCase().includes(q),
    );
  }, [detailTypes, detailSearch]);

  // ── Invoice Branding save handler
  const { success: toastSuccess, error: toastError } = useToast();

  async function handleSaveBranding(ev: React.FormEvent) {
    ev.preventDefault();
    setSavingBranding(true);
    try {
      const res = await fetch('/api/accounting/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceEmail: brandingEmail.trim() || null, invoicePhoneNumber: brandingPhone.trim() || null }),
      });
      const json = await res.json() as { error?: string; data?: ApiAccountingSetting };
      if (!res.ok) { toastError('Failed to save', json.error ?? 'Something went wrong.'); return; }
      if (json.data) setGeneralSettings(json.data);
      toastSuccess('Branding saved', 'Invoice email and phone number have been updated.');
    } catch { toastError('Network error', 'Could not connect to the server.'); }
    finally { setSavingBranding(false); }
  }

  // ── Petty Cash Workflow save handler
  async function handleSavePettyCash(ev: React.FormEvent) {
    ev.preventDefault();
    setSavingPettyCash(true);
    try {
      const res = await fetch('/api/accounting/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pcfNumberPrefix: pcfPrefix.trim() || 'PCF',
          cftNumberPrefix: cftPrefix.trim() || 'CFT',
          defaultCustodianId: custodianId,
          defaultAccountingManagerId: managerId,
        }),
      });
      const json = await res.json() as { error?: string; data?: ApiAccountingSetting };
      if (!res.ok) { toastError('Failed to save', json.error ?? 'Something went wrong.'); return; }
      if (json.data) setGeneralSettings(json.data);
      toastSuccess('Petty cash settings saved', 'Workflow configuration has been updated.');
    } catch { toastError('Network error', 'Could not connect to the server.'); }
    finally { setSavingPettyCash(false); }
  }

  // ── Shared table styles (match Sales portal)
  const thClass = 'px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider';
  const tdClass = 'px-6 py-3.5';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-0">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600/10 text-amber-600">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ACF Settings</h1>
              <p className="text-sm text-muted-foreground">Accounting &amp; Finance configuration</p>
            </div>
          </div>
        </div>

        {/* Main tab navigation */}
        <div className="border-b border-border">
          <nav className="flex gap-1">
            {([
              { id: 'general' as const, label: 'General Settings', icon: <Settings size={18} /> },
              { id: 'accounting' as const, label: 'Accounting', icon: <BookOpen size={18} /> },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeMainTab === tab.id
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">

      {/* ─── General Settings tab ─── */}
      {activeMainTab === 'general' && (
        <div className="space-y-8">

          {/* Invoice Branding */}
          <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center"><FileText size={15} className="text-white" /></div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Invoice Branding</h2>
                <p className="text-xs text-muted-foreground">Contact details shown on client invoices</p>
              </div>
            </div>
            <form onSubmit={(e) => { void handleSaveBranding(e); }} className="p-6 space-y-4">
              {loadingSettings ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <RefreshCw size={14} className="animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Invoice Email</label>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input type="email" value={brandingEmail} onChange={(e) => setBrandingEmail(e.target.value)} placeholder="billing@yourdomain.com" className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Invoice Phone Number</label>
                      <div className="relative">
                        <Smartphone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input type="tel" value={brandingPhone} onChange={(e) => setBrandingPhone(e.target.value)} placeholder="+63 917 123 4567" className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="submit" disabled={savingBranding} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60">
                      {savingBranding && <RefreshCw size={12} className="animate-spin" />}
                      Save Branding
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Payment Methods */}
          <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center"><CreditCard size={15} className="text-white" /></div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Payment Methods</h2>
                <p className="text-xs text-muted-foreground">Bank, e-wallet, and cash options accepted from clients</p>
              </div>
            </div>
            <div className="p-6 space-y-6">

              {/* Banks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Landmark size={15} className="text-amber-600" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Bank Transfers</span>
                    <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">{banks.length}</span>
                  </div>
                  <button onClick={() => setShowAddBank(true)} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
                    <Plus size={12} /> Add Bank
                  </button>
                </div>
                {loadingBanks ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><RefreshCw size={12} className="animate-spin" /> Loading…</div>
                ) : banks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No bank accounts added yet.</p>
                ) : (
                  <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                    {banks.map((b) => (
                      <div key={b.id} className="flex items-center justify-between px-4 py-3 bg-background hover:bg-muted/30 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{b.bankName}</p>
                          <p className="text-xs text-muted-foreground truncate">{b.accountName} · {b.accountNumber}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          <button onClick={() => setEditBank(b)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => setDeleteBank(b)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* E-Wallets */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet2 size={15} className="text-amber-600" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">E-Wallets</span>
                    <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">{ewallets.length}</span>
                  </div>
                  <button onClick={() => setShowAddEWallet(true)} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
                    <Plus size={12} /> Add E-Wallet
                  </button>
                </div>
                {loadingEWallets ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><RefreshCw size={12} className="animate-spin" /> Loading…</div>
                ) : ewallets.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No e-wallets added yet.</p>
                ) : (
                  <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                    {ewallets.map((w) => (
                      <div key={w.id} className="flex items-center justify-between px-4 py-3 bg-background hover:bg-muted/30 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{w.eWalletName}</p>
                          <p className="text-xs text-muted-foreground truncate">{w.accountName} · {w.accountNumber}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          <button onClick={() => setEditEWallet(w)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => setDeleteEWallet(w)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* Cash */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Banknote size={15} className="text-amber-600" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Cash</span>
                    <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">{cashMethods.length}</span>
                  </div>
                  <button onClick={() => setShowAddCash(true)} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
                    <Plus size={12} /> Add Cash Method
                  </button>
                </div>
                {loadingCash ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><RefreshCw size={12} className="animate-spin" /> Loading…</div>
                ) : cashMethods.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No cash payment method added yet.</p>
                ) : (
                  <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                    {cashMethods.map((c) => (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-background hover:bg-muted/30 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">Payable to: {c.payableTo}</p>
                          {c.instructions && <p className="text-xs text-muted-foreground truncate">{c.instructions}</p>}
                        </div>
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          <button onClick={() => setEditCash(c)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => setDeleteCash(c)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Petty Cash Workflow */}
          <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center"><Wallet size={15} className="text-white" /></div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Petty Cash Workflows</h2>
                <p className="text-xs text-muted-foreground">Document numbering and default approvers</p>
              </div>
            </div>
            <form onSubmit={(e) => { void handleSavePettyCash(e); }} className="p-6 space-y-5">
              {loadingSettings ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <RefreshCw size={14} className="animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">PCF Number Prefix</label>
                      <div className="relative">
                        <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input type="text" value={pcfPrefix} onChange={(e) => setPcfPrefix(e.target.value)} maxLength={10} placeholder="PCF" className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">CFT Number Prefix</label>
                      <div className="relative">
                        <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input type="text" value={cftPrefix} onChange={(e) => setCftPrefix(e.target.value)} maxLength={10} placeholder="CFT" className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <UserSearchInput
                      label="Default Custodian"
                      selectedId={custodianId}
                      selectedName={custodianName}
                      onSelect={(id, name) => { setCustodianId(id); setCustodianName(name); }}
                      onClear={() => { setCustodianId(null); setCustodianName(''); }}
                    />
                    <UserSearchInput
                      label="Default Accounting Manager"
                      selectedId={managerId}
                      selectedName={managerName}
                      onSelect={(id, name) => { setManagerId(id); setManagerName(name); }}
                      onClear={() => { setManagerId(null); setManagerName(''); }}
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="submit" disabled={savingPettyCash} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60">
                      {savingPettyCash && <RefreshCw size={12} className="animate-spin" />}
                      Save Petty Cash Settings
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

        </div>
      )}

      {/* ─── Accounting tab ─── */}
      {activeMainTab === 'accounting' && (
        <div>

          {/* Accounting sub-tabs */}
          <div className="border-b border-border mb-8">
            <nav className="flex gap-1">
              {([
                { id: 'account-names' as const, label: 'Account Names', icon: <BookOpen size={18} /> },
                { id: 'account-types' as const, label: 'Account Types', icon: <Tag size={18} /> },
                { id: 'detail-types' as const, label: 'Detail Types', icon: <ListFilter size={18} /> },
                { id: 'journal' as const, label: 'Journal', icon: <PenLine size={18} /> },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

      {/* ─── Account Names tab ─── */}
      {activeTab === 'account-names' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Account Names</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {loadingAccounts ? 'Loading…' : `${accounts.length} account${accounts.length !== 1 ? 's' : ''} registered`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Search accounts…"
                      className="rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-medium shadow-sm"
                  >
                    <Plus size={16} />
                    Add Account
                  </button>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                {loadingAccounts ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading accounts…</div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <BookOpen size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {accountSearch.trim() ? 'No accounts match your search.' : 'No accounts yet. Add the first one.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className={thClass}>Code</th>
                          <th className={thClass}>Account Name</th>
                          <th className={thClass}>Account Type</th>
                          <th className={thClass}>Detail Type</th>
                          <th className={`${thClass} text-right`}>Opening Balance</th>
                          <th className={`${thClass} text-right`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredAccounts.map((account) => {
                          const badge = GROUP_BADGE[account.accountType.group] ?? 'bg-slate-100 text-slate-700';
                          const icon  = GROUP_ICON[account.accountType.group];
                          return (
                            <tr key={account.id} className="hover:bg-accent transition-colors">
                              <td className={tdClass}>
                                <span className="font-mono text-xs text-muted-foreground">{account.accountCode}</span>
                              </td>
                              <td className={tdClass}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground text-sm">{account.name}</span>
                                  {account.isBankAccount && (
                                    <span className="text-[10px] font-semibold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">Bank</span>
                                  )}
                                </div>
                              </td>
                              <td className={tdClass}>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
                                  {icon}
                                  {account.accountType.name}
                                </span>
                              </td>
                              <td className={tdClass}>
                                <span className="text-sm text-muted-foreground">{account.accountDetailType.name}</span>
                              </td>
                              <td className={`${tdClass} text-right`}>
                                <span className={`text-sm font-semibold tabular-nums ${account.openingBalance != null && account.openingBalance > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {account.openingBalance != null && account.openingBalance > 0
                                    ? `₱${account.openingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                                    : '—'}
                                </span>
                              </td>
                              <td className={`${tdClass} text-right`}>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setEditAccount(account)}
                                    className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteAccount(account)}
                                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
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
            </div>
      )}

      {/* ─── Account Types tab ─── */}
      {activeTab === 'account-types' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Account Types</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {loadingTypes ? 'Loading…' : `${accountTypes.length} type${accountTypes.length !== 1 ? 's' : ''} registered`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={typeSearch}
                      onChange={(e) => setTypeSearch(e.target.value)}
                      placeholder="Search types…"
                      className="rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddType(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-medium shadow-sm"
                  >
                    <Plus size={16} />
                    Add Type
                  </button>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                {loadingTypes ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading types…</div>
                ) : filteredTypes.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Tag size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {typeSearch.trim() ? 'No types match your search.' : 'No account types yet. Add the first one.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className={thClass}>Type Name</th>
                          <th className={thClass}>Financial Group</th>
                          <th className={thClass}>Normal Balance</th>
                          <th className={`${thClass} text-center`}>Detail Types</th>
                          <th className={`${thClass} text-center`}>GL Accounts</th>
                          <th className={`${thClass} text-right`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredTypes.map((type) => {
                          const badge = GROUP_BADGE[type.group] ?? 'bg-slate-100 text-slate-700';
                          const icon  = GROUP_ICON[type.group];
                          return (
                            <tr key={type.id} className="hover:bg-accent transition-colors">
                              <td className={tdClass}>
                                <span className="font-medium text-foreground text-sm">{type.name}</span>
                              </td>
                              <td className={tdClass}>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
                                  {icon}
                                  {GROUP_LABELS[type.group] ?? type.group}
                                </span>
                              </td>
                              <td className={tdClass}>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${type.normalBalance === 'DEBIT' ? 'bg-sky-100 text-sky-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {type.normalBalance.charAt(0) + type.normalBalance.slice(1).toLowerCase()}
                                </span>
                              </td>
                              <td className={`${tdClass} text-center`}>
                                <span className="text-sm font-medium text-foreground">{type._count?.detailTypes ?? 0}</span>
                              </td>
                              <td className={`${tdClass} text-center`}>
                                <span className={`text-sm font-medium ${(type._count?.accounts ?? 0) > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {type._count?.accounts ?? 0}
                                </span>
                              </td>
                              <td className={`${tdClass} text-right`}>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setEditType(type)}
                                    className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteType(type)}
                                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
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
            </div>
      )}

      {/* ─── Detail Types tab ─── */}
      {activeTab === 'detail-types' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Detail Types</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {loadingDetails ? 'Loading…' : `${detailTypes.length} detail type${detailTypes.length !== 1 ? 's' : ''} registered`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      placeholder="Search detail types…"
                      className="rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddDetail(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-medium shadow-sm"
                  >
                    <Plus size={16} />
                    Add Detail Type
                  </button>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                {loadingDetails ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading detail types…</div>
                ) : filteredDetails.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <ListFilter size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {detailSearch.trim() ? 'No detail types match your search.' : 'No detail types yet. Add the first one.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className={thClass}>Detail Type Name</th>
                          <th className={thClass}>Account Type</th>
                          <th className={thClass}>Group</th>
                          <th className={`${thClass} text-center`}>GL Accounts</th>
                          <th className={`${thClass} text-right`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredDetails.map((detail) => {
                          const badge = GROUP_BADGE[detail.accountType.group] ?? 'bg-slate-100 text-slate-700';
                          const icon  = GROUP_ICON[detail.accountType.group];
                          return (
                            <tr key={detail.id} className="hover:bg-accent transition-colors">
                              <td className={tdClass}>
                                <span className="font-medium text-foreground text-sm">{detail.name}</span>
                              </td>
                              <td className={tdClass}>
                                <span className="text-sm text-muted-foreground">{detail.accountType.name}</span>
                              </td>
                              <td className={tdClass}>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
                                  {icon}
                                  {GROUP_LABELS[detail.accountType.group] ?? detail.accountType.group}
                                </span>
                              </td>
                              <td className={`${tdClass} text-center`}>
                                <span className={`text-sm font-medium ${detail._count.accounts > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {detail._count.accounts}
                                </span>
                              </td>
                              <td className={`${tdClass} text-right`}>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setEditDetail(detail)}
                                    className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteDetail(detail)}
                                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
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
            </div>
          )}

      {/* ─── Journal Settings tab ─── */}
      {activeTab === 'journal' && (
        <div className="space-y-5">

          {/* Entry Status — informational */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <PenLine size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">All journal entries are immediately posted</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Every entry saved in this system is permanently recorded in the general ledger.
                There is no draft stage — entries are final upon save.
              </p>
            </div>
          </div>

          {/* Reference Number Prefixes */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-muted">
              <Hash size={18} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-foreground">Reference Number Prefixes</p>
                <p className="text-xs text-muted-foreground mt-0.5">Prefix used when auto-generating reference numbers per transaction type.</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {TRANSACTION_TYPE_KEYS.map((type) => (
                <div key={type} className="flex items-center justify-between px-6 py-4 gap-4 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {TX_ICON[type]}
                    <span className="text-sm font-medium text-foreground">{type}</span>
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
                      className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground text-center uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                    />
                    <span className="text-xs font-mono text-muted-foreground bg-muted border border-border px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                      {prefixes[type] || '??'}-{new Date().getFullYear()}-0001
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Transaction Types */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-muted">
              <ListFilter size={18} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-foreground">Allowed Transaction Types</p>
                <p className="text-xs text-muted-foreground mt-0.5">Control which transaction types appear when creating journal entries.</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {TRANSACTION_TYPE_KEYS.map((type) => (
                <div key={type} className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    {TX_ICON[type]}
                    <div>
                      <p className="text-sm font-medium text-foreground">{type}</p>
                      <p className="text-xs text-muted-foreground">{TX_DESC[type]}</p>
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

        </div>
      )}

      </div>

      {/* ── GL Account modals ── */}
      {showAddAccount && (
        <GlAccountModal
          accountTypes={accountTypesWithDetails}
          onClose={() => setShowAddAccount(false)}
          onSuccess={() => { void fetchAccounts(); void fetchAccountTypesWithDetails(); }}
        />
      )}
      {editAccount && (
        <GlAccountModal
          initial={editAccount}
          accountTypes={accountTypesWithDetails}
          onClose={() => setEditAccount(null)}
          onSuccess={() => { void fetchAccounts(); void fetchAccountTypesWithDetails(); }}
        />
      )}
      {deleteAccount && (
        <DeleteGlAccountModal
          account={deleteAccount}
          onClose={() => setDeleteAccount(null)}
          onSuccess={() => { void fetchAccounts(); }}
        />
      )}

      {/* ── Account Type modals ── */}
      {showAddType && (
        <AccountTypeModal
          onClose={() => setShowAddType(false)}
          onSuccess={() => { void fetchAccountTypes(); void fetchAccountTypesWithDetails(); void fetchDetailTypes(); }}
        />
      )}
      {editType && (
        <AccountTypeModal
          initial={editType}
          onClose={() => setEditType(null)}
          onSuccess={() => { void fetchAccountTypes(); void fetchAccountTypesWithDetails(); void fetchDetailTypes(); }}
        />
      )}
      {deleteType && (
        <DeleteAccountTypeModal
          accountType={deleteType}
          onClose={() => setDeleteType(null)}
          onSuccess={() => { void fetchAccountTypes(); void fetchAccountTypesWithDetails(); }}
        />
      )}

      {/* ── Detail Type modals ── */}
      {showAddDetail && (
        <DetailTypeModal
          accountTypes={accountTypes}
          onClose={() => setShowAddDetail(false)}
          onSuccess={() => { void fetchDetailTypes(); void fetchAccountTypesWithDetails(); }}
        />
      )}
      {editDetail && (
        <DetailTypeModal
          initial={editDetail}
          accountTypes={accountTypes}
          onClose={() => setEditDetail(null)}
          onSuccess={() => { void fetchDetailTypes(); void fetchAccountTypesWithDetails(); }}
        />
      )}
      {deleteDetail && (
        <DeleteDetailTypeModal
          detailType={deleteDetail}
          onClose={() => setDeleteDetail(null)}
          onSuccess={() => { void fetchDetailTypes(); void fetchAccountTypesWithDetails(); }}
        />
      )}

      {/* ── Payment Method modals ── */}
      {showAddBank && (
        <BankMethodModal onClose={() => setShowAddBank(false)} onSuccess={() => { void fetchBanks(); }} />
      )}
      {editBank && (
        <BankMethodModal initial={editBank} onClose={() => setEditBank(null)} onSuccess={() => { void fetchBanks(); }} />
      )}
      {deleteBank && (
        <DeletePaymentMethodModal
          label="Bank"
          name={deleteBank.bankName}
          apiUrl={`/api/accounting/settings/payment-methods/banks/${deleteBank.id}`}
          onClose={() => setDeleteBank(null)}
          onSuccess={() => { void fetchBanks(); }}
        />
      )}
      {showAddEWallet && (
        <EWalletMethodModal onClose={() => setShowAddEWallet(false)} onSuccess={() => { void fetchEWallets(); }} />
      )}
      {editEWallet && (
        <EWalletMethodModal initial={editEWallet} onClose={() => setEditEWallet(null)} onSuccess={() => { void fetchEWallets(); }} />
      )}
      {deleteEWallet && (
        <DeletePaymentMethodModal
          label="E-Wallet"
          name={deleteEWallet.eWalletName}
          apiUrl={`/api/accounting/settings/payment-methods/ewallets/${deleteEWallet.id}`}
          onClose={() => setDeleteEWallet(null)}
          onSuccess={() => { void fetchEWallets(); }}
        />
      )}
      {showAddCash && (
        <CashMethodModal onClose={() => setShowAddCash(false)} onSuccess={() => { void fetchCashMethods(); }} />
      )}
      {editCash && (
        <CashMethodModal initial={editCash} onClose={() => setEditCash(null)} onSuccess={() => { void fetchCashMethods(); }} />
      )}
      {deleteCash && (
        <DeletePaymentMethodModal
          label="Cash Method"
          name={deleteCash.payableTo}
          apiUrl={`/api/accounting/settings/payment-methods/cash/${deleteCash.id}`}
          onClose={() => setDeleteCash(null)}
          onSuccess={() => { void fetchCashMethods(); }}
        />
      )}
    </div>
  );
}
