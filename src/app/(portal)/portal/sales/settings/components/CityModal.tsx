// src/app/(portal)/portal/sales/settings/components/CityModal.tsx
'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

export interface CityRecord {
  id: number;
  name: string;
  province: string | null;
  region: string | null;
  zipCode: string | null;
  isActive: boolean;
}

interface CityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  city: CityRecord | null; // null = add mode
}

interface FormState {
  name: string;
  province: string;
  region: string;
  zipCode: string;
  isActive: boolean;
}

const DEFAULT_FORM: FormState = { name: '', province: '', region: '', zipCode: '', isActive: true };

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

export function CityModal({
  isOpen, onClose, onSaved, city,
}: CityModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  // Adjust state during render
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setForm(
        city
          ? {
              name: city.name,
              province: city.province ?? '',
              region: city.region ?? '',
              zipCode: city.zipCode ?? '',
              isActive: city.isActive,
            }
          : DEFAULT_FORM,
      );
    }
  }

  const set = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isEdit = city !== null;

  const handleSave = async () => {
    if (!form.name.trim()) { error('Validation', 'City name is required.'); return; }

    setSaving(true);
    try {
      const url = isEdit ? `/api/sales/cities/${city.id}` : '/api/sales/cities';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          province: form.province.trim() || null,
          region: form.region.trim() || null,
          zipCode: form.zipCode.trim() || null,
          isActive: form.isActive,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error(isEdit ? 'Failed to update' : 'Failed to create', data.error ?? 'An error occurred.');
        return;
      }
      success(
        isEdit ? 'City updated' : 'City added',
        isEdit ? `${form.name} has been updated.` : `${form.name} has been added.`,
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
      title={isEdit ? 'Edit City' : 'Add City'}
      size="md"
    >
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            City / Municipality Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Cebu City"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Province</label>
            <input
              type="text"
              className={inputClass}
              value={form.province}
              onChange={(e) => set('province', e.target.value)}
              placeholder="e.g. Cebu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Region</label>
            <input
              type="text"
              className={inputClass}
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              placeholder="e.g. Central Visayas"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">ZIP Code</label>
            <input
              type="text"
              className={inputClass}
              value={form.zipCode}
              onChange={(e) => set('zipCode', e.target.value)}
              placeholder="e.g. 6000"
              maxLength={10}
            />
          </div>
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
            {isEdit ? 'Update City' : 'Add City'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
