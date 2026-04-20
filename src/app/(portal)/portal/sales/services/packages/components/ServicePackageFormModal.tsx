// src/app/(portal)/portal/sales/services/packages/components/ServicePackageFormModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

interface ServiceOption {
  id: number;
  code: string | null;
  name: string;
  billingType: 'RECURRING' | 'ONE_TIME';
  serviceRate: string;
}

interface PackageItem {
  serviceId: number;
  quantity: number;
  overrideRate: string;
  search: string;
  open: boolean;
}

export interface PackageRecord {
  id: number;
  code: string;
  name: string;
  description: string | null;
  packageRate: string;
  isVatable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  items: {
    serviceId: number;
    quantity: number;
    overrideRate: string | null;
    service: { id: number; code: string | null; name: string; billingType: string; serviceRate: string };
  }[];
}

interface ServicePackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTarget: PackageRecord | null;
  onSaved: (pkg: PackageRecord) => void;
}

const EMPTY_ITEM: PackageItem = { serviceId: 0, quantity: 1, overrideRate: '', search: '', open: false };

// -- Searchable service picker -----------------------------------------------

function ServiceSearchInput({
  services,
  allServices,
  selected,
  search,
  open,
  disabled,
  onSearchChange,
  onSelect,
  onOpenChange,
}: {
  services: ServiceOption[];
  allServices: ServiceOption[];
  selected: ServiceOption | null;
  search: string;
  open: boolean;
  disabled: boolean;
  onSearchChange: (val: string) => void;
  onSelect: (svc: ServiceOption) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          placeholder="Search service…"
          value={search}
          disabled={disabled}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => onOpenChange(true)}
        />
      </div>

      {/* Rate chip below input */}
      {selected && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px]">
          <span className="font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {selected.code ?? '—'}
          </span>
          <span className={`font-bold px-1.5 py-0.5 rounded ${selected.billingType === 'RECURRING' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {selected.billingType === 'RECURRING' ? 'Recurring' : 'One-Time'}
          </span>
          <span className="text-slate-500">
            ₱{parseFloat(selected.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {open && (
        <div className="absolute z-30 top-[calc(100%-2px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
            {services.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">
                {allServices.length === 0 ? 'No active services found' : 'No matches'}
              </p>
            ) : (
              services.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onMouseDown={() => onSelect(svc)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-amber-50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{svc.name}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      {svc.code && <span className="font-mono">{svc.code}</span>}
                      <span className={`font-bold px-1 py-0.5 rounded ${svc.billingType === 'RECURRING' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {svc.billingType === 'RECURRING' ? 'Recurring' : 'One-Time'}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0 ml-3">
                    ₱{parseFloat(svc.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ServicePackageFormModal({
  isOpen,
  onClose,
  editTarget,
  onSaved,
}: ServicePackageFormModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [packageRate, setPackageRate] = useState('');
  const [isVatable, setIsVatable] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [items, setItems] = useState<PackageItem[]>([]);

  // Reset form when modal opens / editTarget changes
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (editTarget) {
        setCode(editTarget.code);
        setName(editTarget.name);
        setDescription(editTarget.description ?? '');
        setPackageRate(String(editTarget.packageRate));
        setIsVatable(editTarget.isVatable);
        setStatus(editTarget.status);
        setItems(
          editTarget.items.map((i) => ({
            serviceId: i.serviceId,
            quantity: i.quantity,
            overrideRate: i.overrideRate ?? '',
            search: i.service.name,
            open: false,
          })),
        );
      } else {
        setCode('');
        setName('');
        setDescription('');
        setPackageRate('');
        setIsVatable(false);
        setStatus('ACTIVE');
        setItems([]);
      }
    }
  }

  useEffect(() => {
    if (isOpen && services.length === 0) {
      fetch('/api/sales/services?status=ACTIVE')
        .then((r) => r.json())
        .then((d: { data?: ServiceOption[] }) => setServices(d.data ?? []))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof PackageItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rateNum = parseFloat(packageRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      error('Validation error', 'Package rate must be a positive number.');
      return;
    }
    for (const item of items) {
      if (!item.serviceId) {
        error('Validation error', 'All service items must have a service selected.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const body = {
        code,
        name,
        description: description || undefined,
        packageRate: rateNum,
        isVatable,
        status,
        items: items.map((i) => ({
          serviceId: i.serviceId,
          quantity: i.quantity,
          ...(i.overrideRate !== '' ? { overrideRate: parseFloat(i.overrideRate) } : {}),
        })),
      };

      const url = editTarget
        ? `/api/sales/services/packages/${editTarget.id}`
        : '/api/sales/services/packages';
      const method = editTarget ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({})) as { data?: PackageRecord; error?: string };
      if (!res.ok) {
        error(editTarget ? 'Failed to update package' : 'Failed to create package', data.error ?? 'An error occurred.');
        return;
      }

      success(
        editTarget ? 'Package updated' : 'Package created',
        `"${name}" was ${editTarget ? 'updated' : 'created'} successfully.`,
      );
      onSaved(data.data!);
      onClose();
    } catch {
      error(editTarget ? 'Failed to update package' : 'Failed to create package', 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50';
  const labelCls = 'block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTarget ? 'Edit Service Package' : 'New Service Package'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Code + Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Package Code *</label>
            <input
              className={inputCls}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. PKG-001"
              required
              disabled={isSaving}
            />
          </div>
          <div>
            <label className={labelCls}>Package Name *</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starter Bundle"
              required
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this package..."
            disabled={isSaving}
          />
        </div>

        {/* Rate + IsVatable + Status */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Package Rate (₱) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={packageRate}
              onChange={(e) => setPackageRate(e.target.value)}
              placeholder="0.00"
              required
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col justify-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isVatable}
                onChange={(e) => setIsVatable(e.target.checked)}
                disabled={isSaving}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-sm font-medium text-slate-700">VAT Applicable</span>
            </label>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              disabled={isSaving}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Package Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls}>Included Services</label>
            <button
              type="button"
              onClick={addItem}
              disabled={isSaving}
              className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 disabled:opacity-50"
            >
              <Plus size={12} />
              Add Service
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              No services added yet. Click &quot;Add Service&quot; to include services in this package.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_72px_120px_32px] gap-2 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Service</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Qty</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Override Rate</span>
                <span />
              </div>
              {items.map((item, index) => {
                const selectedSvc = services.find((s) => s.id === item.serviceId);
                const filtered = services.filter(
                  (s) =>
                    s.name.toLowerCase().includes(item.search.toLowerCase()) ||
                    (s.code ?? '').toLowerCase().includes(item.search.toLowerCase()),
                );
                return (
                  <div key={index} className="grid grid-cols-[1fr_72px_120px_32px] gap-2 items-start">
                    {/* Searchable service picker */}
                    <ServiceSearchInput
                      services={filtered}
                      allServices={services}
                      selected={selectedSvc ?? null}
                      search={item.search}
                      open={item.open}
                      disabled={isSaving}
                      onSearchChange={(val) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === index ? { ...it, search: val, open: true, serviceId: val ? it.serviceId : 0 } : it,
                          ),
                        )
                      }
                      onSelect={(svc) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === index ? { ...it, serviceId: svc.id, search: svc.name, open: false } : it,
                          ),
                        )
                      }
                      onOpenChange={(open) =>
                        setItems((prev) =>
                          prev.map((it, i) => (i === index ? { ...it, open } : it)),
                        )
                      }
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={inputCls}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                      disabled={isSaving}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Default"
                      className={inputCls}
                      value={item.overrideRate}
                      onChange={(e) => updateItem(index, 'overrideRate', e.target.value)}
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={isSaving}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-50 mt-0.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold"
          >
            {isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Package'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
