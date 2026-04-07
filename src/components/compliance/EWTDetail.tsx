// src/components/compliance/EWTDetail.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, FilePlus2, Building2, Plus, Copy, Check,
  ExternalLink, ChevronRight, Lock, ClipboardList,
  FileText, Clock,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// ─── Types ─────────────────────────────────────────────────────────────────────

type RentalType = 'Basic' | 'CUSA' | 'Others';

interface RentalRow {
  id: string;
  type: RentalType;
  amount: number;
  vatable: boolean;
  effectiveMonth: string;
  contractUrl: string;
}

interface RentalHistoryEntry {
  id: string;
  date: string;
  type: RentalType;
  previousAmount: number;
  newAmount: number;
  vatable: boolean;
  effectiveMonth: string;
  reason: string;
  updatedBy: string;
}

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
  expanded: number;
  locked: boolean;
  preparer: string;
  paidAmount: number;
  zerFiling: boolean;
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

const VAT_RATE = 0.12;
const EWT_RATE = 0.05;

const DOC_REQUIREMENT_LABELS = [
  'Filed Form',
  'Email Confirmation',
  'Payment Confirmation',
  'QAP DAT and Excel File',
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPHP(val: number): string {
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function computeVAT(amount: number, vatable: boolean): number {
  return vatable ? parseFloat((amount * VAT_RATE).toFixed(2)) : 0;
}

function computeNetOfVAT(amount: number, vatable: boolean): number {
  return vatable ? parseFloat((amount / (1 + VAT_RATE)).toFixed(2)) : amount;
}

function computeExpanded(amount: number, vatable: boolean): number {
  const net = computeNetOfVAT(amount, vatable);
  return parseFloat((net * EWT_RATE).toFixed(2));
}

function buildInitialRentals(): RentalRow[] {
  return [
    { id: 'rental-basic',  type: 'Basic',  amount: 15000, vatable: true,  effectiveMonth: 'January 2026', contractUrl: '' },
    { id: 'rental-cusa',   type: 'CUSA',   amount: 3000,  vatable: false, effectiveMonth: 'January 2026', contractUrl: '' },
    { id: 'rental-others', type: 'Others', amount: 0,     vatable: false, effectiveMonth: 'January 2026', contractUrl: '' },
  ];
}

function buildMonthRecords(year: number, rentals: RentalRow[]): MonthRecord[] {
  const today = new Date();
  const maxMonth = year < today.getFullYear() ? 12 : today.getMonth() + 1;

  const totalExpanded = rentals.reduce((acc, r) => acc + computeExpanded(r.amount, r.vatable), 0);

  return Array.from({ length: maxMonth }, (_, i) => {
    const m = i + 1;
    const isOld = year < today.getFullYear() || m < today.getMonth() + 1;
    const isPaid = isOld && m % 3 !== 0;

    return {
      id: `ewt-${year}-${m}`,
      coverageMonth: `${MONTH_NAMES[i]} ${year}`,
      expanded: totalExpanded,
      locked: isPaid,
      preparer: isPaid ? 'Juan Dela Cruz' : m === today.getMonth() + 1 ? 'Juan Dela Cruz' : '',
      paidAmount: isPaid ? totalExpanded : 0,
      zerFiling: totalExpanded === 0,
      paymentStatus: isPaid ? 'Paid' : 'Unpaid',
      docRequirements: DOC_REQUIREMENT_LABELS.map((label, di) => ({
        id: `doc-${m}-${di}`,
        label,
        url: isPaid ? `https://drive.google.com/file/example-${m}-${di}` : '',
      })),
      processSteps: PROCESS_STEP_DEFS.map((def, si) => ({
        id: `step-${m}-${si}`,
        role: def.role,
        label: def.label,
        // Only seed acknowledgements when all documentary requirements are present (isPaid implies all docs filled above)
        acknowledgedBy: isPaid ? ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Gonzales', 'CEO Office'][si] : '',
        acknowledgedAt: isPaid ? `2026-${String(m).padStart(2, '0')}-15` : '',
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
    amountOfRemittance: 0,
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ pct, color = 'emerald' }: { pct: number; color?: 'emerald' | 'blue' }): React.ReactElement {
  const clamped = Math.min(100, Math.max(0, pct));
  const bg = color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';
  const track = color === 'blue' ? 'bg-blue-100' : 'bg-emerald-100';
  const text = color === 'blue' ? 'text-blue-700' : 'text-emerald-700';
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
    <div className="flex items-start justify-between gap-2 py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-all">{value || '—'}</p>
      </div>
      {copyable && value && (
        <button
          onClick={handleCopy}
          className="shrink-0 mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Copy"
        >
          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
        </button>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface EWTDetailProps {
  client: MockClientWithCompliance;
  year: number;
  onYearChange: (y: number) => void;
  onBack: () => void;
}

export function EWTDetail({ client, year, onYearChange, onBack }: EWTDetailProps): React.ReactNode {

  // ── Rental state ────────────────────────────────────────────────────────────
  const [rentals, setRentals] = useState<RentalRow[]>(buildInitialRentals);
  const [rentalHistory, setRentalHistory] = useState<RentalHistoryEntry[]>([]);

  // Update Rental modal
  const [isUpdateRentalOpen, setIsUpdateRentalOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<RentalRow | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editVatable, setEditVatable] = useState(false);
  const [editEffectiveMonth, setEditEffectiveMonth] = useState('');
  const [editContractUrl, setEditContractUrl] = useState('');
  const [editReason, setEditReason] = useState('');

  // View History modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // ── Month records ──────────────────────────────────────────────────────────
  const monthRecords = useMemo(
    () => buildMonthRecords(year, rentals),
    [year, rentals]
  );

  // Add Payment modal
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [records, setRecords] = useState<MonthRecord[]>([]);

  // Sync records when monthRecords rebuild
  const [prevYear, setPrevYear] = useState(year);
  if (prevYear !== year) {
    setPrevYear(year);
    setRecords(monthRecords);
  }
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    setInitialized(true);
    setRecords(monthRecords);
  }

  // Month detail modal
  const [selectedRecord, setSelectedRecord] = useState<MonthRecord | null>(null);
  const [isMonthDetailOpen, setIsMonthDetailOpen] = useState(false);

  // Open Case modal
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);

  // Tax info (editable per client)
  const [taxInfo, setTaxInfo] = useState<TaxInfo>(() => buildDefaultTaxInfo(client));

  // ── Rental helpers ─────────────────────────────────────────────────────────
  function openUpdateRental(rental: RentalRow) {
    setUpdateTarget(rental);
    setEditAmount(String(rental.amount));
    setEditVatable(rental.vatable);
    setEditEffectiveMonth(rental.effectiveMonth);
    setEditContractUrl(rental.contractUrl);
    setEditReason('');
    setIsUpdateRentalOpen(true);
  }

  function saveRental() {
    if (!updateTarget) return;
    const newAmount = parseFloat(editAmount) || 0;
    const entry: RentalHistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      type: updateTarget.type,
      previousAmount: updateTarget.amount,
      newAmount,
      vatable: editVatable,
      effectiveMonth: editEffectiveMonth,
      reason: editReason,
      updatedBy: 'Current User',
    };
    setRentalHistory(prev => [entry, ...prev]);
    setRentals(prev =>
      prev.map(r =>
        r.id === updateTarget.id
          ? { ...r, amount: newAmount, vatable: editVatable, effectiveMonth: editEffectiveMonth, contractUrl: editContractUrl }
          : r
      )
    );
    setIsUpdateRentalOpen(false);
  }

  // ── Payment helpers ─────────────────────────────────────────────────────────
  function savePayment() {
    const amt = parseFloat(paymentAmount) || 0;
    setRecords(prev =>
      prev.map(r => {
        if (r.coverageMonth !== paymentMonth) return r;
        const newPaid = r.paidAmount + amt;
        const status: MonthRecord['paymentStatus'] =
          newPaid >= r.expanded ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
        return { ...r, paidAmount: newPaid, paymentStatus: status };
      })
    );
    setPaymentMonth('');
    setPaymentAmount('');
    setPaymentRef('');
    setIsAddPaymentOpen(false);
  }

  // ── Process step acknowledge ───────────────────────────────────────────────
  function acknowledgeStep(recordId: string, stepId: string) {
    // Block acknowledgement if documentary requirements are not fully complete
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    if (getFilingPct(record) < 100) return;

    setRecords(prev =>
      prev.map(r => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          processSteps: r.processSteps.map(s =>
            s.id === stepId
              ? { ...s, acknowledgedBy: 'Current User', acknowledgedAt: new Date().toISOString().slice(0, 10) }
              : s
          ),
        };
      })
    );
    if (selectedRecord?.id === recordId) {
      setSelectedRecord(prev =>
        prev
          ? {
              ...prev,
              processSteps: prev.processSteps.map(s =>
                s.id === stepId
                  ? { ...s, acknowledgedBy: 'Current User', acknowledgedAt: new Date().toISOString().slice(0, 10) }
                  : s
              ),
            }
          : prev
      );
    }
  }

  // ── Doc requirement update ─────────────────────────────────────────────────
  function saveDocUrl(recordId: string, docId: string, url: string) {
    setRecords(prev =>
      prev.map(r => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          docRequirements: r.docRequirements.map(d =>
            d.id === docId ? { ...d, url } : d
          ),
        };
      })
    );
    if (selectedRecord?.id === recordId) {
      setSelectedRecord(prev =>
        prev
          ? {
              ...prev,
              docRequirements: prev.docRequirements.map(d =>
                d.id === docId ? { ...d, url } : d
              ),
            }
          : prev
      );
    }
  }

  // ── Computed values for edit modal ─────────────────────────────────────────
  const editAmountNum = parseFloat(editAmount) || 0;
  const editVAT = computeVAT(editAmountNum, editVatable);
  const editNetOfVAT = computeNetOfVAT(editAmountNum, editVatable);
  const editExpanded = computeExpanded(editAmountNum, editVatable);

  // ── Progress helpers ───────────────────────────────────────────────────────
  function getFilingPct(record: MonthRecord): number {
    const total = record.docRequirements.length;
    if (total === 0) return 0;
    const filled = record.docRequirements.filter(d => d.url.trim() !== '').length;
    return Math.round((filled / total) * 100);
  }

  function getProcessPct(record: MonthRecord): number {
    const total = record.processSteps.length;
    if (total === 0) return 0;
    const done = record.processSteps.filter(s => s.acknowledgedBy !== '').length;
    return Math.round((done / total) * 100);
  }

  // ── Total expanded for display ─────────────────────────────────────────────
  const totalMonthlyExpanded = rentals.reduce((acc, r) => acc + computeExpanded(r.amount, r.vatable), 0);

  // ── Tax info remittance sync ────────────────────────────────────────────────
  const [prevExpanded, setPrevExpanded] = useState(totalMonthlyExpanded);
  if (prevExpanded !== totalMonthlyExpanded) {
    setPrevExpanded(totalMonthlyExpanded);
    setTaxInfo(prev => ({ ...prev, amountOfRemittance: totalMonthlyExpanded }));
  }

  // ─── Render ────────────────────────────────────────────────────────────────
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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Expanded Withholding Tax
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

      {/* ── Rental Details ── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rental Details</p>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">EWT Rate: 5%</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                {['Rental Type', 'Amount', 'VAT', 'Net of VAT', 'Expanded (5%)', 'Effective Month', 'Contract of Lease'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rentals.map(rental => {
                const vat = computeVAT(rental.amount, rental.vatable);
                const net = computeNetOfVAT(rental.amount, rental.vatable);
                const exp = computeExpanded(rental.amount, rental.vatable);
                return (
                  <tr key={rental.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                        {rental.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-800">{fmtPHP(rental.amount)}</td>
                    <td className="px-5 py-3.5 font-mono text-sm text-slate-700">
                      {rental.vatable ? fmtPHP(vat) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm text-slate-700">{fmtPHP(net)}</td>
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-emerald-700">{fmtPHP(exp)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{rental.effectiveMonth}</td>
                    <td className="px-5 py-3.5">
                      {rental.contractUrl ? (
                        <a
                          href={rental.contractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                        >
                          <ExternalLink size={12} /> Open File
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">No file</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Total row */}
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Total</td>
                <td className="px-5 py-3 font-mono text-sm font-black text-slate-800">
                  {fmtPHP(rentals.reduce((a, r) => a + r.amount, 0))}
                </td>
                <td className="px-5 py-3 font-mono text-sm font-semibold text-slate-700">
                  {fmtPHP(rentals.reduce((a, r) => a + computeVAT(r.amount, r.vatable), 0))}
                </td>
                <td className="px-5 py-3 font-mono text-sm font-semibold text-slate-700">
                  {fmtPHP(rentals.reduce((a, r) => a + computeNetOfVAT(r.amount, r.vatable), 0))}
                </td>
                <td className="px-5 py-3 font-mono text-sm font-black text-emerald-700">
                  {fmtPHP(totalMonthlyExpanded)}
                </td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={() => openUpdateRental(rentals[0])}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 active:scale-95 transition-all"
          >
            <FileText size={14} /> Update Rental
          </button>
          <Button
            variant="outline"
            className="text-slate-600 border-slate-200 hover:bg-slate-50 text-sm"
            onClick={() => setIsHistoryOpen(true)}
          >
            <Clock size={14} className="mr-1.5" /> View History
          </Button>
        </div>
      </Card>

      {/* ── Monthly Records ── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly EWT Records — {year}</p>
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
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Expanded</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Preparer</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-44">Filing Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-44">Process Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => {
                const filingPct = getFilingPct(record);
                const processPct = getProcessPct(record);
                return (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 hover:bg-emerald-50 transition-colors cursor-pointer group"
                    onClick={() => { setSelectedRecord(record); setIsMonthDetailOpen(true); }}
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      <span className="flex items-center gap-1.5">
                        {record.coverageMonth}
                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 shrink-0" />
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        {fmtPHP(record.expanded)}
                        {record.locked && <Lock size={11} className="text-slate-400 shrink-0" aria-label="Locked" />}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{record.preparer || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5 w-44">
                      <ProgressBar pct={filingPct} color="emerald" />
                    </td>
                    <td className="px-5 py-3.5 w-44">
                      <ProgressBar pct={processPct} color="blue" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════ */}

      {/* ── Update Rental Modal ── */}
      <Modal isOpen={isUpdateRentalOpen} onClose={() => setIsUpdateRentalOpen(false)} title="Update Rental" size="lg">
        <div className="p-6 space-y-4">
          {/* Rental type tabs */}
          <div className="flex gap-2">
            {rentals.map(r => (
              <button
                key={r.id}
                onClick={() => openUpdateRental(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                  updateTarget?.id === r.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Amount</label>
              <input
                type="number"
                min="0"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Effective Month</label>
              <input
                type="text"
                value={editEffectiveMonth}
                onChange={e => setEditEffectiveMonth(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. April 2026"
              />
            </div>
          </div>

          {/* Vatable checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
            <div
              onClick={() => setEditVatable(v => !v)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                editVatable ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 bg-white'
              }`}
            >
              {editVatable && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm font-semibold text-slate-700">Vatable</span>
          </label>

          {/* Live computation */}
          {editAmountNum > 0 && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">VAT (12%)</p>
                <p className={`text-sm font-black ${editVatable ? 'text-slate-800' : 'text-slate-300'}`}>{fmtPHP(editVAT)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Net of VAT</p>
                <p className="text-sm font-black text-slate-800">{fmtPHP(editNetOfVAT)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Expanded (5%)</p>
                <p className="text-sm font-black text-emerald-700">{fmtPHP(editExpanded)}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Contract of Lease URL</label>
            <input
              type="url"
              value={editContractUrl}
              onChange={e => setEditContractUrl(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Reason for Update <span className="text-red-500">*</span></label>
            <textarea
              rows={2}
              value={editReason}
              onChange={e => setEditReason(e.target.value)}
              placeholder="Describe the reason for this update..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsUpdateRentalOpen(false)}>Cancel</Button>
            <button
              disabled={!editReason.trim()}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={saveRental}
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* ── View History Modal ── */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Rental History" size="2xl">
        <div className="p-6 space-y-3 overflow-y-auto max-h-[60vh]">
          {rentalHistory.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No history recorded yet.</p>
          ) : rentalHistory.map(entry => (
            <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-wide mr-2">
                    {entry.type}
                  </span>
                  <span className="text-xs text-slate-500">{entry.date}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">Updated by {entry.updatedBy}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 font-mono line-through">{fmtPHP(entry.previousAmount)}</span>
                <ChevronRight size={12} className="text-slate-400" />
                <span className="font-black font-mono text-slate-800">{fmtPHP(entry.newAmount)}</span>
              </div>
              <p className="text-xs text-slate-500"><span className="font-semibold text-slate-700">Reason:</span> {entry.reason}</p>
              <p className="text-xs text-slate-500"><span className="font-semibold text-slate-700">Effective:</span> {entry.effectiveMonth} · {entry.vatable ? 'Vatable' : 'Non-Vatable'}</p>
            </div>
          ))}
        </div>
      </Modal>

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

      {/* ── Month Detail Modal ── */}
      <Modal
        isOpen={isMonthDetailOpen}
        onClose={() => setIsMonthDetailOpen(false)}
        title=""
        size="3xl"
        contentClassName="overflow-y-auto"
      >
        {selectedRecord && (() => {
          const filingPct = getFilingPct(selectedRecord);
          const processPct = getProcessPct(selectedRecord);
          const filingComplete = filingPct === 100;
          const completedSteps = selectedRecord.processSteps.filter(s => s.acknowledgedBy !== '').length;
          const nextStepIdx = completedSteps < selectedRecord.processSteps.length ? completedSteps : -1;

          return (
            <div className="overflow-y-auto max-h-[80vh]">
              {/* Modal header area */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Expanded Withholding Tax</h2>
                <p className="text-sm text-slate-500 mt-0.5">For the month of <strong className="text-slate-800">{selectedRecord.coverageMonth}</strong></p>
              </div>

              <div className="px-6 py-5 space-y-6">

                {/* ── Summary row ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Tax Withheld</p>
                    <p className="text-lg font-black text-slate-900">{fmtPHP(selectedRecord.expanded)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Based on rental × 5%</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Paid by Client</p>
                    <p className="text-lg font-black text-emerald-700">{fmtPHP(selectedRecord.paidAmount)}</p>
                    <button
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                      onClick={() => {/* future: open payment detail */}}
                    >
                      <ExternalLink size={10} /> See Payment
                    </button>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Zero Filing</p>
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        selectedRecord.zerFiling ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {selectedRecord.zerFiling ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Payment Status</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        selectedRecord.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : selectedRecord.paymentStatus === 'Partial'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {selectedRecord.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Tax Information ── */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Tax Information</p>
                  <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                    <CopyField label="Tax Identification Number (TIN)" value={taxInfo.tin} copyable={false} />
                    <CopyField label="RDO Code" value={taxInfo.rdoCode} copyable />
                    <CopyField label="Withholding Agent's Name" value={taxInfo.withholdingAgentName} copyable />
                    <CopyField label="Registered Address" value={taxInfo.registeredAddress} copyable />
                    <CopyField label="Zip Code" value={taxInfo.zipCode} copyable />
                    <CopyField label="Contact Number" value={taxInfo.contactNumber} copyable />
                    <CopyField label="Category of Withholding Agent" value={taxInfo.category} copyable={false} />
                    <CopyField label="Filing Email Address" value={taxInfo.filingEmail} copyable />
                    <CopyField label="Amount of Remittance" value={fmtPHP(selectedRecord.expanded)} copyable={false} />
                  </div>
                </div>

                {/* ── Documentary Requirements ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Documentary Requirements</p>
                    <ProgressBar pct={filingPct} color="emerald" />
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Requirement</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedRecord.docRequirements.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-700 text-sm">{doc.label}</td>
                            <td className="px-4 py-3">
                              {doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                  <ExternalLink size={11} /> Open File
                                </a>
                              ) : (
                                <DocUrlInput
                                  docId={doc.id}
                                  recordId={selectedRecord.id}
                                  onSave={saveDocUrl}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Process Flow ── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Process Flow</p>
                    <ProgressBar pct={processPct} color="blue" />
                  </div>
                  {!filingComplete && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
                      <Lock size={13} className="text-amber-500 shrink-0" />
                      <p className="text-xs font-semibold text-amber-700">
                        Complete all documentary requirements (Filing Status 100%) before acknowledging process steps.
                      </p>
                    </div>
                  )}
                  <div className="space-y-0">
                    {selectedRecord.processSteps.map((step, idx) => {
                      const done = step.acknowledgedBy !== '';
                      const isNext = idx === nextStepIdx;
                      const locked = !done && !isNext;
                      return (
                        <div key={step.id} className="flex gap-4">
                          {/* connector */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                              done
                                ? 'bg-blue-600 border-blue-600'
                                : isNext && filingComplete
                                ? 'bg-white border-blue-400'
                                : 'bg-white border-slate-200'
                            }`}>
                              {done
                                ? <Check size={14} className="text-white" />
                                : <span className={`text-xs font-black ${isNext && filingComplete ? 'text-blue-500' : 'text-slate-300'}`}>{idx + 1}</span>
                              }
                            </div>
                            {idx < selectedRecord.processSteps.length - 1 && (
                              <div className={`w-0.5 flex-1 min-h-7 ${done ? 'bg-blue-300' : 'bg-slate-200'}`} />
                            )}
                          </div>
                          {/* content */}
                          <div className={`flex-1 pb-5 ${idx === selectedRecord.processSteps.length - 1 ? 'pb-0' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`text-xs font-black uppercase tracking-wide ${done ? 'text-blue-700' : isNext && filingComplete ? 'text-slate-700' : 'text-slate-300'}`}>
                                  {step.label}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${done ? 'text-slate-500' : isNext && filingComplete ? 'text-slate-400' : 'text-slate-300'}`}>
                                  {step.role}
                                </p>
                                {done && (
                                  <p className="text-[10px] text-blue-600 font-semibold mt-1">
                                    {step.acknowledgedBy} · {step.acknowledgedAt}
                                  </p>
                                )}
                              </div>
                              {isNext && (
                                <button
                                  disabled={!filingComplete}
                                  onClick={() => acknowledgeStep(selectedRecord.id, step.id)}
                                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                  <ClipboardList size={11} /> Acknowledge
                                </button>
                              )}
                              {locked && (
                                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-slate-300 font-semibold">
                                  <Lock size={10} /> Locked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Open Case Modal ── */}
      <Modal isOpen={isOpenCaseOpen} onClose={() => setIsOpenCaseOpen(false)} title="File Open Case" size="lg">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong> — Expanded Withholding Tax.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>BIR — Deficiency EWT</option>
                <option>BIR — Late Filing</option>
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
            <textarea rows={3} placeholder="Describe the case..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
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

// ─── DocUrlInput ────────────────────────────────────────────────────────────────

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
