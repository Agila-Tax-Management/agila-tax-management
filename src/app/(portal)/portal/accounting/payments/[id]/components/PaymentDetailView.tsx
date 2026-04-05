// src/app/(portal)/portal/accounting/payments/[id]/components/PaymentDetailView.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  CreditCard, Calendar, User, Hash,
  Wallet, FileText, Loader2, Banknote, Pencil,
  Upload, ImageIcon, Clock, ExternalLink,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { EditPaymentModal } from './EditPaymentModal';
import type { PaymentDetailRecord } from '@/types/accounting.types';

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHECK: 'Check',
  E_WALLET: 'E-Wallet (GCash / Maya)',
  CREDIT_CARD: 'Credit Card',
};

const METHOD_BADGE: Record<string, 'neutral' | 'info' | 'success' | 'warning'> = {
  CASH: 'success',
  BANK_TRANSFER: 'info',
  CHECK: 'neutral',
  E_WALLET: 'info',
  CREDIT_CARD: 'warning',
};

const INV_STATUS_BADGE: Record<string, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  UNPAID: 'warning',
  PARTIALLY_PAID: 'info',
  PAID: 'success',
  OVERDUE: 'danger',
  VOID: 'neutral',
};

const INV_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  VOID: 'Void',
};

const CHANGE_TYPE_LABEL: Record<string, string> = {
  PAYMENT_RECORDED: 'Payment Recorded',
  PAYMENT_UPDATED: 'Payment Updated',
  ALLOCATION_MODIFIED: 'Allocation Modified',
  STATUS_CHANGED: 'Status Changed',
  PAYMENT_VOIDED: 'Payment Voided',
};

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface PaymentDetailViewProps {
  id: string;
}

export function PaymentDetailView({ id }: PaymentDetailViewProps): React.ReactNode {
  const router = useRouter();
  const { error: toastError } = useToast();

  const [payment, setPayment] = useState<PaymentDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/accounting/payments/${id}`);
      if (!res.ok) { toastError('Not found', 'This payment could not be loaded.'); return; }
      const data = await res.json();
      setPayment((data as { data: PaymentDetailRecord }).data);
    } finally {
      setIsLoading(false);
    }
  }, [id, toastError]);

   
  useEffect(() => { void load(); }, [load]);
   

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-amber-600" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Payment not found.</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const totalApplied = payment.allocations.reduce((s, a) => s + a.amountApplied, 0);

  return (
    <>
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500 p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground font-mono">{payment.paymentNumber}</h1>
              <Badge variant={METHOD_BADGE[payment.method] ?? 'neutral'}>
                {METHOD_LABELS[payment.method] ?? payment.method}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Recorded on {fmtDateTime(payment.createdAt)}
              {payment.recordedBy ? ` by ${payment.recordedBy.name}` : ''}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="gap-2"
          >
            <Pencil size={14} /> Edit Payment
          </Button>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Summary stat cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Received</p>
                <p className="text-xl font-bold text-foreground">{fmt(payment.amount)}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Applied to Invoices</p>
                <p className="text-xl font-bold text-emerald-600">{fmt(totalApplied)}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Unused Credit</p>
                <p className={`text-xl font-bold ${payment.unusedAmount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {fmt(payment.unusedAmount)}
                </p>
              </Card>
            </div>

            {/* Payment Information Card */}
            <Card className="p-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Payment Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {/* Client */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    <User size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    {payment.client ? (
                      <>
                        <p className="text-sm font-medium text-foreground">{payment.client.businessName}</p>
                        <p className="text-xs text-muted-foreground">{payment.client.clientNo ?? `#${payment.client.id}`}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                {/* Payment Date */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    <Calendar size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Date</p>
                    <p className="text-sm font-medium text-foreground">{fmtDate(payment.paymentDate)}</p>
                  </div>
                </div>

                {/* Method */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    <CreditCard size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <p className="text-sm font-medium text-foreground">{METHOD_LABELS[payment.method] ?? payment.method}</p>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-emerald-50 rounded-md">
                    <Banknote size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Received</p>
                    <p className="text-sm font-bold text-foreground">{fmt(payment.amount)}</p>
                  </div>
                </div>

                {/* Unused Credit */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-amber-50 rounded-md">
                    <Wallet size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unused Credit</p>
                    <p className={`text-sm font-bold ${payment.unusedAmount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {payment.unusedAmount > 0 ? fmt(payment.unusedAmount) : '—'}
                    </p>
                  </div>
                </div>

                {/* Reference */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    <Hash size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reference No.</p>
                    <p className="text-sm font-medium text-foreground font-mono">
                      {payment.referenceNumber ?? '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {payment.notes && (
                <div className="mt-5 pt-5 border-t border-border flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md shrink-0">
                    <FileText size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{payment.notes}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Proof of Payment */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Proof of Payment
                </h2>
                <Button
                  variant="outline"
                  className="text-xs gap-1.5"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Upload size={12} /> {payment.proofOfPaymentUrl ? 'Replace' : 'Upload'}
                </Button>
              </div>

              {payment.proofOfPaymentUrl ? (
                <div className="space-y-3">
                  <a
                    href={payment.proofOfPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={payment.proofOfPaymentUrl}
                      alt="Proof of payment"
                      className="w-full max-h-72 object-contain rounded-lg border border-border bg-muted/30 group-hover:opacity-90 transition-opacity"
                    />
                  </a>
                  <a
                    href={payment.proofOfPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <ExternalLink size={12} /> Open full size
                  </a>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border text-muted-foreground cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                  onClick={() => setIsEditOpen(true)}
                >
                  <ImageIcon size={24} className="mb-2 opacity-40" />
                  <p className="text-sm">No proof uploaded yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Click to upload a photo</p>
                </div>
              )}
            </Card>

            {/* Allocations Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Invoice Allocations</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {payment.allocations.length} invoice{payment.allocations.length !== 1 ? 's' : ''} applied
                </p>
              </div>

              {payment.allocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <p className="text-sm text-muted-foreground">No invoice allocations — full amount is unused credit.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date Applied</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount Applied</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payment.allocations.map((alloc) => (
                        <tr
                          key={alloc.id}
                          onClick={() => router.push(`/portal/accounting/invoices/${alloc.invoiceId}`)}
                          className="border-b border-border last:border-none hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-amber-700">
                              {alloc.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {fmtDate(alloc.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                            {fmt(alloc.amountApplied)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={INV_STATUS_BADGE[alloc.invoiceStatus] ?? 'neutral'}>
                              {INV_STATUS_LABEL[alloc.invoiceStatus] ?? alloc.invoiceStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/40 border-t border-border">
                        <td className="px-4 py-3 font-medium text-muted-foreground" colSpan={2}>Total Applied</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {fmt(totalApplied)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* ── Right column (1/3) — Activity Timeline ── */}
          <div className="lg:col-span-1">
            <Card className="p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <Clock size={14} className="text-muted-foreground" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Activity & History
                </h2>
              </div>

              {payment.historyLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</p>
              ) : (
                <ol className="relative space-y-0">
                  {payment.historyLogs.map((log, idx) => (
                    <li key={log.id} className="relative pl-6">
                      {/* Vertical connector line */}
                      {idx < payment.historyLogs.length - 1 && (
                        <span className="absolute left-1.75 top-5 bottom-0 w-px bg-border" />
                      )}
                      {/* Dot */}
                      <span className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-amber-500 bg-amber-100" />

                      <div className="pb-6">
                        <p className="text-xs font-semibold text-foreground leading-tight">
                          {CHANGE_TYPE_LABEL[log.changeType] ?? log.changeType}
                        </p>
                        {log.actor && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            by {log.actor.name}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {fmtDateTime(log.createdAt)}
                        </p>

                        {(log.oldValue || log.newValue) && (
                          <div className="mt-2 rounded-md bg-muted/50 border border-border p-2 space-y-1 text-[11px]">
                            {log.oldValue && (
                              <div>
                                <span className="text-rose-500 font-semibold">Before: </span>
                                <span className="text-muted-foreground">{log.oldValue}</span>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <span className="text-emerald-600 font-semibold">After: </span>
                                <span className="text-muted-foreground">{log.newValue}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditPaymentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        payment={payment}
        onSaved={load}
      />
    </>
  );
}
