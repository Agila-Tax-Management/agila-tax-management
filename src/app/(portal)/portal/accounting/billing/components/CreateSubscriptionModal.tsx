// src/app/(portal)/portal/accounting/billing/components/CreateSubscriptionModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, ChevronDown, Search } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { createSubscriptionAction } from '../actions';
import type { ClientOnlyOption, ServicePlanOption } from '@/types/accounting.types';

const BILLING_CYCLES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUALLY', label: 'Semi-Annual' },
  { value: 'ANNUALLY', label: 'Annual' },
] as const;

type BillingCycleValue = (typeof BILLING_CYCLES)[number]['value'];

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CreateSubscriptionModal({
  isOpen,
  onClose,
  onSaved,
}: CreateSubscriptionModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();

  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [clientOptions, setClientOptions] = useState<ClientOnlyOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOnlyOption | null>(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [plans, setPlans] = useState<ServicePlanOption[]>([]);
  const [servicePlanId, setServicePlanId] = useState<number | ''>('');
  const [agreedRate, setAgreedRate] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycleValue>('MONTHLY');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setClientSearch('');
      setSelectedClient(null);
      setClientOptions([]);
      setServicePlanId('');
      setAgreedRate('');
      setBillingCycle('MONTHLY');
      setEffectiveDate('');
      setNextBillingDate('');
    }
  }

  const fetchClients = useCallback(async (query: string) => {
    setIsSearchingClients(true);
    try {
      const res = await fetch(
        `/api/accounting/payments/clients?search=${encodeURIComponent(query)}`,
      );
      if (res.ok) {
        const d = await res.json();
        setClientOptions((d as { data: ClientOnlyOption[] }).data);
      }
    } finally {
      setIsSearchingClients(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    const res = await fetch('/api/sales/service-plans');
    if (!res.ok) return;
    const d = await res.json();
    const raw = (
      d as {
        data: Array<{ id: number; name: string; serviceRate: unknown }>;
      }
    ).data;
    setPlans(raw.map((p) => ({ id: p.id, name: p.name, serviceRate: Number(p.serviceRate) })));
  }, []);

   
  useEffect(() => {
    if (isOpen) void loadPlans();
  }, [isOpen, loadPlans]);
   

  // Close client dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(e.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function handleClientSearchChange(value: string) {
    setClientSearch(value);
    setIsClientDropdownOpen(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.length >= 1) {
      searchTimerRef.current = setTimeout(() => void fetchClients(value), 300);
    } else {
      setClientOptions([]);
    }
  }

  function handlePlanChange(planId: number) {
    setServicePlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) setAgreedRate(String(plan.serviceRate));
  }

  function handleEffectiveDateChange(val: string) {
    setEffectiveDate(val);
    if (!nextBillingDate) setNextBillingDate(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) {
      toastError('Validation', 'Please select a client.');
      return;
    }
    if (!servicePlanId) {
      toastError('Validation', 'Please select a service plan.');
      return;
    }
    setIsSaving(true);
    try {
      const result = await createSubscriptionAction({
        clientId: selectedClient.id,
        servicePlanId: servicePlanId as number,
        agreedRate: parseFloat(agreedRate),
        billingCycle,
        effectiveDate,
        nextBillingDate,
      });

      if ('error' in result) {
        toastError('Create failed', result.error);
        return;
      }

      success(
        'Subscription created',
        `Subscription for ${selectedClient.businessName} has been created.`,
      );
      onSaved();
    } catch (err) {
      console.error('[CreateSubscriptionModal]', err);
      toastError('Unexpected error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Client Subscription" size="lg">
      <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-5">
        {/* Client */}
        <div ref={clientDropdownRef} className="relative">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Client <span className="text-rose-500">*</span>
          </label>
          {selectedClient ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {selectedClient.businessName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedClient.clientNo ?? `#${selectedClient.id}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null);
                  setClientSearch('');
                  setClientOptions([]);
                }}
                disabled={isSaving}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => handleClientSearchChange(e.target.value)}
                onFocus={() => setIsClientDropdownOpen(true)}
                placeholder="Search by business name or client no..."
                disabled={isSaving}
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              />
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              {isClientDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {isSearchingClients ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={14} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : clientOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {clientSearch.length === 0
                        ? 'Start typing to search...'
                        : 'No clients found'}
                    </p>
                  ) : (
                    clientOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClient(c);
                          setClientSearch(c.businessName);
                          setIsClientDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm text-foreground">{c.businessName}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.clientNo ?? `#${c.id}`}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service Plan */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Service Plan <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={servicePlanId}
            onChange={(e) => handlePlanChange(Number(e.target.value))}
            disabled={isSaving}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          >
            <option value="">Select a plan...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} —{' '}
                ₱{p.serviceRate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </option>
            ))}
          </select>
        </div>

        {/* Agreed Rate + Billing Cycle */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Agreed Rate (₱) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={agreedRate}
              onChange={(e) => setAgreedRate(e.target.value)}
              disabled={isSaving}
              placeholder="e.g. 2500.00"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Billing Cycle <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycleValue)}
              disabled={isSaving}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Effective Date + Next Billing Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Effective Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => handleEffectiveDateChange(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Next Billing Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Defaults to effective date
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !selectedClient}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Creating...
              </>
            ) : (
              'Create Subscription'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
