// src/app/(portal)/portal/sales/lead-center/components/ProvisionAccountModal.tsx
'use client';

import React, { useState } from 'react';
import { Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { provisionLeadAccountAction } from '../actions';
import type { Lead } from './LeadDetailModal';

type BusinessEntity =
  | 'INDIVIDUAL'
  | 'SOLE_PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'CORPORATION'
  | 'COOPERATIVE';

const BUSINESS_ENTITY_OPTIONS: { value: BusinessEntity; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'CORPORATION', label: 'Corporation' },
  { value: 'COOPERATIVE', label: 'Cooperative' },
];

function inferBusinessEntity(businessType: string): BusinessEntity {
  switch (businessType.toLowerCase()) {
    case 'sole proprietorship':
      return 'SOLE_PROPRIETORSHIP';
    case 'corporation':
      return 'CORPORATION';
    case 'partnership':
      return 'PARTNERSHIP';
    case 'cooperative':
      return 'COOPERATIVE';
    default:
      return 'INDIVIDUAL';
  }
}

interface ProvisionAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onProvisioned: (updatedLead: Lead) => void;
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

export function ProvisionAccountModal({
  isOpen,
  onClose,
  lead,
  onProvisioned,
}: ProvisionAccountModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [step, setStep] = useState<'confirm' | 'form'>('confirm');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    businessEntity: 'INDIVIDUAL' as BusinessEntity,
  });

  // Reset step and pre-fill form whenever the modal opens — adjust state during render pattern
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep('confirm');
      setForm({
        fullName: [lead.firstName, lead.middleName, lead.lastName]
          .filter(Boolean)
          .join(' '),
        email: '',
        password: '',
        businessName: lead.businessName ?? '',
        businessEntity: inferBusinessEntity(lead.businessType),
      });
    }
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.fullName.trim()) {
      error('Validation error', 'Full name is required.');
      return;
    }
    if (!form.email.trim()) {
      error('Validation error', 'Email is required.');
      return;
    }
    if (!form.password || form.password.length < 8) {
      error('Validation error', 'Password must be at least 8 characters.');
      return;
    }
    if (!form.businessName.trim()) {
      error('Validation error', 'Business name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await provisionLeadAccountAction({
        leadId: lead.id,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        businessName: form.businessName.trim(),
        businessEntity: form.businessEntity,
      });

      if ('error' in result) {
        error('Provisioning failed', result.error);
        return;
      }

      success(
        'Account provisioned',
        `Client profile and portal user have been created successfully.`,
      );
      onProvisioned({ ...lead, isAccountCreated: true });
      onClose();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Client Account" size="lg">
      {step === 'confirm' ? (
        /* ── Step 1: Confirmation ──────────────────────────────── */
        <div className="px-6 py-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0 mt-0.5">
              <UserPlus size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-1.5">
                Continue to create account?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This will provision a new <strong className="text-foreground">Client</strong>{' '}
                profile and an{' '}
                <strong className="text-foreground">External Portal User</strong> for{' '}
                <strong className="text-foreground">
                  {lead.firstName} {lead.lastName}
                </strong>
                {lead.businessName ? ` (${lead.businessName})` : ''}. An initial onboarding
                invoice will also be generated covering all attached services.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep('form')} className="bg-[#25238e] text-white">
              Yes, Continue
            </Button>
          </div>
        </div>
      ) : (
        /* ── Step 2: Provisioning Form ─────────────────────────── */
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            The portal user will be <strong>inactive</strong> until manually activated from
            the Client Users settings.
          </p>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
            />
          </div>

          {/* Email + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={inputClass}
                placeholder="client@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className={inputClass}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={form.businessName}
              onChange={(e) => set('businessName', e.target.value)}
            />
          </div>

          {/* Business Entity */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Business Entity <span className="text-red-500">*</span>
            </label>
            <select
              className={inputClass}
              value={form.businessEntity}
              onChange={(e) => set('businessEntity', e.target.value as BusinessEntity)}
            >
              {BUSINESS_ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Services summary */}
          {(lead.servicePlans.length > 0 || lead.serviceOneTimePlans.length > 0) && (
            <div className="bg-muted/40 rounded-lg p-3 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Services to Invoice
              </p>
              {lead.servicePlans.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">
                    {p.name}{' '}
                    <span className="text-muted-foreground">
                      (Recurring &mdash;{' '}
                      {p.recurring.charAt(0) + p.recurring.slice(1).toLowerCase()})
                    </span>
                  </span>
                  <span className="font-semibold text-foreground shrink-0 ml-2">
                    ₱{Number(p.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {lead.serviceOneTimePlans.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">
                    {s.name}{' '}
                    <span className="text-muted-foreground">(One-Time)</span>
                  </span>
                  <span className="font-semibold text-foreground shrink-0 ml-2">
                    ₱{Number(s.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep('confirm')}
              disabled={submitting}
            >
              ← Back
            </Button>
            <Button
              onClick={() => {
                void handleSubmit();
              }}
              disabled={submitting}
              className="bg-[#25238e] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Provisioning...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="mr-2" />
                  Submit &amp; Provision Account
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
