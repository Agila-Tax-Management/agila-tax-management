// src/app/(portal)/portal/sales/settings/components/LeadStatusModal.tsx
'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

export interface LeadStatusRecord {
  id: number;
  name: string;
  color: string | null;
  sequence: number;
  isDefault: boolean;
  isOnboarding: boolean;
  isConverted: boolean;
  _count?: { leads: number };
}

interface LeadStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  status: LeadStatusRecord | null; // null = add mode
}

interface FormState {
  name: string;
  color: string;
  sequence: number;
  isDefault: boolean;
  isOnboarding: boolean;
  isConverted: boolean;
}

const DEFAULT_FORM: FormState = {
  name: '',
  color: '#3b82f6',
  sequence: 0,
  isDefault: false,
  isOnboarding: false,
  isConverted: false,
};

const COLOR_SWATCHES = [
  { label: 'Blue',     value: '#3b82f6' },
  { label: 'Sky',      value: '#0ea5e9' },
  { label: 'Emerald',  value: '#10b981' },
  { label: 'Green',    value: '#16a34a' },
  { label: 'Amber',    value: '#f59e0b' },
  { label: 'Orange',   value: '#f97316' },
  { label: 'Red',      value: '#ef4444' },
  { label: 'Violet',   value: '#8b5cf6' },
  { label: 'Indigo',   value: '#6366f1' },
  { label: 'Teal',     value: '#0d9488' },
  { label: 'Yellow',   value: '#eab308' },
  { label: 'Slate',    value: '#64748b' },
];

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

export function LeadStatusModal({
  isOpen, onClose, onSaved, status,
}: LeadStatusModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  // Adjust state during render
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setForm(
        status
          ? {
              name: status.name,
              color: status.color ?? '#3b82f6',
              sequence: status.sequence,
              isDefault: status.isDefault,
              isOnboarding: status.isOnboarding,
              isConverted: status.isConverted,
            }
          : DEFAULT_FORM,
      );
    }
  }

  const isEdit = status !== null;

  const handleSave = async () => {
    if (!form.name.trim()) { error('Validation', 'Status name is required.'); return; }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/settings/sales/lead-statuses/${status.id}`
        : '/api/admin/settings/sales/lead-statuses';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color,
          sequence: form.sequence,
          isDefault: form.isDefault,
          isOnboarding: form.isOnboarding,
          isConverted: form.isConverted,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error(isEdit ? 'Failed to update' : 'Failed to create', data.error ?? 'An error occurred.');
        return;
      }
      success(
        isEdit ? 'Status updated' : 'Status created',
        isEdit ? `"${form.name}" has been updated.` : `"${form.name}" has been added to the pipeline.`,
      );
      onSaved();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const ToggleFlag = ({
    label, checked, onChange, description,
  }: { label: string; checked: boolean; onChange: (v: boolean) => void; description: string }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all w-full ${
        checked
          ? 'bg-blue-50 border-blue-300 dark:border-blue-700'
          : 'bg-background border-border hover:border-blue-300'
      }`}
    >
      <span className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
        checked ? 'bg-blue-600 border-blue-600' : 'border-border'
      }`}>
        {checked && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
      </span>
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
      </span>
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Pipeline Stage' : 'Add Pipeline Stage'}
      size="md"
    >
      <div className="p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Stage Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Contacted, Proposal, Closed Won"
          />
        </div>

        {/* Color + Sequence row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Sequence</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.sequence}
              onChange={(e) => setForm((p) => ({ ...p, sequence: parseInt(e.target.value) || 0 }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">Lower = earlier in pipeline</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Color — <span style={{ color: form.color }} className="font-bold">{form.color}</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  title={swatch.label}
                  onClick={() => setForm((p) => ({ ...p, color: swatch.value }))}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    form.color === swatch.value ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: swatch.value }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Flag toggles */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">Stage Behavior</label>
          <div className="space-y-2">
            <ToggleFlag
              label="Default Stage"
              description="New leads automatically land here. Only one stage can be default."
              checked={form.isDefault}
              onChange={(v) => setForm((p) => ({ ...p, isDefault: v }))}
            />
            <ToggleFlag
              label="Onboarding Stage"
              description="TSA / Job Orders are prepared at this stage."
              checked={form.isOnboarding}
              onChange={(v) => setForm((p) => ({ ...p, isOnboarding: v }))}
            />
            <ToggleFlag
              label="Conversion Stage"
              description="Reaching this stage creates a client portal account."
              checked={form.isConverted}
              onChange={(v) => setForm((p) => ({ ...p, isConverted: v }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => { void handleSave(); }} disabled={saving} className="gap-2">
            <Save size={14} />
            {isEdit ? 'Update Stage' : 'Add Stage'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
