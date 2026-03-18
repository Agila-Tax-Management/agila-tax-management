// src/components/dashboard/ClientFormModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import type { ClientRecord, ClientFormValues } from '@/types/client-management.types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ClientFormValues) => void;
  editingClient?: ClientRecord | null;
}

const BIZ_TYPES = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'CORPORATION', label: 'Corporation' },
  { value: 'COOPERATIVE', label: 'Cooperative' },
] as const;

function getInitialForm(editingClient?: ClientRecord | null): ClientFormValues {
  return {
    companyCode: editingClient?.companyCode ?? '',
    clientNo: editingClient?.clientNo ?? '',
    businessName: editingClient?.businessName ?? '',
    portalName: editingClient?.portalName ?? '',
    businessType: (editingClient?.businessType as ClientFormValues['businessType']) ?? 'SOLE_PROPRIETORSHIP',
    branchType: editingClient?.branchType ?? 'Main Branch',
    timezone: editingClient?.timezone ?? 'Asia/Manila',
  };
}

export default function ClientFormModal({
  isOpen,
  onClose,
  onSave,
  editingClient,
}: ClientFormModalProps): React.ReactNode {
  const { error: toastError } = useToast();
  const syncKey = `${isOpen}-${editingClient?.id ?? 'new'}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  const [form, setForm] = useState<ClientFormValues>(getInitialForm(editingClient));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setForm(getInitialForm(editingClient));
    setFieldErrors({});
  }

  function set(key: keyof ClientFormValues, value: string): void {
    setForm((prev: ClientFormValues) => ({ ...prev, [key]: value }));
    setFieldErrors((prev: Record<string, string>) => ({ ...prev, [key]: '' }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.companyCode.trim()) errors.companyCode = 'Company code is required';
    if (!form.businessName.trim()) errors.businessName = 'Business name is required';
    if (!form.businessType) errors.businessType = 'Business type is required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toastError('Validation failed', 'Please check the form for errors.');
      return false;
    }
    return true;
  }

  function handleSubmit(): void {
    if (!validate()) return;
    onSave(form);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingClient ? 'Edit Client' : 'Add New Client'}
      size="lg"
    >
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Company Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.companyCode}
              onChange={(e) => set('companyCode', e.target.value)}
              placeholder="e.g. comp-001"
              disabled={!!editingClient}
            />
            {fieldErrors.companyCode && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.companyCode}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Client No.
            </label>
            <Input
              value={form.clientNo}
              onChange={(e) => set('clientNo', e.target.value)}
              placeholder="e.g. 2024-0001"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Business Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.businessName}
            onChange={(e) => set('businessName', e.target.value)}
            placeholder="e.g. Santos General Merchandise"
          />
          {fieldErrors.businessName && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.businessName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Portal Name
          </label>
          <Input
            value={form.portalName}
            onChange={(e) => set('portalName', e.target.value)}
            placeholder="Defaults to business name"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Business Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.businessType}
              onChange={(e) => set('businessType', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BIZ_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {fieldErrors.businessType && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.businessType}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Branch Type
            </label>
            <Input
              value={form.branchType}
              onChange={(e) => set('branchType', e.target.value)}
              placeholder="e.g. Main Branch"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Timezone
          </label>
          <Input
            value={form.timezone}
            onChange={(e) => set('timezone', e.target.value)}
            placeholder="Asia/Manila"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {editingClient ? 'Save Changes' : 'Create Client'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
