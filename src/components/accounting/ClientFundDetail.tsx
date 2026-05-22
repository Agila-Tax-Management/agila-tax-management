// src/components/accounting/ClientFundDetail.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import type {
  ClientFundDetailData,
  ClientFundTransactionRecord,
  ClientFundTransactionType,
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
};

const TRANSACTION_TYPE_CLASSES: Record<ClientFundTransactionType, string> = {
  INVOICE_PAYMENT: 'bg-green-100 text-green-700',
  PETTY_CASH_DEBIT: 'bg-red-100 text-red-700',
  MANUAL_CREDIT: 'bg-emerald-100 text-emerald-700',
  MANUAL_DEBIT: 'bg-red-100 text-red-700',
  REFUND: 'bg-blue-100 text-blue-700',
};

const CREDIT_TYPES: ClientFundTransactionType[] = ['INVOICE_PAYMENT', 'MANUAL_CREDIT', 'REFUND'];

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
    </div>
  );
}
