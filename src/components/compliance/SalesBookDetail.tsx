// src/components/compliance/SalesBookDetail.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, FilePlus2, Building2, Plus, Lock,
  Paperclip, ExternalLink, AlertTriangle, AlertCircle,
  CheckCircle2, ChevronRight, X,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// ─── VAT detection ─────────────────────────────────────────────────────────────

function isVatClient(client: MockClientWithCompliance): boolean {
  const bp = client.planDetails?.basePlan ?? '';
  if (bp === 'vip') return true;
  return bp.includes('vat') && !bp.includes('non-vat');
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type InvoiceType = 'Sales Invoice' | 'Service Invoice' | 'Invoice';

interface SalesRecord {
  id: string;
  serialNo: string;
  invoiceType: InvoiceType;
  date: string;           // MM-DD
  customerName: string;
  customerVat: string;
  account: string;
  amount: number;         // gross amount entered
  netSales: number;       // = amount / 1.12 for VAT, = amount for non-VAT
  vat: number;            // = netSales * 0.12 for VAT, 0 for non-VAT
  pt010: number;          // non-VAT only  (3%)
  pt150: number;          // non-VAT only  (12% for professionals, etc.)
  notes: string;
  receiptFile: string;    // filename
  receiptUrl: string;     // blob URL or empty
}

interface MonthRecord {
  id: string;
  coverageMonth: string;  // e.g. "January 2026"
  monthIdx: number;       // 0-11
  year: number;
  grossSales: number;
  netSales: number;
  vat: number;
  pt010: number;
  pt150: number;
  records: SalesRecord[];
  finalized: boolean;
}

interface Account {
  id: string;
  name: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const YEAR_OPTIONS = [2024, 2025, 2026];
const INVOICE_TYPES: InvoiceType[] = ['Sales Invoice', 'Service Invoice', 'Invoice'];
const TWO_MILLION = 2_000_000;

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Service Revenue' },
  { id: 'acc-2', name: 'Product Sales' },
  { id: 'acc-3', name: 'Consulting Fees' },
  { id: 'acc-4', name: 'Rental Income' },
  { id: 'acc-5', name: 'Commission Income' },
];

// ─── Mock data ─────────────────────────────────────────────────────────────────

function buildMockRecords(yr: number, isVat: boolean): SalesRecord[] {
  const names = ['Acme Corp.', 'Santos Trading', 'Reyes & Sons', 'Cruz Enterprises', 'Global Soft Inc.'];
  const accs  = ['Service Revenue', 'Product Sales', 'Consulting Fees', 'Rental Income', 'Commission Income'];
  const types: InvoiceType[] = ['Sales Invoice', 'Service Invoice', 'Invoice'];
  const result: SalesRecord[] = [];
  let serial = 1001;
  for (let i = 0; i < 8; i++) {
    const gross = Math.round((15000 + i * 8500) * 100) / 100;
    const net   = isVat ? Math.round((gross / 1.12) * 100) / 100 : gross;
    const vat   = isVat ? Math.round((net * 0.12) * 100) / 100 : 0;
    const pt010 = !isVat ? Math.round((gross * 0.03) * 100) / 100 : 0;
    const pt150 = !isVat && i % 3 === 0 ? Math.round((gross * 0.05) * 100) / 100 : 0;
    result.push({
      id: `rec-${yr}-${i}`,
      serialNo: String(serial++),
      invoiceType: types[i % 3]!,
      date: `0${(i % 9) + 1}`.slice(-2) + '-' + `0${(i % 28) + 1}`.slice(-2),
      customerName: names[i % names.length]!,
      customerVat: i % 2 === 0 ? `123-${400 + i}-789` : '',
      account: accs[i % accs.length]!,
      amount: gross,
      netSales: net,
      vat,
      pt010,
      pt150,
      notes: i % 3 === 0 ? 'Partial payment received.' : '',
      receiptFile: '',
      receiptUrl: '',
    });
  }
  return result;
}

function buildMonthRecords(year: number, isVat: boolean): MonthRecord[] {
  const today = new Date();
  const maxMonth = year < today.getFullYear() ? 12 : today.getMonth() + 1;
  return Array.from({ length: maxMonth }, (_, i) => {
    const isOld = year < today.getFullYear() || i < today.getMonth();
    const records: SalesRecord[] = isOld ? buildMockRecords(year, isVat) : [];
    const gross = records.reduce((s, r) => s + r.amount, 0);
    const net   = records.reduce((s, r) => s + r.netSales, 0);
    const vat   = records.reduce((s, r) => s + r.vat, 0);
    const pt010 = records.reduce((s, r) => s + r.pt010, 0);
    const pt150 = records.reduce((s, r) => s + r.pt150, 0);
    return {
      id: `sb-${year}-${i + 1}`,
      coverageMonth: `${MONTH_NAMES[i]} ${year}`,
      monthIdx: i,
      year,
      grossSales: gross,
      netSales: net,
      vat,
      pt010,
      pt150,
      records,
      finalized: isOld,
    };
  });
}

// ─── Format helpers ─────────────────────────────────────────────────────────────

function fmtPHP(val: number): string {
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function nextSerial(records: SalesRecord[]): string {
  if (records.length === 0) return '1001';
  const nums = records.map(r => parseInt(r.serialNo, 10)).filter(n => !isNaN(n));
  return String(Math.max(...nums, 1000) + 1);
}

// ─── Encode view (per-month sales journal) ─────────────────────────────────────

interface EncodeViewProps {
  month: MonthRecord;
  isVat: boolean;
  isSuperAdmin: boolean;
  accounts: Account[];
  onBack: () => void;
  onFinalize: (monthId: string) => void;
  onUnfinalize: (monthId: string) => void;
  onUpdateMonth: (updated: MonthRecord) => void;
  onAddAccount: (name: string) => void;
  yearlyGross: number; // total gross for the year (all months combined)
}

function EncodeView({
  month, isVat, isSuperAdmin, accounts,
  onBack, onFinalize, onUnfinalize, onUpdateMonth, onAddAccount, yearlyGross,
}: EncodeViewProps): React.ReactNode {
  const [records, setRecords] = useState<SalesRecord[]>(month.records);
  const [isRecordOpen, setIsRecordOpen]     = useState(false);
  const [isAddAccOpen, setIsAddAccOpen]     = useState(false);
  const [newAccName, setNewAccName]         = useState('');
  const [editingRecord, setEditingRecord]   = useState<SalesRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const locked = month.finalized && !isSuperAdmin;

  // ── Form state ──────────────────────────────────────────────────────────────
  const emptyForm = useCallback((): Omit<SalesRecord, 'id' | 'netSales' | 'vat' | 'pt010' | 'pt150'> => ({
    serialNo: nextSerial(records),
    invoiceType: 'Sales Invoice',
    date: '',
    customerName: '',
    customerVat: '',
    account: accounts[0]?.name ?? '',
    amount: 0,
    notes: '',
    receiptFile: '',
    receiptUrl: '',
  }), [records, accounts]);

  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditingRecord(null);
    setForm(emptyForm());
    setIsRecordOpen(true);
  }

  function openEdit(rec: SalesRecord) {
    if (locked) return;
    setEditingRecord(rec);
    setForm({
      serialNo: rec.serialNo,
      invoiceType: rec.invoiceType,
      date: rec.date,
      customerName: rec.customerName,
      customerVat: rec.customerVat,
      account: rec.account,
      amount: rec.amount,
      notes: rec.notes,
      receiptFile: rec.receiptFile,
      receiptUrl: rec.receiptUrl,
    });
    setIsRecordOpen(true);
  }

  // ── Computed live values ────────────────────────────────────────────────────
  const computedNet = isVat ? Math.round((form.amount / 1.12) * 100) / 100 : form.amount;
  const computedVat = isVat ? Math.round((computedNet * 0.12) * 100) / 100 : 0;
  const computedPt010 = !isVat ? Math.round((form.amount * 0.03) * 100) / 100 : 0;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm(f => ({ ...f, receiptFile: file.name, receiptUrl: url }));
    e.target.value = '';
  }

  function saveRecord() {
    const rec: SalesRecord = {
      id: editingRecord?.id ?? `rec-${Date.now()}`,
      serialNo: form.serialNo,
      invoiceType: form.invoiceType,
      date: form.date,
      customerName: form.customerName,
      customerVat: form.customerVat,
      account: form.account,
      amount: form.amount,
      netSales: computedNet,
      vat: computedVat,
      pt010: computedPt010,
      pt150: 0,
      notes: form.notes,
      receiptFile: form.receiptFile,
      receiptUrl: form.receiptUrl,
    };

    let updated: SalesRecord[];
    if (editingRecord) {
      updated = records.map(r => r.id === editingRecord.id ? rec : r);
    } else {
      updated = [...records, rec];
    }
    setRecords(updated);
    const gross = updated.reduce((s, r) => s + r.amount, 0);
    const net   = updated.reduce((s, r) => s + r.netSales, 0);
    const vat   = updated.reduce((s, r) => s + r.vat, 0);
    const pt010 = updated.reduce((s, r) => s + r.pt010, 0);
    const pt150 = updated.reduce((s, r) => s + r.pt150, 0);
    onUpdateMonth({ ...month, records: updated, grossSales: gross, netSales: net, vat, pt010, pt150 });
    setIsRecordOpen(false);
  }

  function deleteRecord(id: string) {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    const gross = updated.reduce((s, r) => s + r.amount, 0);
    const net   = updated.reduce((s, r) => s + r.netSales, 0);
    const vat   = updated.reduce((s, r) => s + r.vat, 0);
    const pt010 = updated.reduce((s, r) => s + r.pt010, 0);
    const pt150 = updated.reduce((s, r) => s + r.pt150, 0);
    onUpdateMonth({ ...month, records: updated, grossSales: gross, netSales: net, vat, pt010, pt150 });
  }

  const totalGross = records.reduce((s, r) => s + r.amount, 0);
  const totalNet   = records.reduce((s, r) => s + r.netSales, 0);
  const totalVat   = records.reduce((s, r) => s + r.vat, 0);
  const totalPt010 = records.reduce((s, r) => s + r.pt010, 0);
  const totalPt150 = records.reduce((s, r) => s + r.pt150, 0);

  // Serial blank error check
  const hasBlankSerial = records.some(r => r.serialNo.trim() === '');
  const overTwoMillion = yearlyGross >= TWO_MILLION;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Sales Journal
      </button>

      {/* Encode header */}
      <Card className="p-5 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Sales Journal</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{month.coverageMonth}</h2>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
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
                  onClick={() => setIsAddAccOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <Plus size={12} /> Add Account
                </button>
                <button
                  onClick={openNew}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  <Plus size={12} /> Record Sales
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Alert banners */}
      {hasBlankSerial && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700">ERROR FOUND — One or more records have a blank serial number.</p>
        </div>
      )}
      {overTwoMillion && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">
            ALERT! — Total annual gross sales has reached {fmtPHP(yearlyGross)}, exceeding the ₱2,000,000 threshold.
          </p>
        </div>
      )}

      {/* Sales records table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isVat ? (
            /* ── VAT table ─────────────────────────────────────── */
            <table className="w-full text-sm border-collapse" style={{ minWidth: '860px' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Serial #','Invoice Type','Date','Customer Name','Customer VAT','Account','Amount','Net Sales','VAT (12%)','Notes','Receipt','Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">No records yet. Click "Record Sales" to add entries.</td></tr>
                ) : records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${rec.serialNo.trim() === '' ? 'text-red-600 bg-red-50' : 'text-slate-700'}`}>
                      {rec.serialNo.trim() === '' ? '— BLANK —' : rec.serialNo}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.invoiceType}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.date}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{rec.customerName}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">{rec.customerVat || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{rec.account}</td>
                    <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-800">{fmtPHP(rec.amount)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-slate-700">{fmtPHP(rec.netSales)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-blue-700">{fmtPHP(rec.vat)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 max-w-30 truncate">{rec.notes || '—'}</td>
                    <td className="px-3 py-2.5">
                      {rec.receiptFile ? (
                        <a href={rec.receiptUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors whitespace-nowrap">
                          <Paperclip size={10} />{rec.receiptFile.length > 12 ? rec.receiptFile.slice(0, 12) + '…' : rec.receiptFile}
                        </a>
                      ) : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {locked ? (
                        <span className="text-xs text-slate-300 flex items-center gap-1"><Lock size={9} /> Locked</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(rec)}
                            className="rounded-md px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => deleteRecord(rec.id)}
                            className="rounded-md p-1 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Totals */}
                {records.length > 0 && (
                  <tr className="bg-slate-100 border-t-2 border-slate-200 font-black text-xs">
                    <td colSpan={6} className="px-3 py-2 text-[9px] uppercase tracking-widest text-slate-500">Totals</td>
                    <td className="px-3 py-2 font-mono text-slate-900">{fmtPHP(totalGross)}</td>
                    <td className="px-3 py-2 font-mono text-slate-900">{fmtPHP(totalNet)}</td>
                    <td className="px-3 py-2 font-mono text-blue-700">{fmtPHP(totalVat)}</td>
                    <td colSpan={3} />
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* ── Non-VAT table ─────────────────────────────────── */
            <table className="w-full text-sm border-collapse" style={{ minWidth: '860px' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Serial #','Invoice Type','Date','Customer Name','Customer VAT','Account','Amount','PT010 (3%)','PT150 (5%)','Notes','Receipt','Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">No records yet. Click "Record Sales" to add entries.</td></tr>
                ) : records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${rec.serialNo.trim() === '' ? 'text-red-600 bg-red-50' : 'text-slate-700'}`}>
                      {rec.serialNo.trim() === '' ? '— BLANK —' : rec.serialNo}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.invoiceType}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.date}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{rec.customerName}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">{rec.customerVat || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{rec.account}</td>
                    <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-800">{fmtPHP(rec.amount)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-amber-700">{fmtPHP(rec.pt010)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-amber-700">{fmtPHP(rec.pt150)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 max-w-30 truncate">{rec.notes || '—'}</td>
                    <td className="px-3 py-2.5">
                      {rec.receiptFile ? (
                        <a href={rec.receiptUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors whitespace-nowrap">
                          <Paperclip size={10} />{rec.receiptFile.length > 12 ? rec.receiptFile.slice(0, 12) + '…' : rec.receiptFile}
                        </a>
                      ) : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {locked ? (
                        <span className="text-xs text-slate-300 flex items-center gap-1"><Lock size={9} /> Locked</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(rec)}
                            className="rounded-md px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => deleteRecord(rec.id)}
                            className="rounded-md p-1 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Totals */}
                {records.length > 0 && (
                  <tr className="bg-slate-100 border-t-2 border-slate-200 font-black text-xs">
                    <td colSpan={6} className="px-3 py-2 text-[9px] uppercase tracking-widest text-slate-500">Totals</td>
                    <td className="px-3 py-2 font-mono text-slate-900">{fmtPHP(totalGross)}</td>
                    <td className="px-3 py-2 font-mono text-amber-700">{fmtPHP(totalPt010)}</td>
                    <td className="px-3 py-2 font-mono text-amber-700">{fmtPHP(totalPt150)}</td>
                    <td colSpan={3} />
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Finalize bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5">
        <div className="text-xs text-slate-500 font-semibold">
          {month.finalized
            ? isSuperAdmin
              ? 'This month is finalized. You can unfinalize as Super Admin.'
              : 'This month is finalized and locked.'
            : 'Finalize this month to lock all records.'}
        </div>
        {month.finalized ? (
          isSuperAdmin && (
            <button
              onClick={() => onUnfinalize(month.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 active:scale-95 transition-all"
            >
              <Lock size={12} /> Unfinalize
            </button>
          )
        ) : (
          <button
            disabled={records.length === 0}
            onClick={() => onFinalize(month.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={12} /> Finalize Month
          </button>
        )}
      </div>

      {/* ── Record Sales Modal ── */}
      <Modal isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} title="" size="2xl">
        <div className="overflow-y-auto max-h-[85vh]">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {editingRecord ? 'Edit Sales Record' : 'Add Sales Record'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{month.coverageMonth}</p>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* Row 1: Serial # | Invoice Type | Date */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Serial #</label>
                <input
                  type="text"
                  value={form.serialNo}
                  onChange={e => setForm(f => ({ ...f, serialNo: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Invoice Type</label>
                <select
                  value={form.invoiceType}
                  onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value as InvoiceType }))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Date</label>
                <input
                  type="text"
                  placeholder="MM-DD"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Row 2: Customer Name | Customer VAT */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Customer Name</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Customer VAT</label>
                <input
                  type="text"
                  value={form.customerVat}
                  onChange={e => setForm(f => ({ ...f, customerVat: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="TIN (optional)"
                />
              </div>
            </div>

            {/* Row 3: Account | Amount | [Net/VAT computed] | Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* Account */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Account</label>
                  <select
                    value={form.account}
                    onChange={e => setForm(f => ({ ...f, account: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount || ''}
                    onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
                {/* Computed fields */}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
                      <p className="text-[9px] font-black uppercase tracking-wide text-amber-400 mb-0.5">PT010 (3%)</p>
                      <p className="text-sm font-black font-mono text-amber-700">{fmtPHP(computedPt010)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <p className="text-[9px] font-black uppercase tracking-wide text-slate-400 mb-0.5">PT150</p>
                      <p className="text-sm font-black font-mono text-slate-500">—</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes (right column) */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Notes <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                <textarea
                  rows={6}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-full"
                  style={{ minHeight: '158px' }}
                />
              </div>
            </div>

            {/* Receipt upload */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Receipt</label>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <Paperclip size={14} /> Upload Receipt
                </button>
                {form.receiptFile ? (
                  <div className="flex items-center gap-2">
                    <a href={form.receiptUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                      <ExternalLink size={11} /> {form.receiptFile}
                    </a>
                    <button onClick={() => setForm(f => ({ ...f, receiptFile: '', receiptUrl: '' }))}
                      className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">No file selected</span>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setIsRecordOpen(false)}>Cancel</Button>
              <button
                disabled={!form.customerName.trim() || form.amount <= 0}
                onClick={saveRecord}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editingRecord ? 'Save Changes' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Add Account Modal ── */}
      <Modal isOpen={isAddAccOpen} onClose={() => setIsAddAccOpen(false)} title="Add Account" size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Account Name</label>
            <input
              type="text"
              value={newAccName}
              onChange={e => setNewAccName(e.target.value)}
              placeholder="e.g. Freight Income"
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddAccOpen(false)}>Cancel</Button>
            <button
              disabled={!newAccName.trim()}
              onClick={() => { onAddAccount(newAccName.trim()); setNewAccName(''); setIsAddAccOpen(false); }}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface SalesBookDetailProps {
  client: MockClientWithCompliance;
  year: number;
  onYearChange: (y: number) => void;
  onBack: () => void;
  isSuperAdmin?: boolean;
}

export function SalesBookDetail({ client, year, onYearChange, onBack, isSuperAdmin = false }: SalesBookDetailProps): React.ReactNode {
  const isVat = isVatClient(client);

  const [months, setMonths] = useState<MonthRecord[]>(() => buildMonthRecords(year, isVat));
  const [prevYear, setPrevYear] = useState(year);
  if (prevYear !== year) {
    setPrevYear(year);
    setMonths(buildMonthRecords(year, isVat));
  }

  const [encodeMonth, setEncodeMonth] = useState<MonthRecord | null>(null);
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);

  // Yearly gross (for 2M alert)
  const yearlyGross = months.reduce((s, m) => s + m.grossSales, 0);

  function handleYearChange(y: number) {
    onYearChange(y);
  }

  function handleFinalize(monthId: string) {
    setMonths(prev => prev.map(m => m.id === monthId ? { ...m, finalized: true } : m));
  }

  function handleUnfinalize(monthId: string) {
    setMonths(prev => prev.map(m => m.id === monthId ? { ...m, finalized: false } : m));
  }

  function handleUpdateMonth(updated: MonthRecord) {
    setMonths(prev => prev.map(m => m.id === updated.id ? updated : m));
    setEncodeMonth(prev => prev?.id === updated.id ? updated : prev);
  }

  function handleAddAccount(name: string) {
    setAccounts(prev => [...prev, { id: `acc-${Date.now()}`, name }]);
  }

  // ── Encode subview ────────────────────────────────────────────────────────
  if (encodeMonth) {
    return (
      <EncodeView
        month={encodeMonth}
        isVat={isVat}
        isSuperAdmin={isSuperAdmin}
        accounts={accounts}
        onBack={() => setEncodeMonth(null)}
        onFinalize={handleFinalize}
        onUnfinalize={handleUnfinalize}
        onUpdateMonth={handleUpdateMonth}
        onAddAccount={handleAddAccount}
        yearlyGross={yearlyGross}
      />
    );
  }

  // ── Summary / overview ────────────────────────────────────────────────────

  // Per-row error & alert flags
  const ytdGross = months.reduce((s, m) => s + m.grossSales, 0);
  const ytdNet   = months.reduce((s, m) => s + m.netSales, 0);
  const ytdVat   = months.reduce((s, m) => s + m.vat, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Working Paper
      </button>

      {/* Header card */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">
                {client.businessName} ({client.clientNo})
              </p>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Sales Journal</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isVat ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">VAT Registered</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">Non-VAT</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={year}
              onChange={e => handleYearChange(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => setIsOpenCaseOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <FilePlus2 size={15} /> File Open Case
            </button>
          </div>
        </div>
      </Card>

      {/* YTD alert */}
      {ytdGross >= TWO_MILLION && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">
            ALERT! — Year-to-date gross sales {fmtPHP(ytdGross)} has reached the ₱2,000,000 VAT threshold.
          </p>
        </div>
      )}

      {/* Monthly records table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Monthly Sales Records — {year}
          </p>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            {isVat ? (
              <>
                <span>YTD Gross: <span className="text-slate-800 font-black font-mono">{fmtPHP(ytdGross)}</span></span>
                <span>YTD Net: <span className="text-slate-800 font-black font-mono">{fmtPHP(ytdNet)}</span></span>
                <span>YTD VAT: <span className="text-blue-700 font-black font-mono">{fmtPHP(ytdVat)}</span></span>
              </>
            ) : (
              <span>YTD Gross: <span className="text-slate-800 font-black font-mono">{fmtPHP(ytdGross)}</span></span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '640px' }}>
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Coverage</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Sales</th>
                {isVat && <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Net Sales</th>}
                {isVat && <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">VAT (12%)</th>}
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Errors</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Finalized</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {months.map(m => {
                const hasBlank = m.records.some(r => r.serialNo.trim() === '');
                const runningGross = months
                  .filter(mx => mx.year === m.year && mx.monthIdx <= m.monthIdx)
                  .reduce((s, mx) => s + mx.grossSales, 0);
                const isAlert = runningGross >= TWO_MILLION;
                return (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        {m.coverageMonth}
                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 shrink-0" />
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-800">
                      {m.grossSales > 0 ? fmtPHP(m.grossSales) : <span className="text-slate-300">—</span>}
                    </td>
                    {isVat && (
                      <td className="px-5 py-3.5 font-mono text-sm text-slate-700">
                        {m.netSales > 0 ? fmtPHP(m.netSales) : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    {isVat && (
                      <td className="px-5 py-3.5 font-mono text-sm text-blue-700">
                        {m.vat > 0 ? fmtPHP(m.vat) : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        {hasBlank && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-600">
                            <AlertCircle size={9} /> Error Found
                          </span>
                        )}
                        {isAlert && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-600">
                            <AlertTriangle size={9} /> Alert!
                          </span>
                        )}
                        {!hasBlank && !isAlert && (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {m.finalized ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                          <CheckCircle2 size={10} /> Finalized
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setEncodeMonth(m)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                      >
                        Encode
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Open Case Modal */}
      <Modal isOpen={isOpenCaseOpen} onClose={() => setIsOpenCaseOpen(false)} title="File Open Case" size="lg">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong> — Sales Book.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>BIR — Discrepancy in Sales</option>
                <option>BIR — Unregistered Receipts</option>
                <option>BIR — Late Sales Report</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Priority</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea rows={3} placeholder="Describe the case..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsOpenCaseOpen(false)}>Cancel</Button>
            <button onClick={() => setIsOpenCaseOpen(false)} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all">
              File Case
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
