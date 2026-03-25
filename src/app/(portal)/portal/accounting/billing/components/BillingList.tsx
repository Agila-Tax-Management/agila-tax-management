// src/app/(portal)/portal/accounting/billing/components/BillingList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Plus, Loader2, Search, CalendarClock, RefreshCw } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { CreateSubscriptionModal } from './CreateSubscriptionModal';
import type { SubscriptionListRecord } from '@/types/accounting.types';

const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUALLY: 'Semi-Annual',
  ANNUALLY: 'Annual',
};

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BillingList(): React.ReactNode {
  const router = useRouter();
  const { error: toastError } = useToast();

  const [subscriptions, setSubscriptions] = useState<SubscriptionListRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/accounting/subscriptions');
      if (!res.ok) {
        toastError('Error', 'Failed to load subscriptions.');
        return;
      }
      const data = await res.json();
      setSubscriptions((data as { data: SubscriptionListRecord[] }).data);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  /* eslint-disable react-hooks/set-state-in-effect -- API fetch on mount */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = subscriptions.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      s.client.businessName.toLowerCase().includes(q) ||
      (s.client.clientNo ?? '').toLowerCase().includes(q) ||
      s.servicePlan.name.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && s.isActive) ||
      (filterStatus === 'inactive' && !s.isActive);
    return matchSearch && matchStatus;
  });

  // Reset page on filter or search change
  const [prevSearch, setPrevSearch] = useState('');
  const [prevFilter, setPrevFilter] = useState(filterStatus);
  if (prevSearch !== search || prevFilter !== filterStatus) {
    setPrevSearch(search);
    setPrevFilter(filterStatus);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Subscription Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage recurring billing plans for all active clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void load()}
            className="gap-1.5 px-3 py-1.5 text-xs"
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus size={14} />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by client name, client no., or plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background text-sm text-foreground pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as typeof filterStatus)
            }
            className="h-9 rounded-lg border border-border bg-background text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="animate-spin text-amber-600" />
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarClock size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No subscriptions found</p>
            <p className="text-xs mt-1">
              {subscriptions.length === 0
                ? 'Add a subscription to get started.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Plan
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Cycle
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Agreed Rate
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Next Billing
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() =>
                      router.push(`/portal/accounting/billing/${sub.id}`)
                    }
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {sub.client.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.client.clientNo ?? `#${sub.client.id}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {sub.servicePlan.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {CYCLE_LABELS[sub.billingCycle] ?? sub.billingCycle}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-foreground">
                      {fmt(sub.agreedRate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(sub.nextBillingDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={sub.isActive ? 'success' : 'neutral'}>
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length}
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateSubscriptionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => {
          setIsCreateOpen(false);
          void load();
        }}
      />
    </div>
  );
}
