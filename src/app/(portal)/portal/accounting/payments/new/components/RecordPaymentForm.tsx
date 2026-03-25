// src/app/(portal)/portal/accounting/payments/new/components/RecordPaymentForm.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Badge } from '@/components/UI/Badge';
import {
  ChevronDown, Loader2, Wand2, AlertCircle,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { recordPaymentAction } from '../actions';
import type {
  ClientOnlyOption, UnpaidInvoiceOption, PaymentMethodType,
} from '@/types/accounting.types';

const METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'E_WALLET', label: 'E-Wallet (GCash / Maya)' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
];

const STATUS_BADGE: Record<string, 'warning' | 'info' | 'danger'> = {
  UNPAID: 'warning',
  PARTIALLY_PAID: 'info',
  OVERDUE: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partial',
  OVERDUE: 'Overdue',
};

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function RecordPaymentForm(): React.ReactNode {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // — Client search state —
  const [selectedClient, setSelectedClient] = useState<ClientOnlyOption | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientOptions, setClientOptions] = useState<ClientOnlyOption[]>([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // — Payment detail state —
  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentMethodType>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // — Invoice allocation state —
  const [invoices, setInvoices] = useState<UnpaidInvoiceOption[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // — Computed values —
  const amountNum = parseFloat(amount) || 0;
  const totalApplied = invoices.reduce((s, inv) => s + (parseFloat(applied[inv.id] ?? '0') || 0), 0);
  const unallocated = amountNum - totalApplied;
  const isOverApplied = unallocated < -0.001;

  /* eslint-disable react-hooks/set-state-in-effect -- API fetches on mount and triggered by deps */
  const fetchClients = useCallback(async (query: string) => {
    setIsSearchingClients(true);
    try {
      const res = await fetch(`/api/accounting/payments/clients?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const d = await res.json();
        setClientOptions(d.data ?? []);
      }
    } finally {
      setIsSearchingClients(false);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Fetch unpaid invoices when client changes
  useEffect(() => {
    if (!selectedClient) {
      setInvoices([]);
      setApplied({});
      return;
    }
    const loadInvoices = async () => {
      setIsLoadingInvoices(true);
      try {
        const res = await fetch(`/api/accounting/payments/unpaid-invoices?clientId=${selectedClient.id}`);
        if (res.ok) {
          const d = await res.json();
          setInvoices(d.data ?? []);
          setApplied({});
        }
      } finally {
        setIsLoadingInvoices(false);
      }
    };
    void loadInvoices();
  }, [selectedClient]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleClientSearchChange = (value: string) => {
    setClientSearch(value);
    setSelectedClient(null);
    setIsClientDropdownOpen(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim()) {
      searchTimerRef.current = setTimeout(() => void fetchClients(value), 300);
    } else {
      setClientOptions([]);
    }
  };

  const handleClientFocus = () => {
    setIsClientDropdownOpen(true);
    if (!clientSearch && clientOptions.length === 0) void fetchClients('');
  };

  const selectClient = (opt: ClientOnlyOption) => {
    setSelectedClient(opt);
    setClientSearch(opt.label);
    setIsClientDropdownOpen(false);
    setClientOptions([]);
  };

  const handleAutoApply = () => {
    let remaining = amountNum;
    const newApplied: Record<string, string> = {};
    for (const inv of invoices) {
      if (remaining <= 0.001) {
        newApplied[inv.id] = '0.00';
      } else {
        const apply = Math.min(remaining, inv.balanceDue);
        newApplied[inv.id] = apply.toFixed(2);
        remaining = Math.max(0, remaining - apply);
      }
    }
    setApplied(newApplied);
  };

  const handleAppliedChange = (invoiceId: string, value: string) => {
    setApplied((prev) => ({ ...prev, [invoiceId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) { toastError('Validation', 'Please select a client.'); return; }
    if (amountNum <= 0) { toastError('Validation', 'Amount received must be greater than 0.'); return; }
    if (!payDate) { toastError('Validation', 'Please set a payment date.'); return; }
    if (isOverApplied) { toastError('Validation', 'Total applied cannot exceed the amount received.'); return; }

    for (const inv of invoices) {
      const app = parseFloat(applied[inv.id] ?? '0') || 0;
      if (app > inv.balanceDue + 0.001) {
        toastError('Validation', `Applied amount for ${inv.invoiceNumber} exceeds its open balance.`);
        return;
      }
    }

    const validAllocations = invoices
      .map((inv) => ({
        invoiceId: inv.id,
        amountApplied: parseFloat(applied[inv.id] ?? '0') || 0,
      }))
      .filter((a) => a.amountApplied > 0.001);

    setIsSubmitting(true);
    try {
      const result = await recordPaymentAction({
        clientId: selectedClient.id,
        amount: amountNum,
        paymentDate: new Date(payDate).toISOString(),
        method,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        allocations: validAllocations,
      });

      if ('error' in result) {
        toastError('Payment failed', result.error);
        return;
      }
      success('Payment recorded', 'The payment has been saved successfully.');
      router.push(`/portal/accounting/payments/${result.paymentId}`);
    } catch {
      toastError('Payment failed', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Record Payment</h1>
        <p className="text-sm text-muted-foreground">Apply a client payment to one or more invoices</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {/* Payment Details Card */}
        <Card className="p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Payment Details</h2>

          {/* Client dropdown */}
          <div ref={clientDropdownRef} className="relative">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Client <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                value={clientSearch}
                onChange={(e) => handleClientSearchChange(e.target.value)}
                onFocus={handleClientFocus}
                placeholder="Search by business name or client no..."
                autoComplete="off"
              />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {isClientDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {isSearchingClients ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  </div>
                ) : clientOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No clients found</p>
                ) : (
                  clientOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); selectClient(opt); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 text-left transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">{opt.businessName}</span>
                      <span className="text-xs text-muted-foreground">{opt.subLabel}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Amount Received <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
          </div>

          {/* Method + Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethodType)}
                className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reference Number</label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Check #, bank ref, or transaction ID"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this payment..."
              rows={2}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </Card>

        {/* Sticky Allocation Summary */}
        {amountNum > 0 && (
          <div className="sticky top-4 z-10">
            <Card
              className={`p-4 border-2 ${
                isOverApplied
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20'
                  : 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 sm:gap-10">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount to Allocate</p>
                    <p className="text-lg font-bold text-foreground">{fmt(amountNum)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Applied</p>
                    <p className="text-lg font-bold text-emerald-600">{fmt(totalApplied)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {isOverApplied ? 'Over-Applied' : 'Unused Credit'}
                    </p>
                    <p className={`text-lg font-bold ${isOverApplied ? 'text-rose-600' : 'text-amber-600'}`}>
                      {fmt(Math.abs(unallocated))}
                    </p>
                  </div>
                </div>
                {isOverApplied && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-sm font-medium">
                    <AlertCircle size={14} />
                    <span>Over-applied by {fmt(Math.abs(unallocated))}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Invoice Allocation Table */}
        {selectedClient && (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Invoice Allocations</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Apply this payment to outstanding invoices for{' '}
                  <span className="font-medium text-foreground">{selectedClient.businessName}</span>
                </p>
              </div>
              {amountNum > 0 && invoices.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAutoApply}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <Wand2 size={14} />
                  Auto-Apply (FIFO)
                </Button>
              )}
            </div>

            {isLoadingInvoices ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={20} className="animate-spin text-amber-600" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                <p className="text-sm text-muted-foreground">No outstanding invoices for this client.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The payment will be recorded as unused credit.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Open Balance</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground w-36">Payment Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const appVal = parseFloat(applied[inv.id] ?? '0') || 0;
                      const isOverRow = appVal > inv.balanceDue + 0.001;
                      return (
                        <tr key={inv.id} className="border-b border-border last:border-none hover:bg-muted/10">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-amber-700">
                              {inv.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{fmtDate(inv.dueDate)}</td>
                          <td className="px-4 py-3 text-right text-foreground">{fmt(inv.totalAmount)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {fmt(inv.balanceDue)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={STATUS_BADGE[inv.status] ?? 'neutral'}>
                              {STATUS_LABEL[inv.status] ?? inv.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                ₱
                              </span>
                              <input
                                type="number"
                                min="0"
                                max={inv.balanceDue}
                                step="0.01"
                                value={applied[inv.id] ?? ''}
                                onChange={(e) => handleAppliedChange(inv.id, e.target.value)}
                                placeholder="0.00"
                                className={`w-full rounded-lg border text-sm text-right px-3 pl-6 py-1.5 focus:outline-none focus:ring-2 bg-background text-foreground ${
                                  isOverRow
                                    ? 'border-rose-400 focus:ring-rose-500'
                                    : 'border-border focus:ring-blue-500'
                                }`}
                              />
                            </div>
                            {isOverRow && (
                              <p className="text-[10px] text-rose-600 mt-1 text-right">Exceeds balance</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedClient || amountNum <= 0 || isOverApplied}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
