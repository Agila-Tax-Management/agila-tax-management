// src/components/compliance/ExpensesBookDetail.tsx
'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  FilePlus2, Building2, Plus, Lock,
  Paperclip, ExternalLink, CheckCircle2, ChevronRight, X,
  ShieldCheck, ShieldX, Eye, AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { Breadcrumb, type BreadcrumbItem } from '@/components/UI/Breadcrumb';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// ─── VAT detection ─────────────────────────────────────────────────────────────

function isVatClient(client: MockClientWithCompliance): boolean {
  const bp = client.planDetails?.basePlan ?? '';
  if (bp === 'vip') return true;
  return bp.includes('vat') && !bp.includes('non-vat');
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type InvoiceType = 'Sales Invoice' | 'Service Invoice' | 'Invoice';

interface ExpenseRecord {
  id: string;
  receiptNo: string;
  invoiceType: InvoiceType;
  date: string;            // MM/DD/YYYY
  supplierName: string;
  supplierVat: string;
  account: string;
  amount: number;
  netOfVat: number;        // VAT: amount / 1.12 | non-VAT: amount
  vat: number;             // VAT: netOfVat * 0.12 | non-VAT: 0
  notes: string;
  receiptFile: string;
  receiptUrl: string;
  claimable: boolean | null; // null = not yet audited
}

interface ExpenseMonth {
  id: string;
  coverageMonth: string;   // e.g. "January 2026"
  monthIdx: number;
  year: number;
  grossExpenses: number;
  netExpenses: number;
  vat: number;
  records: ExpenseRecord[];
  audited: boolean;        // true when all records have claimable !== null
  finalized: boolean;
}

interface Account {
  id: string;
  name: string;
}

interface SupplierEntry {
  name: string;
  vat: string;
}

// Navigation view discriminated union
type NavView =
  | { type: 'journal' }
  | { type: 'encode'; monthId: string }
  | { type: 'record-form'; monthId: string; recordId: string | null };

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const YEAR_OPTIONS = [2024, 2025, 2026];
const INVOICE_TYPES: InvoiceType[] = ['Sales Invoice', 'Service Invoice', 'Invoice'];

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Office Supplies' },
  { id: 'acc-2', name: 'Utilities Expense' },
  { id: 'acc-3', name: 'Rent Expense' },
  { id: 'acc-4', name: 'Professional Fees' },
  { id: 'acc-5', name: 'Miscellaneous Expense' },
  { id: 'acc-6', name: 'Transportation Expense' },
  { id: 'acc-7', name: 'Communication Expense' },
];

// ─── Format helpers ─────────────────────────────────────────────────────────────

function fmtPHP(val: number): string {
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

function buildMockRecords(yr: number, mi: number, isVat: boolean): ExpenseRecord[] {
  const suppliers = [
    { name: 'Meralco', vat: '004-598-244-000' },
    { name: 'PLDT Inc.', vat: '000-459-898-000' },
    { name: 'SM Cebu Office', vat: '034-710-299-000' },
    { name: 'National Bookstore', vat: '008-204-710-000' },
    { name: 'Grab Philippines', vat: '' },
    { name: 'Sun Life Financial', vat: '012-845-667-000' },
  ];
  const accs = INITIAL_ACCOUNTS;
  const types: InvoiceType[] = ['Sales Invoice', 'Service Invoice', 'Invoice'];
  const result: ExpenseRecord[] = [];
  const baseDate = new Date(yr, mi, 1);
  let recNum = 301 + mi * 10;
  for (let i = 0; i < 6; i++) {
    const day = Math.min(i * 4 + 2, 28);
    const mm = String(mi + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${mm}/${dd}/${yr}`;
    void baseDate;
    const gross = Math.round((3000 + i * 4200) * 100) / 100;
    const net   = isVat ? Math.round((gross / 1.12) * 100) / 100 : gross;
    const vat   = isVat ? Math.round((net * 0.12) * 100) / 100 : 0;
    const sup   = suppliers[i % suppliers.length]!;
    result.push({
      id: `exp-${yr}-${mi}-${i}`,
      receiptNo: String(recNum++),
      invoiceType: types[i % 3]!,
      date: dateStr,
      supplierName: sup.name,
      supplierVat: sup.vat,
      account: accs[i % accs.length]!.name,
      amount: gross,
      netOfVat: net,
      vat,
      notes: i % 4 === 0 ? 'Recurring monthly expense.' : '',
      receiptFile: '',
      receiptUrl: '',
      claimable: i < 4 ? true : null,
    });
  }
  return result;
}

function buildMonthRecords(year: number, isVat: boolean): ExpenseMonth[] {
  const today = new Date();
  const maxMonth = year < today.getFullYear() ? 12 : today.getMonth() + 1;
  return Array.from({ length: maxMonth }, (_, i) => {
    const isOld = year < today.getFullYear() || i < today.getMonth();
    const records: ExpenseRecord[] = isOld ? buildMockRecords(year, i, isVat) : [];
    const gross = records.reduce((s, r) => s + r.amount, 0);
    const net   = records.reduce((s, r) => s + r.netOfVat, 0);
    const vat   = records.reduce((s, r) => s + r.vat, 0);
    const allAudited = records.length > 0 && records.every(r => r.claimable !== null);
    return {
      id: `eb-${year}-${i + 1}`,
      coverageMonth: `${MONTH_NAMES[i]} ${year}`,
      monthIdx: i,
      year,
      grossExpenses: gross,
      netExpenses: net,
      vat,
      records,
      audited: allAudited,
      finalized: isOld && allAudited,
    };
  });
}

// ─── Receipt preview modal ──────────────────────────────────────────────────────

function ReceiptPreviewModal({ url, file, onClose }: { url: string; file: string; onClose: () => void }): React.ReactNode {
  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(file);
  const isPdf   = /\.pdf$/i.test(file);
  return (
    <Modal isOpen onClose={onClose} title={file} size="lg">
      <div className="p-4 flex flex-col items-center justify-center min-h-75">
        {isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={file} className="max-h-[70vh] object-contain rounded-lg border border-slate-100" />
        )}
        {isPdf && (
          <iframe src={url} title={file} className="w-full h-[70vh] rounded-lg border border-slate-100" />
        )}
        {!isImage && !isPdf && (
          <p className="text-sm text-slate-500">Preview not available. <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Open file</a></p>
        )}
      </div>
    </Modal>
  );
}

// ─── Helpers (encode / form) ───────────────────────────────────────────────────

function nextReceiptNo(records: ExpenseRecord[]): string {
  if (records.length === 0) return '301';
  const nums = records.map(r => parseInt(r.receiptNo, 10)).filter(n => !isNaN(n));
  return String(Math.max(...nums, 300) + 1);
}

function calcExpenseTotals(records: ExpenseRecord[]) {
  return {
    grossExpenses: records.reduce((s, r) => s + r.amount, 0),
    netExpenses:   records.reduce((s, r) => s + r.netOfVat, 0),
    vat:           records.reduce((s, r) => s + r.vat, 0),
    audited:       records.length > 0 && records.every(r => r.claimable !== null),
  };
}

// ─── Encode table (per-month expense records, stateless) ───────────────────────

interface EncodeTableProps {
  month: ExpenseMonth;
  isVat: boolean;
  isSuperAdmin: boolean;
  onAddRecord: () => void;
  onEditRecord: (recordId: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onSetClaimable: (recordId: string, val: boolean) => void;
  onFinalize: () => void;
  onUnfinalize: () => void;
  onAddAccount: () => void;
  onViewReceipt: (rec: ExpenseRecord) => void;
}

function EncodeTable({
  month, isVat, isSuperAdmin,
  onAddRecord, onEditRecord, onDeleteRecord, onSetClaimable,
  onFinalize, onUnfinalize, onAddAccount, onViewReceipt,
}: EncodeTableProps): React.ReactNode {
  const locked = month.finalized && !isSuperAdmin;
  const records = month.records;
  const allAudited = records.length > 0 && records.every(r => r.claimable !== null);
  const unauditedCount = records.filter(r => r.claimable === null).length;
  const totalGross    = records.reduce((s, r) => s + r.amount, 0);
  const totalNet      = records.reduce((s, r) => s + r.netOfVat, 0);
  const totalVat      = records.reduce((s, r) => s + r.vat, 0);
  const claimableTotal = records.filter(r => r.claimable === true).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Card className="p-5 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Expenses Journal</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{month.coverageMonth}</h2>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {month.audited && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                <ShieldCheck size={11} /> Audited
              </span>
            )}
            {month.finalized && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                <CheckCircle2 size={11} /> Finalized
              </span>
            )}
            {locked && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-semibold">
                <Lock size={12} /> Locked
              </span>
            )}
            {!locked && (
              <>
                <button
                  onClick={onAddAccount}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <Plus size={12} /> Add Account
                </button>
                <button
                  onClick={onAddRecord}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  <Plus size={12} /> Record Expense
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Audit notice */}
      {!locked && records.length > 0 && !allAudited && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">
            {unauditedCount} {unauditedCount === 1 ? 'record has' : 'records have'} not been audited. Mark each receipt as Claimable or Not Claimable before finalizing.
          </p>
        </div>
      )}

      {/* Expense records table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: isVat ? '1000px' : '840px' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  'Receipt #', 'Invoice Type', 'Date', 'Supplier Name', 'Supplier VAT',
                  'Account', 'Amount',
                  ...(isVat ? ['Net of VAT', 'VAT (12%)'] : []),
                  'Claimable', 'Receipt', 'Actions',
                ].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={isVat ? 13 : 11} className="px-4 py-12 text-center text-sm text-slate-400">
                    No records yet. Click &quot;Record Expense&quot; to add entries.
                  </td>
                </tr>
              ) : records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-700">{rec.receiptNo || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.invoiceType}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap font-mono">{rec.date}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{rec.supplierName}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">{rec.supplierVat || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{rec.account}</td>
                  <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-800">{fmtPHP(rec.amount)}</td>
                  {isVat && <td className="px-3 py-2.5 text-xs font-mono text-slate-700">{fmtPHP(rec.netOfVat)}</td>}
                  {isVat && <td className="px-3 py-2.5 text-xs font-mono text-blue-700">{fmtPHP(rec.vat)}</td>}
                  {/* Claimable audit */}
                  <td className="px-3 py-2.5">
                    {locked ? (
                      rec.claimable === true ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700"><ShieldCheck size={9} /> Claimable</span>
                      ) : rec.claimable === false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-700"><ShieldX size={9} /> Not Claimable</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSetClaimable(rec.id, true)}
                          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-black transition-all ${rec.claimable === true ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                        >
                          <ShieldCheck size={9} /> Yes
                        </button>
                        <button
                          onClick={() => onSetClaimable(rec.id, false)}
                          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-black transition-all ${rec.claimable === false ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                        >
                          <ShieldX size={9} /> No
                        </button>
                      </div>
                    )}
                  </td>
                  {/* Receipt */}
                  <td className="px-3 py-2.5">
                    {rec.receiptFile ? (
                      <button
                        onClick={() => onViewReceipt(rec)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors whitespace-nowrap"
                      >
                        <Eye size={10} /> View
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    {locked ? (
                      <span className="text-xs text-slate-300 flex items-center gap-1"><Lock size={9} /> Locked</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onEditRecord(rec.id)} className="rounded-md px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Edit</button>
                        <button onClick={() => onDeleteRecord(rec.id)} className="rounded-md p-1 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><X size={11} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {records.length > 0 && (
                <tr className="bg-slate-100 border-t-2 border-slate-200 text-xs font-black">
                  <td colSpan={6} className="px-3 py-2 text-[9px] uppercase tracking-widest text-slate-500">Totals</td>
                  <td className="px-3 py-2 font-mono text-slate-900">{fmtPHP(totalGross)}</td>
                  {isVat && <td className="px-3 py-2 font-mono text-slate-900">{fmtPHP(totalNet)}</td>}
                  {isVat && <td className="px-3 py-2 font-mono text-blue-700">{fmtPHP(totalVat)}</td>}
                  <td className="px-3 py-2">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wide">
                      Claimable: {fmtPHP(claimableTotal)}
                    </span>
                  </td>
                  <td colSpan={2} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Finalize bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5">
        <div className="text-xs text-slate-500 font-semibold">
          {month.finalized
            ? isSuperAdmin
              ? 'This month is finalized. You can unfinalize as Super Admin.'
              : 'This month is finalized and locked.'
            : !allAudited && records.length > 0
              ? `Audit all records first before finalizing. (${unauditedCount} remaining)`
              : 'All records audited. Ready to finalize.'}
        </div>
        {month.finalized ? (
          isSuperAdmin && (
            <button onClick={onUnfinalize} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 active:scale-95 transition-all">
              <Lock size={12} /> Unfinalize
            </button>
          )
        ) : (
          <button
            disabled={!allAudited || records.length === 0}
            onClick={onFinalize}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={12} /> Finalize Month
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Record form page (full subview — no modal) ────────────────────────────────

interface RecordFormPageProps {
  month: ExpenseMonth;
  existingRecord: ExpenseRecord | null;
  isVat: boolean;
  accounts: Account[];
  supplierCache: SupplierEntry[];
  onSave: (record: ExpenseRecord) => void;
  onCancel: () => void;
  onCacheSupplier: (entry: SupplierEntry) => void;
}

function RecordFormPage({
  month, existingRecord, isVat, accounts, supplierCache,
  onSave, onCancel, onCacheSupplier,
}: RecordFormPageProps): React.ReactNode {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    receiptNo:    existingRecord?.receiptNo    ?? nextReceiptNo(month.records),
    invoiceType:  (existingRecord?.invoiceType ?? 'Sales Invoice') as InvoiceType,
    date:         existingRecord?.date         ?? '',
    supplierName: existingRecord?.supplierName ?? '',
    supplierVat:  existingRecord?.supplierVat  ?? '',
    account:      existingRecord?.account      ?? accounts[0]?.name ?? '',
    amount:       existingRecord?.amount       ?? 0,
    notes:        existingRecord?.notes        ?? '',
    receiptFile:  existingRecord?.receiptFile  ?? '',
    receiptUrl:   existingRecord?.receiptUrl   ?? '',
  });
  const [suggestions, setSuggestions]           = useState<SupplierEntry[]>([]);
  const [showSuggestions, setShowSuggestions]   = useState(false);

  const computedNet = isVat ? Math.round((form.amount / 1.12) * 100) / 100 : form.amount;
  const computedVat = isVat ? Math.round((computedNet * 0.12) * 100) / 100 : 0;

  function handleSupplierNameChange(val: string) {
    setForm(f => ({ ...f, supplierName: val }));
    if (val.trim().length >= 2) {
      const matches = supplierCache.filter(s => s.name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function selectSupplier(entry: SupplierEntry) {
    setForm(f => ({ ...f, supplierName: entry.name, supplierVat: entry.vat }));
    setShowSuggestions(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, receiptFile: file.name, receiptUrl: URL.createObjectURL(file) }));
    e.target.value = '';
  }

  function handleSave() {
    const net = isVat ? Math.round((form.amount / 1.12) * 100) / 100 : form.amount;
    const v   = isVat ? Math.round((net * 0.12) * 100) / 100 : 0;
    const rec: ExpenseRecord = {
      id:           existingRecord?.id ?? `exp-${Date.now()}`,
      receiptNo:    form.receiptNo,
      invoiceType:  form.invoiceType,
      date:         form.date,
      supplierName: form.supplierName,
      supplierVat:  form.supplierVat,
      account:      form.account,
      amount:       form.amount,
      netOfVat:     net,
      vat:          v,
      notes:        form.notes,
      receiptFile:  form.receiptFile,
      receiptUrl:   form.receiptUrl,
      claimable:    existingRecord?.claimable ?? null,
    };
    if (form.supplierName.trim()) {
      onCacheSupplier({ name: form.supplierName.trim(), vat: form.supplierVat.trim() });
    }
    onSave(rec);
  }

  return (
    <Card className="border-slate-200 shadow-sm animate-in fade-in duration-200">
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          {existingRecord ? 'Edit Expense Record' : 'Add Expense Record'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{month.coverageMonth}</p>
      </div>
      <div className="px-6 py-6 space-y-5">

        {/* Row 1: Receipt # | Invoice Type | Date */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Receipt #</label>
            <input type="text" value={form.receiptNo} onChange={e => setForm(f => ({ ...f, receiptNo: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Invoice Type</label>
            <select value={form.invoiceType} onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value as InvoiceType }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Date</label>
            <input type="text" placeholder="MM/DD/YYYY" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        {/* Row 2: Supplier Name (with autocomplete) | Supplier VAT */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Supplier Name</label>
            <input
              type="text"
              value={form.supplierName}
              onChange={e => handleSupplierNameChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Enter supplier name"
              autoComplete="off"
              className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {showSuggestions && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                {suggestions.map(s => (
                  <button key={s.name} type="button" onMouseDown={() => selectSupplier(s)} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 transition-colors">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    {s.vat && <span className="text-slate-400 ml-2 font-mono">{s.vat}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Supplier VAT</label>
            <input type="text" value={form.supplierVat} onChange={e => setForm(f => ({ ...f, supplierVat: e.target.value }))} placeholder="TIN (optional)" className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        {/* Row 3: Account + Amount + computed | Notes */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Account</label>
              <select value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Amount</label>
              <input type="number" min="0" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} placeholder="0.00" className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {isVat ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400 mb-0.5">Net of VAT</p>
                  <p className="text-sm font-black font-mono text-slate-800">{fmtPHP(computedNet)}</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                  <p className="text-[9px] font-black uppercase tracking-wide text-blue-400 mb-0.5">VAT (12%)</p>
                  <p className="text-sm font-black font-mono text-blue-700">{fmtPHP(computedVat)}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 opacity-50">
                <p className="text-[9px] font-black uppercase tracking-wide text-slate-400 mb-0.5">Net of VAT / VAT</p>
                <p className="text-xs text-slate-400">Not applicable (Non-VAT)</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Notes <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <textarea rows={6} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" style={{ minHeight: '158px' }} />
          </div>
        </div>

        {/* Receipt upload */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Receipt</label>
          <div className="flex items-center gap-3 flex-wrap">
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all">
              <Paperclip size={14} /> Upload Receipt
            </button>
            {form.receiptFile ? (
              <div className="flex items-center gap-2">
                <a href={form.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                  <ExternalLink size={11} /> {form.receiptFile}
                </a>
                <button onClick={() => setForm(f => ({ ...f, receiptFile: '', receiptUrl: '' }))} className="text-slate-400 hover:text-red-500 transition-colors"><X size={13} /></button>
              </div>
            ) : <span className="text-xs text-slate-400">No file selected</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <button
            disabled={!form.supplierName.trim() || form.amount <= 0}
            onClick={handleSave}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {existingRecord ? 'Save Changes' : 'Add Record'}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface ExpensesBookDetailProps {
  client: MockClientWithCompliance;
  year: number;
  onYearChange: (y: number) => void;
  isSuperAdmin?: boolean;
}

export function ExpensesBookDetail({ client, year, onYearChange, isSuperAdmin = false }: ExpensesBookDetailProps): React.ReactNode {
  const isVat = isVatClient(client);

  const [navView, setNavView]     = useState<NavView>({ type: 'journal' });
  const [months, setMonths]       = useState<ExpenseMonth[]>(() => buildMonthRecords(year, isVat));
  const [accounts, setAccounts]   = useState<Account[]>(INITIAL_ACCOUNTS);
  const [supplierCache, setSupplierCache] = useState<SupplierEntry[]>(() => [
    { name: 'Meralco', vat: '004-598-244-000' },
    { name: 'PLDT Inc.', vat: '000-459-898-000' },
    { name: 'SM Cebu Office', vat: '034-710-299-000' },
    { name: 'National Bookstore', vat: '008-204-710-000' },
    { name: 'Grab Philippines', vat: '' },
    { name: 'Sun Life Financial', vat: '012-845-667-000' },
  ]);
  const [previewRecord, setPreviewRecord]   = useState<ExpenseRecord | null>(null);
  const [isAddAccOpen, setIsAddAccOpen]     = useState(false);
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);
  const [newAccName, setNewAccName]         = useState('');

  // Year change resets to journal
  const [prevYear, setPrevYear] = useState(year);
  if (prevYear !== year) {
    setPrevYear(year);
    setMonths(buildMonthRecords(year, isVat));
    setNavView({ type: 'journal' });
  }

  // Derived lookups
  const selectedMonth = navView.type !== 'journal'
    ? (months.find(m => m.id === navView.monthId) ?? null)
    : null;
  const editingRecord = navView.type === 'record-form' && navView.recordId && selectedMonth
    ? (selectedMonth.records.find(r => r.id === navView.recordId) ?? null)
    : null;

  const ytd = useMemo(() => ({
    gross: months.reduce((s, m) => s + m.grossExpenses, 0),
    net:   months.reduce((s, m) => s + m.netExpenses, 0),
    vat:   months.reduce((s, m) => s + m.vat, 0),
  }), [months]);

  // Mutations
  function updateMonth(monthId: string, updater: (m: ExpenseMonth) => ExpenseMonth) {
    setMonths(prev => prev.map(m => m.id === monthId ? updater(m) : m));
  }

  function handleSaveRecord(record: ExpenseRecord) {
    if (navView.type !== 'record-form') return;
    const { monthId, recordId } = navView;
    updateMonth(monthId, m => {
      const records = recordId
        ? m.records.map(r => r.id === recordId ? record : r)
        : [...m.records, record];
      return { ...m, records, ...calcExpenseTotals(records) };
    });
    setNavView({ type: 'encode', monthId });
  }

  function handleDeleteRecord(monthId: string, recordId: string) {
    updateMonth(monthId, m => {
      const records = m.records.filter(r => r.id !== recordId);
      return { ...m, records, ...calcExpenseTotals(records) };
    });
  }

  function handleSetClaimable(monthId: string, recordId: string, val: boolean) {
    updateMonth(monthId, m => {
      const records = m.records.map(r => r.id === recordId ? { ...r, claimable: val } : r);
      return { ...m, records, ...calcExpenseTotals(records) };
    });
  }

  function handleFinalize(monthId: string) {
    updateMonth(monthId, m => ({ ...m, finalized: true }));
  }

  function handleUnfinalize(monthId: string) {
    updateMonth(monthId, m => ({ ...m, finalized: false }));
  }

  function handleCacheSupplier(entry: SupplierEntry) {
    setSupplierCache(prev => {
      const existing = prev.find(s => s.name.toLowerCase() === entry.name.toLowerCase());
      if (existing) return prev.map(s => s.name.toLowerCase() === entry.name.toLowerCase() ? entry : s);
      return [...prev, entry];
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Journal overview ── */}
      {navView.type === 'journal' && (
        <>
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Building2 size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">{client.businessName} ({client.clientNo})</p>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Expenses Journal</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isVat
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">VAT Registered</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">Non-VAT</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={year} onChange={e => onYearChange(Number(e.target.value))} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button onClick={() => setIsOpenCaseOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all">
                  <FilePlus2 size={15} /> File Open Case
                </button>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Expense Records — {year}</p>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                <span>YTD Gross: <span className="text-slate-800 font-black font-mono">{fmtPHP(ytd.gross)}</span></span>
                {isVat && <span>YTD Net: <span className="text-slate-800 font-black font-mono">{fmtPHP(ytd.net)}</span></span>}
                {isVat && <span>YTD VAT: <span className="text-blue-700 font-black font-mono">{fmtPHP(ytd.vat)}</span></span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: isVat ? '700px' : '560px' }}>
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Coverage</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Expenses</th>
                    {isVat && <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Net Expenses</th>}
                    {isVat && <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">VAT (12%)</th>}
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Audited</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Finalized</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map(m => (
                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          {m.coverageMonth}
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 shrink-0" />
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-800">
                        {m.grossExpenses > 0 ? fmtPHP(m.grossExpenses) : <span className="text-slate-300">—</span>}
                      </td>
                      {isVat && <td className="px-5 py-3.5 font-mono text-sm text-slate-700">{m.netExpenses > 0 ? fmtPHP(m.netExpenses) : <span className="text-slate-300">—</span>}</td>}
                      {isVat && <td className="px-5 py-3.5 font-mono text-sm text-blue-700">{m.vat > 0 ? fmtPHP(m.vat) : <span className="text-slate-300">—</span>}</td>}
                      <td className="px-5 py-3.5">
                        {m.records.length === 0 ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : m.audited ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700"><ShieldCheck size={10} /> Audited</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {m.finalized
                          ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700"><CheckCircle2 size={10} /> Finalized</span>
                          : <span className="text-xs text-slate-400 font-semibold">Pending</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setNavView({ type: 'encode', monthId: m.id })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                        >
                          Encode
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Encode view ── */}
      {navView.type === 'encode' && selectedMonth && (
        <EncodeTable
          month={selectedMonth}
          isVat={isVat}
          isSuperAdmin={isSuperAdmin}
          onAddRecord={() => setNavView({ type: 'record-form', monthId: selectedMonth.id, recordId: null })}
          onEditRecord={recordId => setNavView({ type: 'record-form', monthId: selectedMonth.id, recordId })}
          onDeleteRecord={recordId => handleDeleteRecord(selectedMonth.id, recordId)}
          onSetClaimable={(recordId, val) => handleSetClaimable(selectedMonth.id, recordId, val)}
          onFinalize={() => handleFinalize(selectedMonth.id)}
          onUnfinalize={() => handleUnfinalize(selectedMonth.id)}
          onAddAccount={() => setIsAddAccOpen(true)}
          onViewReceipt={rec => setPreviewRecord(rec)}
        />
      )}

      {/* ── Record form page ── */}
      {navView.type === 'record-form' && selectedMonth && (
        <RecordFormPage
          month={selectedMonth}
          existingRecord={editingRecord}
          isVat={isVat}
          accounts={accounts}
          supplierCache={supplierCache}
          onSave={handleSaveRecord}
          onCancel={() => {
            if (navView.type === 'record-form') setNavView({ type: 'encode', monthId: navView.monthId });
          }}
          onCacheSupplier={handleCacheSupplier}
        />
      )}

      {/* ── Add Account Modal ── */}
      <Modal isOpen={isAddAccOpen} onClose={() => setIsAddAccOpen(false)} title="Add Account" size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Account Name</label>
            <input type="text" value={newAccName} onChange={e => setNewAccName(e.target.value)} placeholder="e.g. Insurance Expense" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddAccOpen(false)}>Cancel</Button>
            <button disabled={!newAccName.trim()} onClick={() => { setAccounts(prev => [...prev, { id: `acc-${Date.now()}`, name: newAccName.trim() }]); setNewAccName(''); setIsAddAccOpen(false); }} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
          </div>
        </div>
      </Modal>

      {/* ── File Open Case Modal ── */}
      <Modal isOpen={isOpenCaseOpen} onClose={() => setIsOpenCaseOpen(false)} title="File Open Case" size="lg">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong> — Expenses Book.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>BIR — Disallowed Expenses</option>
                <option>BIR — Unsubstantiated Receipts</option>
                <option>BIR — Late Expense Report</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Priority</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea rows={3} placeholder="Describe the case..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsOpenCaseOpen(false)}>Cancel</Button>
            <button onClick={() => setIsOpenCaseOpen(false)} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all">File Case</button>
          </div>
        </div>
      </Modal>

      {/* ── Receipt Preview Modal ── */}
      {previewRecord && (
        <ReceiptPreviewModal
          url={previewRecord.receiptUrl}
          file={previewRecord.receiptFile}
          onClose={() => setPreviewRecord(null)}
        />
      )}
    </div>
  );
}
