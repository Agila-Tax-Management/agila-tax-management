// src/components/accounting/ClientFundDetail.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type {
  ClientFundDetailData,
  ClientFundTransactionRecord,
  ClientFundTransactionType,
  ChequeMonitoringRecord,
  ChequeStatus,
} from '@/types/accounting.types';
import type { PettyCashRecord } from './PettyCashFund';
import { PettyCashViewModal } from './PettyCashViewModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRANSACTION_TYPE_LABELS: Record<ClientFundTransactionType, string> = {
  INVOICE_PAYMENT: 'Invoice Payment',
  PETTY_CASH_DEBIT: 'Petty Cash Debit',
  MANUAL_CREDIT: 'Manual Credit',
  MANUAL_DEBIT: 'Manual Debit',
  REFUND: 'Refund',
  CHEQUE_CLEARING: 'Cheque Clearing',
};

const TRANSACTION_TYPE_CLASSES: Record<ClientFundTransactionType, string> = {
  INVOICE_PAYMENT: 'bg-green-100 text-green-700',
  PETTY_CASH_DEBIT: 'bg-red-100 text-red-700',
  MANUAL_CREDIT: 'bg-emerald-100 text-emerald-700',
  MANUAL_DEBIT: 'bg-red-100 text-red-700',
  REFUND: 'bg-blue-100 text-blue-700',
  CHEQUE_CLEARING: 'bg-teal-100 text-teal-700',
};

const CREDIT_TYPES: ClientFundTransactionType[] = ['INVOICE_PAYMENT', 'MANUAL_CREDIT', 'REFUND', 'CHEQUE_CLEARING'];

const CHEQUE_STATUS_CONFIG: Record<ChequeStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  FOR_CLEARING: { label: 'For Clearing', cls: 'bg-amber-100 text-amber-700', icon: <Clock size={11} /> },
  CLEARED:      { label: 'Cleared',      cls: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={11} /> },
  BOUNCED:      { label: 'Bounced',      cls: 'bg-red-100 text-red-700',    icon: <XCircle size={11} /> },
};

function isCredit(type: ClientFundTransactionType): boolean {
  return CREDIT_TYPES.includes(type);
}

function getTypeLabel(txn: ClientFundTransactionRecord): string {
  if (txn.invoiceId) return 'Invoice';
  if (txn.paymentId) return 'Payment';
  if (txn.pettyCashId) return 'Petty Cash';
  return 'Manual';
}

function getFileInfo(txn: ClientFundTransactionRecord): { label: string; href: string | null } {
  if (txn.invoice) {
    return {
      label: txn.invoice.invoiceNumber,
      href: `/portal/accounting-and-finance/invoices/${txn.invoice.id}`,
    };
  }
  if (txn.payment) {
    return {
      label: txn.payment.paymentNumber,
      href: `/portal/accounting-and-finance/payments/${txn.payment.id}`,
    };
  }
  return { label: txn.transactionNo, href: null };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ClientFundDetailProps {
  clientId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientFundDetail({ clientId }: ClientFundDetailProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [data, setData] = useState<ClientFundDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pettyCashRecord, setPettyCashRecord] = useState<PettyCashRecord | null>(null);
  const [loadingPcfId, setLoadingPcfId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/accounting/client-funds/${clientId}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (res.ok) {
          const json = (await res.json()) as { data: ClientFundDetailData };
          setData(json.data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [clientId]);

  const openPettyCashModal = async (id: string) => {
    setLoadingPcfId(id);
    try {
      const res = await fetch(`/api/accounting/petty-cash/${id}`);
      if (res.ok) {
        const json = (await res.json()) as { data: PettyCashRecord };
        setPettyCashRecord(json.data);
      }
    } finally {
      setLoadingPcfId(null);
    }
  };

  const filtered = (data?.transactions ?? []).filter((t) => {
    const q = search.toLowerCase();
    return (
      t.date.includes(q) ||
      TRANSACTION_TYPE_LABELS[t.type].toLowerCase().includes(q) ||
      getTypeLabel(t).toLowerCase().includes(q) ||
      (t.processedBy?.name.toLowerCase().includes(q) ?? false) ||
      (t.invoice?.invoiceNumber.toLowerCase().includes(q) ?? false) ||
      (t.payment?.paymentNumber.toLowerCase().includes(q) ?? false) ||
      (t.pettyCash?.pcfNo.toLowerCase().includes(q) ?? false)
    );
  });

  if (!isLoading && (notFound || !data)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Client Funds</h1>
        </div>
        <div className="text-center py-16 text-slate-400">Client not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition shrink-0"
          title="Back to Client Funds"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Client Funds</h1>
      </div>

      {/* ── Client info bar + search ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Client:</span>
            <span className="text-sm font-bold text-slate-900">
              {data?.businessName ?? '—'}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Current Balance:</span>
            <span className="text-sm font-bold text-slate-900">
              ₱
              {(data?.currentBalance ?? 0).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition w-64"
          />
        </div>
      </div>

      {/* ── Pending cheque alert ── */}
      {(data?.cheques ?? []).some((c) => c.status === 'FOR_CLEARING') && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Pending Cheques</p>
            <p className="text-xs text-amber-700 mt-0.5">
              ₱{(data?.cheques ?? []).filter(c => c.status === 'FOR_CLEARING').reduce((s, c) => s + c.amount, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} across{' '}
              {(data?.cheques ?? []).filter(c => c.status === 'FOR_CLEARING').length} cheque(s) awaiting clearance — these will reflect in the balance once cleared.
            </p>
          </div>
        </div>
      )}

      {/* ── Transactions table ── */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Transaction Type</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">ID</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">User</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-500">Amount</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-500">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  {search ? 'No matching transactions.' : 'No transactions yet.'}
                </td>
              </tr>
            ) : (
              filtered.map((txn) => {
                const file = getFileInfo(txn);
                const credit = isCredit(txn.type);
                return (
                  <tr key={txn.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${TRANSACTION_TYPE_CLASSES[txn.type]}`}
                      >
                        {TRANSACTION_TYPE_LABELS[txn.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getTypeLabel(txn)}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {txn.pettyCashId ? (
                        <button
                          onClick={() => void openPettyCashModal(txn.pettyCashId!)}
                          className="text-amber-600 hover:underline font-mono text-xs"
                        >
                          {loadingPcfId === txn.pettyCashId ? (
                            <Loader2 size={12} className="animate-spin inline" />
                          ) : (
                            txn.pettyCash?.pcfNo ?? txn.pettyCashId
                          )}
                        </button>
                      ) : file.href ? (
                        <a href={file.href} className="text-amber-600 hover:underline">
                          {file.label}
                        </a>
                      ) : (
                        <span className="text-slate-500">{file.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {txn.processedBy?.name ?? '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${credit ? 'text-green-700' : 'text-red-600'}`}
                    >
                      {credit ? '+' : '-'}₱
                      {txn.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      ₱{txn.runningBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Petty Cash detail modal */}
      {pettyCashRecord && (
        <PettyCashViewModal
          record={pettyCashRecord}
          onClose={() => setPettyCashRecord(null)}
        />
      )}

      {/* ── Cheque Monitoring section ── */}
      {(data?.cheques ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-800">Cheque Monitoring</h2>
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Cheque No.</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Bank</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Cheque Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Reference</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.cheques ?? []).map((ch) => {
                  const cfg = CHEQUE_STATUS_CONFIG[ch.status];
                  const ref = ch.payment
                    ? { label: ch.payment.paymentNumber, href: `/portal/accounting-and-finance/payments/${ch.payment.id}` }
                    : ch.invoice
                    ? { label: ch.invoice.invoiceNumber, href: `/portal/accounting-and-finance/invoices/${ch.invoice.id}` }
                    : null;
                  return (
                    <tr key={ch.id} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{ch.chequeNo}</td>
                      <td className="px-4 py-3 text-slate-600">{ch.bankName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(ch.chequeDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {ref ? (
                          <a href={ref.href} className="text-amber-600 hover:underline">{ref.label}</a>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        {ch.status === 'CLEARED' && ch.clearedAt && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(ch.clearedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {ch.status === 'BOUNCED' && ch.bouncedAt && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(ch.bouncedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        ch.status === 'CLEARED' ? 'text-green-700' :
                        ch.status === 'BOUNCED' ? 'text-red-600' : 'text-amber-700'
                      }`}>
                        ₱{ch.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}