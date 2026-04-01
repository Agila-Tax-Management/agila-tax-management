// src/app/(portal)/portal/accounting/billing/[id]/components/SubscriptionDetailView.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  Building2,
  Calendar,
  Hash,
  Loader2,
  Pencil,
  Clock,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { EditSubscriptionModal } from './EditSubscriptionModal';
import type { SubscriptionDetailRecord } from '@/types/accounting.types';

const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUALLY: 'Semi-Annual',
  ANNUALLY: 'Annual',
};

const HISTORY_LABELS: Record<string, string> = {
  SUBSCRIPTION_CREATED: 'Subscription Created',
  RATE_CHANGED: 'Rate Changed',
  PLAN_CHANGED: 'Plan Changed',
  PAUSED: 'Subscription Paused',
  REACTIVATED: 'Subscription Reactivated',
  CANCELLED: 'Subscription Cancelled',
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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  id: string;
}

export function SubscriptionDetailView({ id }: Props): React.ReactNode {
  const { error: toastError } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const subId = parseInt(id, 10);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/accounting/subscriptions/${subId}`);
      if (!res.ok) {
        toastError('Not found', 'This subscription could not be loaded.');
        return;
      }
      const data = await res.json();
      setSubscription((data as { data: SubscriptionDetailRecord }).data);
    } finally {
      setIsLoading(false);
    }
  }, [subId, toastError]);

  /* eslint-disable react-hooks/set-state-in-effect -- API fetch on mount */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-amber-600" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Subscription not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500 p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {subscription.client.businessName}
              </h1>
              <Badge variant={subscription.isActive ? 'success' : 'neutral'}>
                {subscription.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {subscription.client.clientNo ?? `#${subscription.client.id}`} · Subscription
              #{subscription.id}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="gap-2 self-start sm:self-auto"
          >
            <Pencil size={14} /> Edit Subscription
          </Button>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card className="p-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Client Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    <Building2 size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Business Name</p>
                    <p className="text-sm font-medium text-foreground">
                      {subscription.client.businessName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    <Hash size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client No.</p>
                    <p className="text-sm font-medium text-foreground">
                      {subscription.client.clientNo ?? `#${subscription.client.id}`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Subscription Details */}
            <Card className="p-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Subscription Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-amber-100 rounded-md">
                    <RefreshCw size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Service Plan</p>
                    <p className="text-sm font-medium text-foreground">
                      {subscription.servicePlan.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-emerald-100 rounded-md">
                    <Banknote size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Agreed Rate</p>
                    <p className="text-sm font-bold text-emerald-600 font-mono">
                      {fmt(subscription.agreedRate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-blue-100 rounded-md">
                    <Clock size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Billing Cycle</p>
                    <p className="text-sm font-medium text-foreground">
                      {CYCLE_LABELS[subscription.billingCycle] ?? subscription.billingCycle}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    <Calendar size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Effective Date</p>
                    <p className="text-sm font-medium text-foreground">
                      {fmtDate(subscription.effectiveDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    <Calendar size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Billing Date</p>
                    <p className="text-sm font-medium text-foreground">
                      {fmtDate(subscription.nextBillingDate)}
                    </p>
                  </div>
                </div>

                {subscription.inactiveDate && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                      <Calendar size={14} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Inactive Since</p>
                      <p className="text-sm font-medium text-foreground">
                        {fmtDate(subscription.inactiveDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Right column (1/3) — History timeline ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} className="text-muted-foreground" />
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Change History
                  </h2>
                </div>

                {subscription.historyLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No history yet.
                  </p>
                ) : (
                  <ol className="relative space-y-0">
                    {subscription.historyLogs.map((log, idx) => (
                      <li key={log.id} className="relative pl-6 pb-6 last:pb-0">
                        {/* Vertical connector */}
                        {idx < subscription.historyLogs.length - 1 && (
                          <span className="absolute left-1.75 top-5 bottom-0 w-px bg-border" />
                        )}
                        {/* Dot */}
                        <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-amber-100 border-2 border-amber-400 dark:border-amber-500" />

                        <p className="text-xs font-semibold text-foreground leading-tight">
                          {HISTORY_LABELS[log.changeType] ?? log.changeType}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {log.actor?.name ?? 'System'} · {fmtDateTime(log.createdAt)}
                        </p>
                        {(log.oldValue ?? log.newValue) && (
                          <div className="mt-1.5 rounded-md bg-muted/40 border border-border px-2.5 py-1.5 text-[10px] space-y-0.5">
                            {log.oldValue && (
                              <p className="text-rose-500 line-through">{log.oldValue}</p>
                            )}
                            {log.newValue && (
                              <p className="text-emerald-600">{log.newValue}</p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {subscription && (
        <EditSubscriptionModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          subscription={subscription}
          onSaved={() => {
            setIsEditOpen(false);
            void load();
          }}
        />
      )}
    </>
  );
}
