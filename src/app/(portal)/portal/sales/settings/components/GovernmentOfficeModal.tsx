// src/app/(portal)/portal/sales/settings/components/GovernmentOfficeModal.tsx
'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

export interface GovernmentOfficeRecord {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface GovernmentOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  office: GovernmentOfficeRecord | null; // null = add mode
}

interface FormState {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

const DEFAULT_FORM: FormState = { code: '', name: '', description: '', isActive: true };

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

export function GovernmentOfficeModal({
  isOpen, onClose, onSaved, office,
}: GovernmentOfficeModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  // Adjust state during render
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setForm(
        office
          ? { code: office.code, name: office.name, description: office.description ?? '', isActive: office.isActive }
          : DEFAULT_FORM,
      );
    }
  }

  const set = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isEdit = office !== null;

  const handleSave = async () => {
    if (!form.code.trim()) { error('Validation', 'Office code is required.'); return; }
    if (!form.name.trim()) { error('Validation', 'Office name is required.'); return; }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/sales/government-offices/${office.id}`
        : '/api/sales/government-offices';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error(isEdit ? 'Failed to update' : 'Failed to create', data.error ?? 'An error occurred.');
        return;
      }
      success(
        isEdit ? 'Office updated' : 'Office created',
        isEdit
          ? `${form.name} has been updated.`
          : `${form.name} has been added.`,
      );
      onSaved();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Government Office' : 'Add Government Office'}
      size="md"
    >
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Office Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            placeholder="e.g. BIR, SEC, DTI"
            maxLength={20}
          />
          <p className="mt-1 text-xs text-muted-foreground">Short unique identifier (auto-uppercased)</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Office Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Bureau of Internal Revenue"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
          <textarea
            className={`${inputClass} min-h-20 resize-none`}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isActive: true }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                form.isActive
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-background border-border text-muted-foreground hover:border-green-500 hover:text-green-600'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isActive: false }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                !form.isActive
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-background border-border text-muted-foreground hover:border-red-500 hover:text-red-600'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => { void handleSave(); }} disabled={saving} className="gap-2">
            <Save size={14} />
            {isEdit ? 'Update Office' : 'Add Office'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
