// src/components/accounting/ClientFunds.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Loader2, Clock } from 'lucide-react';
import type { ClientFundListRecord, ClientFundTransactionType } from '@/types/accounting.types';

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



function getFileDisplay(record: ClientFundListRecord): { label: string; href: string | null } {
  if (record.lastInvoiceId) {
    return {
      label: record.lastInvoiceId,
      href: `/portal/accounting-and-finance/invoices/${record.lastInvoiceId}`,
    };
  }
  if (record.lastPaymentId) {
    return {
      label: record.lastPaymentId,
      href: `/portal/accounting-and-finance/payments/${record.lastPaymentId}`,
    };
  }
  if (record.lastPettyCashId) {
    return { label: record.lastPettyCashId, href: null };
  }
  return { label: '—', href: null };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientFunds() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<ClientFundListRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/accounting/client-funds');
        if (res.ok) {
          const json = (await res.json()) as { data: ClientFundListRecord[] };
          setRecords(json.data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = records.filter(
    (c) =>
      (c.clientNo ?? '').toLowerCase().includes(search.toLowerCase()) ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      (c.lastTransactionType
        ? TRANSACTION_TYPE_LABELS[c.lastTransactionType]
            .toLowerCase()
            .includes(search.toLowerCase())
        : false),
  );

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Client Funds</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition w-64"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Client No.</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Client Name</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Last Action</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">File</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-500">Pending Cheques</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-500">Balance Fund</th>
              <th className="w-8" />
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
                  {search ? 'No matching clients.' : 'No client fund records yet.'}
                </td>
              </tr>
            ) : (
              filtered.map((client) => {
                const file = getFileDisplay(client);
                return (
                  <tr
                    key={client.clientId}
                    onClick={() =>
                      router.push(
                        `/portal/accounting-and-finance/client-funds/${client.clientId}`,
                      )
                    }
                    className="bg-white hover:bg-amber-50/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 font-mono text-xs">
                      {client.clientNo ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{client.businessName}</td>
                    <td className="px-4 py-3">
                      {client.lastTransactionType ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${TRANSACTION_TYPE_CLASSES[client.lastTransactionType]}`}
                        >
                          {TRANSACTION_TYPE_LABELS[client.lastTransactionType]}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {file.href ? (
                        <a
                          href={file.href}
                          onClick={(e) => e.stopPropagation()}
                          className="text-amber-600 hover:underline"
                        >
                          {file.label.slice(-12)}
                        </a>
                      ) : (
                        <span className="text-slate-400">{file.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {client.pendingChequeCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <Clock size={11} />
                          {client.pendingChequeCount} · ₱{client.pendingChequeAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      ₱{client.currentBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-3">
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-amber-500 transition"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
