// src/app/(portal)/portal/accounting/billing/[id]/components/EditSubscriptionModal.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { updateSubscriptionAction } from '../../actions';
import type { SubscriptionDetailRecord, ServicePlanOption } from '@/types/accounting.types';

const BILLING_CYCLES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUALLY', label: 'Semi-Annual' },
  { value: 'ANNUALLY', label: 'Annual' },
] as const;

type BillingCycleValue = (typeof BILLING_CYCLES)[number]['value'];

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionDetailRecord;
  onSaved: () => void;
}

export function EditSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  onSaved,
}: EditSubscriptionModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [plans, setPlans] = useState<ServicePlanOption[]>([]);
  const [servicePlanId, setServicePlanId] = useState(subscription.serviceId);
  const [agreedRate, setAgreedRate] = useState(String(subscription.agreedRate));
  const [billingCycle, setBillingCycle] = useState<BillingCycleValue>(
    subscription.billingCycle,
  );
  const [effectiveDate, setEffectiveDate] = useState(
    subscription.effectiveDate.split('T')[0],
  );
  const [nextBillingDate, setNextBillingDate] = useState(
    subscription.nextBillingDate?.split('T')[0] ?? '',
  );
  const [isActive, setIsActive] = useState(subscription.isActive);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when subscription prop changes
  const [prevSubId, setPrevSubId] = useState(subscription.id);
  if (subscription.id !== prevSubId) {
    setPrevSubId(subscription.id);
    setServicePlanId(subscription.serviceId);
    setAgreedRate(String(subscription.agreedRate));
    setBillingCycle(subscription.billingCycle);
    setEffectiveDate(subscription.effectiveDate.split('T')[0]);
    setNextBillingDate(subscription.nextBillingDate?.split('T')[0] ?? '');
    setIsActive(subscription.isActive);
  }

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
    if (isOpen && plans.length === 0) void loadPlans();
  }, [isOpen, plans.length, loadPlans]);
   

  function handlePlanChange(planId: number) {
    setServicePlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) setAgreedRate(String(plan.serviceRate));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateSubscriptionAction(subscription.id, {
        serviceId: servicePlanId,
        agreedRate: parseFloat(agreedRate),
        billingCycle,
        effectiveDate,
        nextBillingDate: nextBillingDate || null,
        isActive,
      });

      if ('error' in result) {
        toastError('Update failed', result.error);
        return;
      }

      success('Subscription updated', 'Changes have been saved successfully.');
      onSaved();
      onClose();
    } catch (err) {
      console.error('[EditSubscriptionModal]', err);
      toastError('Unexpected error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Subscription" size="lg">
      <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-5">
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
            {/* Show current plan as fallback while plans load */}
            {plans.length === 0 && (
              <option value={subscription.serviceId}>
                {subscription.service.name}
              </option>
            )}
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
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
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
              onChange={(e) => setEffectiveDate(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Next Billing Date
            </label>
            <input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Leave blank to pause auto-billing
            </p>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
          <div>
            <p className="text-sm font-medium text-foreground">Subscription Active</p>
            <p className="text-xs text-muted-foreground">
              Inactive subscriptions will not trigger auto-billing
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 ${
              isActive ? 'bg-amber-600' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
