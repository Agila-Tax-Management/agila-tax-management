// src/components/compliance/CWTDetail.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, FilePlus2, Building2, Plus, Copy, Check,
  ExternalLink, ChevronRight, Lock,
} from 'lucide-react';
import { CWTMonthDetail } from './CWTMonthDetail';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DocRequirement {
  id: string;
  label: string;
  url: string;
}

interface ProcessStep {
  id: string;
  role: string;
  label: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
}

interface MonthRecord {
  id: string;
  coverageMonth: string;
  compensationWT: number;
  locked: boolean;
  preparer: string;
  paidAmount: number;
  zeroFiling: boolean;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  docRequirements: DocRequirement[];
  processSteps: ProcessStep[];
}

interface TaxInfo {
  tin: string;
  rdoCode: string;
  withholdingAgentName: string;
  registeredAddress: string;
  zipCode: string;
  contactNumber: string;
  category: string;
  filingEmail: string;
  amountOfRemittance: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const YEAR_OPTIONS = [2024, 2025, 2026];

const DOC_REQUIREMENT_LABELS = [
  'Filed Form (1601-C)',
  'Email Confirmation',
  'Payment Confirmation',
  'Alphalist DAT File',
  'Email Submission',
  'Email Validation',
];

const PROCESS_STEP_DEFS = [
  { id: 'prepare',         role: 'Compliance Officer', label: 'Prepared By' },
  { id: 'verify',          role: 'Compliance TL',      label: 'Verified By' },
  { id: 'payment_proceed', role: 'Finance Officer',    label: 'Payment Proceeded By' },
  { id: 'payment_approve', role: 'Finance Manager',    label: 'Payment Approved By' },
  { id: 'final_approve',   role: 'Executive / Admin',  label: 'Final Approved By' },
];

// Mock monthly compensation WT amount (would come from payroll data in production)
const MOCK_MONTHLY_CWT = 4250;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPHP(val: number): string {
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function buildMonthRecords(year: number): MonthRecord[] {
  const today = new Date();
  const maxMonth = year < today.getFullYear() ? 12 : today.getMonth() + 1;

  return Array.from({ length: maxMonth }, (_, i) => {
    const m = i + 1;
    // Older months are fully processed; current month is in-progress
    const isFullyProcessed = year < today.getFullYear() || m < today.getMonth() + 1;

    const docsFull = isFullyProcessed;
    const stepsFull = isFullyProcessed;

    return {
      id: `cwt-${year}-${m}`,
      coverageMonth: `${MONTH_NAMES[i]} ${year}`,
      // Amount is locked only when process is 100% complete
      compensationWT: MOCK_MONTHLY_CWT,
      locked: stepsFull,
      preparer: isFullyProcessed ? 'Juan Dela Cruz' : m === today.getMonth() + 1 ? 'Juan Dela Cruz' : '',
      paidAmount: isFullyProcessed ? MOCK_MONTHLY_CWT : 0,
      zeroFiling: false,
      paymentStatus: isFullyProcessed ? 'Paid' : 'Unpaid',
      docRequirements: DOC_REQUIREMENT_LABELS.map((label, di) => ({
        id: `cwt-doc-${year}-${m}-${di}`,
        label,
        url: docsFull ? `https://drive.google.com/file/cwt-example-${year}-${m}-${di}` : '',
      })),
      processSteps: PROCESS_STEP_DEFS.map((def, si) => ({
        id: `cwt-step-${year}-${m}-${si}`,
        role: def.role,
        label: def.label,
        acknowledgedBy: stepsFull ? ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Gonzales', 'CEO Office'][si] : '',
        acknowledgedAt: stepsFull ? `${year}-${String(m).padStart(2, '0')}-15` : '',
      })),
    };
  });
}

function buildDefaultTaxInfo(client: MockClientWithCompliance): TaxInfo {
  return {
    tin: '123-456-789-000',
    rdoCode: '082',
    withholdingAgentName: client.businessName,
    registeredAddress: 'Cebu City, Cebu',
    zipCode: '6000',
    contactNumber: '(032) 123-4567',
    category: 'Medium Taxpayer',
    filingEmail: 'tax@' + client.businessName.toLowerCase().replace(/\s+/g, '') + '.com',
    amountOfRemittance: MOCK_MONTHLY_CWT,
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ pct, color = 'emerald' }: { pct: number; color?: 'emerald' | 'blue' }): React.ReactElement {
  const clamped = Math.min(100, Math.max(0, pct));
  const bg    = color === 'blue' ? 'bg-blue-500'   : 'bg-emerald-500';
  const track = color === 'blue' ? 'bg-blue-100'   : 'bg-emerald-100';
  const text  = color === 'blue' ? 'text-blue-700' : 'text-emerald-700';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 rounded-full ${track} overflow-hidden`}>
        <div className={`h-full rounded-full ${bg} transition-all`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`text-[10px] font-black tabular-nums ${text}`}>{clamped}%</span>
    </div>
  );
}

function CopyField({ label, value, copyable = true }: { label: string; value: string; copyable?: boolean }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div className="flex items-start justify-between gap-2 py-2.5 px-4 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-all">{value || '—'}</p>
      </div>
      {copyable && value && (
        <button
          onClick={handleCopy}
          className="shrink-0 mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Copy"
        >
          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
        </button>
      )}
    </div>
  );
}

interface DocUrlInputProps {
  docId: string;
  recordId: string;
  onSave: (recordId: string, docId: string, url: string) => void;
}

function DocUrlInput({ docId, recordId, onSave }: DocUrlInputProps): React.ReactElement {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input
        type="url"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Paste file URL..."
        className="flex-1 h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
      />
      <button
        disabled={!value.trim()}
        onClick={() => onSave(recordId, docId, value.trim())}
        className="shrink-0 h-8 px-3 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Save
      </button>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface CWTDetailProps {
  client: MockClientWithCompliance;
  year: number;
  onYearChange: (y: number) => void;
}

export function CWTDetail({ client, year, onYearChange}: CWTDetailProps): React.ReactNode {

  // ── Records state ──────────────────────────────────────────────────────────
  const initialRecords = useMemo(() => buildMonthRecords(year), [year]);
  const [records, setRecords] = useState<MonthRecord[]>(initialRecords);

  // Sync when year changes (adjust-during-render pattern)
  const [prevYear, setPrevYear] = useState(year);
  if (prevYear !== year) {
    setPrevYear(year);
    setRecords(buildMonthRecords(year));
  }

  // ── Subview state ───────────────────────────────────────────────────────────
  const [view, setView] = useState<'list' | 'month-detail'>('list');
  const [selectedCWTMonth, setSelectedCWTMonth] = useState<string>('');

  // ── Add Payment modal ──────────────────────────────────────────────────────
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  // ── Open Case modal ────────────────────────────────────────────────────────
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);

  // ── Tax info ───────────────────────────────────────────────────────────────
  const [taxInfo] = useState<TaxInfo>(() => buildDefaultTaxInfo(client));

  // ── Progress helpers ───────────────────────────────────────────────────────
  function getFilingPct(record: MonthRecord): number {
    const total = record.docRequirements.length;
    if (total === 0) return 0;
    return Math.round((record.docRequirements.filter(d => d.url.trim() !== '').length / total) * 100);
  }

  function getProcessPct(record: MonthRecord): number {
    const total = record.processSteps.length;
    if (total === 0) return 0;
    return Math.round((record.processSteps.filter(s => s.acknowledgedBy !== '').length / total) * 100);
  }

  // ── Save payment ───────────────────────────────────────────────────────────
  function savePayment() {
    const amt = parseFloat(paymentAmount) || 0;
    setRecords(prev =>
      prev.map(r => {
        if (r.coverageMonth !== paymentMonth) return r;
        const newPaid = r.paidAmount + amt;
        const paymentStatus: MonthRecord['paymentStatus'] =
          newPaid >= r.compensationWT ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
        return { ...r, paidAmount: newPaid, paymentStatus };
      })
    );
    setPaymentMonth('');
    setPaymentAmount('');
    setPaymentRef('');
    setIsAddPaymentOpen(false);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  // Subview: per-month employee detail
  if (view === 'month-detail') {
    return (
      <CWTMonthDetail
        client={client}
        coverageMonth={selectedCWTMonth}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Compensation Withholding Tax
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={year}
              onChange={e => onYearChange(Number(e.target.value))}
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

      {/* ── Monthly Records ── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Monthly CWT Records — {year}
          </p>
          <button
            onClick={() => setIsAddPaymentOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus size={13} /> Add Payment
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '720px' }}>
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Coverage (Month)</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Compensation WT</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Preparer</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-44">Filing Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-44">Process Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr
                  key={record.id}
                  className="border-b border-slate-100 hover:bg-emerald-50 transition-colors cursor-pointer group"
                  onClick={() => { setSelectedCWTMonth(record.coverageMonth); setView('month-detail'); }}
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    <span className="flex items-center gap-1.5">
                      {record.coverageMonth}
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 shrink-0" />
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      {fmtPHP(record.compensationWT)}
                      {record.locked && (
                        <Lock size={11} className="text-slate-400 shrink-0" aria-label="Locked" />
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {record.preparer || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 w-44">
                    <ProgressBar pct={getFilingPct(record)} color="emerald" />
                  </td>
                  <td className="px-5 py-3.5 w-44">
                    <ProgressBar pct={getProcessPct(record)} color="blue" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════ */}

      {/* Month detail is now handled by CWTMonthDetail subview — see view === 'month-detail' above */}

      {/* ── Add Payment Modal ── */}
      <Modal isOpen={isAddPaymentOpen} onClose={() => setIsAddPaymentOpen(false)} title="Add Payment" size="md">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Coverage Month</label>
            <select
              value={paymentMonth}
              onChange={e => setPaymentMonth(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select month...</option>
              {records.map(r => (
                <option key={r.id} value={r.coverageMonth}>{r.coverageMonth}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Payment Amount</label>
            <input
              type="number"
              min="0"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Reference / OR Number</label>
            <input
              type="text"
              value={paymentRef}
              onChange={e => setPaymentRef(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. OR-2026-00123"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
            <button
              disabled={!paymentMonth || !paymentAmount}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={savePayment}
            >
              Save Payment
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Open Case Modal ── */}
      <Modal isOpen={isOpenCaseOpen} onClose={() => setIsOpenCaseOpen(false)} title="File Open Case" size="lg">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong> — Compensation Withholding Tax.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>BIR — Deficiency CWT</option>
                <option>BIR — Late Filing (1601-C)</option>
                <option>BIR — Non-Remittance</option>
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
            <textarea
              rows={3}
              placeholder="Describe the case..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsOpenCaseOpen(false)}>Cancel</Button>
            <button
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
              onClick={() => setIsOpenCaseOpen(false)}
            >
              File Case
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
