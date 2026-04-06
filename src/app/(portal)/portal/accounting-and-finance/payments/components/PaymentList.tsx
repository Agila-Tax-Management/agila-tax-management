// src/app/(portal)/portal/accounting-and-finance/payments/components/PaymentList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import {
  Search, Plus, TrendingUp, Wallet, CreditCard,
  Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { PaymentListRecord, PaymentStats } from '@/types/accounting.types';

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHECK: 'Check',
  E_WALLET: 'E-Wallet',
  CREDIT_CARD: 'Credit Card',
};

const METHOD_BADGE: Record<string, 'neutral' | 'info' | 'success' | 'warning'> = {
  CASH: 'success',
  BANK_TRANSFER: 'info',
  CHECK: 'neutral',
  E_WALLET: 'info',
  CREDIT_CARD: 'warning',
};

function fmt(n: number) {
  return '?' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function PaymentList(): React.ReactNode {
  const router = useRouter();
  const { error: toastError } = useToast();

  const [payments, setPayments] = useState<PaymentListRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({ totalReceived: 0, totalUnusedCredit: 0, paymentCount: 0 });
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);

  // Reset page on filter change (adjust state during render)
  const [prevFilters, setPrevFilters] = useState({ search, methodFilter });
  if (prevFilters.search !== search || prevFilters.methodFilter !== methodFilter) {
    setPrevFilters({ search, methodFilter });
    setPage(1);
  }

   
  const load = useCallback(async (s: string, m: string, p: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (s) params.set('search', s);
      if (m) params.set('method', m);
      const res = await fetch(`/api/accounting/payments?${params.toString()}`);
      if (!res.ok) { toastError('Failed to load', 'Could not fetch payments.'); return; }
      const data = await res.json();
      setPayments(data.data ?? []);
      setStats(data.stats ?? { totalReceived: 0, totalUnusedCredit: 0, paymentCount: 0 });
      setMeta({ total: data.meta.total, pages: data.meta.pages });
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load(search, methodFilter, page);
  }, [load, search, methodFilter, page]);
   

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Received</p>
              <p className="text-xl font-bold text-foreground">{fmt(stats.totalReceived)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Wallet size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unused Credit</p>
              <p className="text-xl font-bold text-foreground">{fmt(stats.totalUnusedCredit)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CreditCard size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Payments</p>
              <p className="text-xl font-bold text-foreground">{stats.paymentCount.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by payment #, client, or reference..."
              className="pl-9"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Methods</option>
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Button
            onClick={() => router.push('/portal/accounting-and-finance/payments/new')}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            <Plus size={16} />
            Record Payment
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-amber-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <CreditCard size={32} className="text-muted-foreground mb-2 opacity-40" />
            <p className="text-muted-foreground text-sm">No payments found.</p>
            <p className="text-muted-foreground text-xs mt-1">Record your first payment to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment No.</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Unused Credit</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/portal/accounting-and-finance/payments/${p.id}`)}
                    className="border-b border-border last:border-none hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-amber-700">{p.paymentNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.paymentDate)}</td>
                    <td className="px-4 py-3">
                      {p.client ? (
                        <div>
                          <p className="font-medium text-foreground text-xs">{p.client.businessName}</p>
                          <p className="text-[11px] text-muted-foreground">{p.client.clientNo ?? `#${p.client.id}`}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.unusedAmount > 0 ? (
                        <span className="text-amber-600 font-medium">{fmt(p.unusedAmount)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={METHOD_BADGE[p.method] ?? 'neutral'}>
                        {METHOD_LABELS[p.method] ?? p.method}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                      {p.referenceNumber ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {meta.total} payment{meta.total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {meta.pages}</span>
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.min(meta.pages, prev + 1))}
                disabled={page === meta.pages}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
