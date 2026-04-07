// src/components/compliance/SalesBookDetail.tsx
'use client';

import React, { useState, useRef } from 'react';
import {
  FilePlus2, Building2, Plus, Lock,
  Paperclip, ExternalLink, AlertTriangle, AlertCircle,
  CheckCircle2, ChevronRight, X,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { Breadcrumb, type BreadcrumbItem } from '@/components/UI/Breadcrumb';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// â”€â”€â”€ VAT detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function isVatClient(client: MockClientWithCompliance): boolean {
  const bp = client.planDetails?.basePlan ?? '';
  if (bp === 'vip') return true;
  return bp.includes('vat') && !bp.includes('non-vat');
}

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// Navigation view discriminated union
type NavView =
  | { type: 'journal' }
  | { type: 'encode'; monthId: string }
  | { type: 'record-form'; monthId: string; recordId: string | null };

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmtPHP(val: number): string {
  return `â‚±${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function nextSerial(records: SalesRecord[]): string {
  if (records.length === 0) return '1001';
  const nums = records.map(r => parseInt(r.serialNo, 10)).filter(n => !isNaN(n));
  return String(Math.max(...nums, 1000) + 1);
}

function calcTotals(records: SalesRecord[]) {
  return {
    grossSales: records.reduce((s, r) => s + r.amount, 0),
    netSales:   records.reduce((s, r) => s + r.netSales, 0),
    vat:        records.reduce((s, r) => s + r.vat, 0),
    pt010:      records.reduce((s, r) => s + r.pt010, 0),
    pt150:      records.reduce((s, r) => s + r.pt150, 0),
  };
}

// â”€â”€â”€ Mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    return {
      id: `sb-${year}-${i + 1}`,
      coverageMonth: `${MONTH_NAMES[i]} ${year}`,
      monthIdx: i,
      year,
      ...calcTotals(records),
      records,
      finalized: isOld,
    };
  });
}

// â”€â”€â”€ Encode table (per-month sales records, stateless) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface EncodeTableProps {
  month: MonthRecord;
  isVat: boolean;
  isSuperAdmin: boolean;
  yearlyGross: number;
  onAddRecord: () => void;
  onEditRecord: (recordId: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onFinalize: () => void;
  onUnfinalize: () => void;
  onAddAccount: () => void;
}

function EncodeTable({
  month, isVat, isSuperAdmin, yearlyGross,
  onAddRecord, onEditRecord, onDeleteRecord, onFinalize, onUnfinalize, onAddAccount,
}: EncodeTableProps): React.ReactNode {
  const locked = month.finalized && !isSuperAdmin;
  const records = month.records;

  const totalGross = records.reduce((s, r) => s + r.amount, 0);
  const totalNet   = records.reduce((s, r) => s + r.netSales, 0);
  const totalVat   = records.reduce((s, r) => s + r.vat, 0);
  const totalPt010 = records.reduce((s, r) => s + r.pt010, 0);
  const totalPt150 = records.reduce((s, r) => s + r.pt150, 0);
  const hasBlankSerial = records.some(r => r.serialNo.trim() === '');
  const overTwoMillion = yearlyGross >= TWO_MILLION;

  return (
    <div className="space-y-5">
      {/* Month header */}
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
                  onClick={onAddAccount}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <Plus size={12} /> Add Account
                </button>
                <button
                  onClick={onAddRecord}
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
          <p className="text-sm font-semibold text-red-700">ERROR FOUND â€” One or more records have a blank serial number.</p>
        </div>
      )}
      {overTwoMillion && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">
            ALERT! â€” Total annual gross sales {fmtPHP(yearlyGross)} exceeds the â‚±2,000,000 threshold.
          </p>
        </div>
      )}

      {/* Records table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isVat ? (
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
                  <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">No records yet. Click &quot;Record Sales&quot; to add entries.</td></tr>
                ) : records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${rec.serialNo.trim() === '' ? 'text-red-600 bg-red-50' : 'text-slate-700'}`}>
                      {rec.serialNo.trim() === '' ? 'â€” BLANK â€”' : rec.serialNo}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.invoiceType}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.date}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{rec.customerName}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">{rec.customerVat || 'â€”'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{rec.account}</td>
                    <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-800">{fmtPHP(rec.amount)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-slate-700">{fmtPHP(rec.netSales)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-blue-700">{fmtPHP(rec.vat)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 max-w-30 truncate">{rec.notes || 'â€”'}</td>
                    <td className="px-3 py-2.5">
                      {rec.receiptFile
                        ? <a href={rec.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 whitespace-nowrap"><Paperclip size={10} />{rec.receiptFile.length > 12 ? rec.receiptFile.slice(0, 12) + 'â€¦' : rec.receiptFile}</a>
                        : <span className="text-xs text-slate-300">â€”</span>}
                    </td>
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
                  <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">No records yet. Click &quot;Record Sales&quot; to add entries.</td></tr>
                ) : records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${rec.serialNo.trim() === '' ? 'text-red-600 bg-red-50' : 'text-slate-700'}`}>
                      {rec.serialNo.trim() === '' ? 'â€” BLANK â€”' : rec.serialNo}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.invoiceType}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{rec.date}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{rec.customerName}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">{rec.customerVat || 'â€”'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{rec.account}</td>
                    <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-800">{fmtPHP(rec.amount)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-amber-700">{fmtPHP(rec.pt010)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-amber-700">{fmtPHP(rec.pt150)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 max-w-30 truncate">{rec.notes || 'â€”'}</td>
                    <td className="px-3 py-2.5">
                      {rec.receiptFile
                        ? <a href={rec.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 whitespace-nowrap"><Paperclip size={10} />{rec.receiptFile.length > 12 ? rec.receiptFile.slice(0, 12) + 'â€¦' : rec.receiptFile}</a>
                        : <span className="text-xs text-slate-300">â€”</span>}
                    </td>
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
            ? isSuperAdmin ? 'This month is finalized. You can unfinalize as Super Admin.' : 'This month is finalized and locked.'
            : 'Finalize this month to lock all records.'}
        </div>
        {month.finalized ? (
          isSuperAdmin && (
            <button onClick={onUnfinalize} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 active:scale-95 transition-all">
              <Lock size={12} /> Unfinalize
            </button>
          )
        ) : (
          <button disabled={records.length === 0} onClick={onFinalize} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <CheckCircle2 size={12} /> Finalize Month
          </button>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Record form page (full subview â€” no modal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface RecordFormPageProps {
  month: MonthRecord;
  existingRecord: SalesRecord | null;
  isVat: boolean;
  accounts: Account[];
  onSave: (record: SalesRecord) => void;
  onCancel: () => void;
}

function RecordFormPage({ month, existingRecord, isVat, accounts, onSave, onCancel }: RecordFormPageProps): React.ReactNode {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    serialNo:     existingRecord?.serialNo     ?? nextSerial(month.records),
    invoiceType:  (existingRecord?.invoiceType ?? 'Sales Invoice') as InvoiceType,
    date:         existingRecord?.date         ?? '',
    customerName: existingRecord?.customerName ?? '',
    customerVat:  existingRecord?.customerVat  ?? '',
    account:      existingRecord?.account      ?? accounts[0]?.name ?? '',
    amount:       existingRecord?.amount       ?? 0,
    notes:        existingRecord?.notes        ?? '',
    receiptFile:  existingRecord?.receiptFile  ?? '',
    receiptUrl:   existingRecord?.receiptUrl   ?? '',
  });

  const computedNet  = isVat ? Math.round((form.amount / 1.12) * 100) / 100 : form.amount;
  const computedVat  = isVat ? Math.round((computedNet * 0.12) * 100) / 100 : 0;
  const computedPt010 = !isVat ? Math.round((form.amount * 0.03) * 100) / 100 : 0;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, receiptFile: file.name, receiptUrl: URL.createObjectURL(file) }));
    e.target.value = '';
  }

  function handleSave() {
    onSave({
      id:           existingRecord?.id ?? `rec-${Date.now()}`,
      serialNo:     form.serialNo,
      invoiceType:  form.invoiceType,
      date:         form.date,
      customerName: form.customerName,
      customerVat:  form.customerVat,
      account:      form.account,
      amount:       form.amount,
      netSales:     computedNet,
      vat:          computedVat,
      pt010:        computedPt010,
      pt150:        0,
      notes:        form.notes,
      receiptFile:  form.receiptFile,
      receiptUrl:   form.receiptUrl,
    });
  }

  return (
    <Card className="border-slate-200 shadow-sm animate-in fade-in duration-200">
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          {existingRecord ? 'Edit Sales Record' : 'Add Sales Record'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{month.coverageMonth}</p>
      </div>
      <div className="px-6 py-6 space-y-5">

        {/* Row 1: Serial # | Invoice Type | Date */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Serial #</label>
            <input type="text" value={form.serialNo} onChange={e => setForm(f => ({ ...f, serialNo: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Invoice Type</label>
            <select value={form.invoiceType} onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value as InvoiceType }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Date</label>
            <input type="text" placeholder="MM-DD" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        {/* Row 2: Customer Name | Customer VAT */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Customer Name</label>
            <input type="text" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Enter customer name" className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Customer VAT</label>
            <input type="text" value={form.customerVat} onChange={e => setForm(f => ({ ...f, customerVat: e.target.value }))} placeholder="TIN (optional)" className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
                  <p className="text-[9px] font-black uppercase tracking-wide text-amber-400 mb-0.5">PT010 (3%)</p>
                  <p className="text-sm font-black font-mono text-amber-700">{fmtPHP(computedPt010)}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400 mb-0.5">PT150</p>
                  <p className="text-sm font-black font-mono text-slate-500">â€”</p>
                </div>
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
          <button disabled={!form.customerName.trim() || form.amount <= 0} onClick={handleSave} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {existingRecord ? 'Save Changes' : 'Add Record'}
          </button>
        </div>
      </div>
    </Card>
  );
}

// â”€â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SalesBookDetailProps {
  client: MockClientWithCompliance;
  year: number;
  onYearChange: (y: number) => void;
  onBack: () => void;
  isSuperAdmin?: boolean;
}

export function SalesBookDetail({ client, year, onYearChange, onBack, isSuperAdmin = false }: SalesBookDetailProps): React.ReactNode {
  const isVat = isVatClient(client);

  const [navView, setNavView]   = useState<NavView>({ type: 'journal' });
  const [months, setMonths]     = useState<MonthRecord[]>(() => buildMonthRecords(year, isVat));
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [isAddAccOpen, setIsAddAccOpen]   = useState(false);
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');

  // Year change resets to journal
  const [prevYear, setPrevYear] = useState(year);
  if (prevYear !== year) {
    setPrevYear(year);
    setMonths(buildMonthRecords(year, isVat));
    setNavView({ type: 'journal' });
  }

  // Derived lookups
  const selectedMonth  = navView.type !== 'journal' ? (months.find(m => m.id === navView.monthId) ?? null) : null;
  const editingRecord  = navView.type === 'record-form' && navView.recordId && selectedMonth
    ? (selectedMonth.records.find(r => r.id === navView.recordId) ?? null)
    : null;
  const yearlyGross    = months.reduce((s, m) => s + m.grossSales, 0);

  // Mutations
  function updateMonth(monthId: string, updater: (m: MonthRecord) => MonthRecord) {
    setMonths(prev => prev.map(m => m.id === monthId ? updater(m) : m));
  }

  function handleSaveRecord(record: SalesRecord) {
    if (navView.type !== 'record-form') return;
    const { monthId, recordId } = navView;
    updateMonth(monthId, m => {
      const records = recordId
        ? m.records.map(r => r.id === recordId ? record : r)
        : [...m.records, record];
      return { ...m, records, ...calcTotals(records) };
    });
    setNavView({ type: 'encode', monthId });
  }

  function handleDeleteRecord(monthId: string, recordId: string) {
    updateMonth(monthId, m => {
      const records = m.records.filter(r => r.id !== recordId);
      return { ...m, records, ...calcTotals(records) };
    });
  }

  function handleFinalize(monthId: string) {
    updateMonth(monthId, m => ({ ...m, finalized: true }));
  }

  function handleUnfinalize(monthId: string) {
    updateMonth(monthId, m => ({ ...m, finalized: false }));
  }

  // Breadcrumb
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Working Paper', onClick: onBack },
    { label: 'Sales Journal', onClick: navView.type !== 'journal' ? () => setNavView({ type: 'journal' }) : undefined },
  ];
  if (navView.type !== 'journal' && selectedMonth) {
    breadcrumbItems.push({
      label: selectedMonth.coverageMonth,
      onClick: navView.type === 'record-form'
        ? () => setNavView({ type: 'encode', monthId: selectedMonth.id })
        : undefined,
    });
  }
  if (navView.type === 'record-form') {
    breadcrumbItems.push({ label: navView.recordId ? 'Edit Sales Record' : 'Add Sales Record' });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* â”€â”€ Journal overview â”€â”€ */}
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
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Sales Journal</h1>
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

          {yearlyGross >= TWO_MILLION && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <p className="text-sm font-semibold text-amber-700">ALERT! â€” Year-to-date gross sales {fmtPHP(yearlyGross)} has reached the â‚±2,000,000 VAT threshold.</p>
            </div>
          )}

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Sales Records â€” {year}</p>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                <span>YTD Gross: <span className="text-slate-800 font-black font-mono">{fmtPHP(yearlyGross)}</span></span>
                {isVat && <span>YTD Net: <span className="font-black font-mono">{fmtPHP(months.reduce((s, m) => s + m.netSales, 0))}</span></span>}
                {isVat && <span>YTD VAT: <span className="text-blue-700 font-black font-mono">{fmtPHP(months.reduce((s, m) => s + m.vat, 0))}</span></span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: isVat ? '700px' : '560px' }}>
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
                    const runningGross = months.filter(mx => mx.year === m.year && mx.monthIdx <= m.monthIdx).reduce((s, mx) => s + mx.grossSales, 0);
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
                          {m.grossSales > 0 ? fmtPHP(m.grossSales) : <span className="text-slate-300">â€”</span>}
                        </td>
                        {isVat && <td className="px-5 py-3.5 font-mono text-sm text-slate-700">{m.netSales > 0 ? fmtPHP(m.netSales) : <span className="text-slate-300">â€”</span>}</td>}
                        {isVat && <td className="px-5 py-3.5 font-mono text-sm text-blue-700">{m.vat > 0 ? fmtPHP(m.vat) : <span className="text-slate-300">â€”</span>}</td>}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1">
                            {hasBlank && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-600"><AlertCircle size={9} /> Error Found</span>}
                            {isAlert  && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-600"><AlertTriangle size={9} /> Alert!</span>}
                            {!hasBlank && !isAlert && <span className="text-xs text-slate-300">â€”</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {m.finalized
                            ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700"><CheckCircle2 size={10} /> Finalized</span>
                            : <span className="text-xs text-slate-400 font-semibold">Pending</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => setNavView({ type: 'encode', monthId: m.id })} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all">
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
        </>
      )}

      {/* â”€â”€ Encode view â”€â”€ */}
      {navView.type === 'encode' && selectedMonth && (
        <EncodeTable
          month={selectedMonth}
          isVat={isVat}
          isSuperAdmin={isSuperAdmin}
          yearlyGross={yearlyGross}
          onAddRecord={() => setNavView({ type: 'record-form', monthId: selectedMonth.id, recordId: null })}
          onEditRecord={recordId => setNavView({ type: 'record-form', monthId: selectedMonth.id, recordId })}
          onDeleteRecord={recordId => handleDeleteRecord(selectedMonth.id, recordId)}
          onFinalize={() => handleFinalize(selectedMonth.id)}
          onUnfinalize={() => handleUnfinalize(selectedMonth.id)}
          onAddAccount={() => setIsAddAccOpen(true)}
        />
      )}

      {/* â”€â”€ Record form page â”€â”€ */}
      {navView.type === 'record-form' && selectedMonth && (
        <RecordFormPage
          month={selectedMonth}
          existingRecord={editingRecord}
          isVat={isVat}
          accounts={accounts}
          onSave={handleSaveRecord}
          onCancel={() => {
            if (navView.type === 'record-form') setNavView({ type: 'encode', monthId: navView.monthId });
          }}
        />
      )}

      {/* â”€â”€ Add Account Modal â”€â”€ */}
      <Modal isOpen={isAddAccOpen} onClose={() => setIsAddAccOpen(false)} title="Add Account" size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Account Name</label>
            <input type="text" value={newAccName} onChange={e => setNewAccName(e.target.value)} placeholder="e.g. Freight Income" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddAccOpen(false)}>Cancel</Button>
            <button disabled={!newAccName.trim()} onClick={() => { setAccounts(prev => [...prev, { id: `acc-${Date.now()}`, name: newAccName.trim() }]); setNewAccName(''); setIsAddAccOpen(false); }} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
          </div>
        </div>
      </Modal>

      {/* â”€â”€ File Open Case Modal â”€â”€ */}
      <Modal isOpen={isOpenCaseOpen} onClose={() => setIsOpenCaseOpen(false)} title="File Open Case" size="lg">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong> â€” Sales Book.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>BIR â€” Discrepancy in Sales</option>
                <option>BIR â€” Unregistered Receipts</option>
                <option>BIR â€” Late Sales Report</option>
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
    </div>
  );
}
