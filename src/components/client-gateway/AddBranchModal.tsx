// src/components/client-gateway/AddBranchModal.tsx
'use client';

import React, { useState } from 'react';
import { GitBranch, X, Loader2, Info } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { BusinessEntity } from '@/types/client-gateway.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentClient: {
    id: number;
    businessName: string;
    companyCode: string | null;
    businessEntity: BusinessEntity;
  } | null;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ENTITY_OPTIONS: { value: BusinessEntity; label: string; description: string }[] = [
  {
    value: 'INDIVIDUAL',
    label: 'Individual',
    description: 'Professional services by a natural person. Requires Individual Details (personal info, DOB, civil status).',
  },
  {
    value: 'SOLE_PROPRIETORSHIP',
    label: 'Sole Proprietorship',
    description: 'Single-owner business registered with DTI. Requires Individual Details (owner\'s personal info).',
  },
  {
    value: 'PARTNERSHIP',
    label: 'Partnership',
    description: 'Two or more persons. Requires Corporate Details (SEC registration, authorized representatives).',
  },
  {
    value: 'CORPORATION',
    label: 'Corporation',
    description: 'Stock or non-stock corp. Requires Corporate Details, board officers, shareholders, and GIS data.',
  },
  {
    value: 'COOPERATIVE',
    label: 'Cooperative',
    description: 'SEC-registered cooperative. Requires Corporate Details (registration, authorized representatives).',
  },
];

export function AddBranchModal({ isOpen, onClose, onSuccess, parentClient }: Props): React.ReactNode {
  const { success, error } = useToast();
  const [businessName, setBusinessName] = useState('');
  const [portalName, setPortalName] = useState('');
  const [businessEntity, setBusinessEntity] = useState<BusinessEntity>('CORPORATION');
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens — "adjust state during render" pattern
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && parentClient) {
      setBusinessName(parentClient.businessName);
      setPortalName(`${slugify(parentClient.businessName)}-branch`);
      setBusinessEntity(parentClient.businessEntity);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parentClient) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/client-gateway/clients/${parentClient.id}/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessEntity,
          portalName: portalName.trim() || undefined,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        error('Branch creation failed', json.error ?? 'Could not create branch client.');
        return;
      }
      success('Branch created', `${businessName.trim()} has been added as a branch.`);
      onSuccess();
      onClose();
    } catch {
      error('Branch creation failed', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen || !parentClient) return null;

  const codePrefix = parentClient.companyCode?.split('-')[0] ?? null;
  const selectedEntity = ENTITY_OPTIONS.find((e) => e.value === businessEntity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50">
              <GitBranch size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900">Add Branch</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Branch of <span className="font-semibold text-slate-700">{parentClient.businessName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Business Entity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Business Entity Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ENTITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBusinessEntity(opt.value)}
                  className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                    businessEntity === opt.value
                      ? 'border-[#25238e] bg-[#25238e]/5 ring-1 ring-[#25238e]/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    businessEntity === opt.value ? 'border-[#25238e]' : 'border-slate-300'
                  }`}>
                    {businessEntity === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-[#25238e]" />
                    )}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${businessEntity === opt.value ? 'text-[#25238e]' : 'text-slate-700'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Required info hint */}
          {selectedEntity && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3">
              <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                After creating this branch, complete{' '}
                <span className="font-semibold">BIR Information</span>,{' '}
                <span className="font-semibold">Business Operations</span>, and{' '}
                {['CORPORATION', 'PARTNERSHIP', 'COOPERATIVE'].includes(businessEntity) ? (
                  <><span className="font-semibold">Corporate Details</span>{businessEntity === 'CORPORATION' ? ' + Shareholders' : ''}</>
                ) : (
                  <span className="font-semibold">Individual Details</span>
                )}{' '}
                on the client detail page.
              </p>
            </div>
          )}

          {/* Business Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                setPortalName(`${slugify(e.target.value)}-branch`);
              }}
              required
              placeholder="Branch business name"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30"
            />
          </div>

          {/* Portal Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Portal Name</label>
            <input
              type="text"
              value={portalName}
              onChange={(e) => setPortalName(e.target.value)}
              placeholder="portal-name-slug"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30"
            />
            <p className="text-xs text-slate-400 mt-1">
              Used in the client portal URL. Auto-generated from business name.
            </p>
          </div>

          {/* Auto-generated codes note */}
          {codePrefix && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-3 text-xs text-indigo-700 space-y-1">
              <p>
                <span className="font-semibold">Company code</span> will be auto-assigned as the next
                sequential code under <span className="font-mono font-bold">{codePrefix}</span>{' '}
                (e.g. <span className="font-mono">{codePrefix}-002</span>).
              </p>
              <p>
                <span className="font-semibold">Client number</span> will be auto-generated for {new Date().getFullYear()}.
              </p>
              <p>
                The main branch&apos;s <span className="font-semibold">owner user</span> will
                automatically be assigned to this branch.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !businessName.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
              {saving ? 'Creating…' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
