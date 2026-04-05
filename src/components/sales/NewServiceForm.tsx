// src/components/sales/NewServiceForm.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import { CreateTaskTemplateModal } from '@/components/task-management/CreateTaskTemplateModal';
import type { ApiTemplate } from '@/components/task-management/CreateTaskTemplateModal';
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Plus,
  Save,
  Layout,
  X,
} from 'lucide-react';

interface TaskTemplateOption {
  id: number;
  name: string;
  description: string | null;
}

function TaskTemplateTagInput({
  templates,
  selectedIds,
  onAdd,
  onRemove,
  onNewTemplate,
}: {
  templates: TaskTemplateOption[];
  selectedIds: number[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  onNewTemplate: () => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedIds.includes(t.id),
      ),
    [templates, inputValue, selectedIds],
  );

  const handleSelect = (id: number) => {
    onAdd(id);
    setInputValue('');
    setShowDropdown(false);
  };

  const selectedItems = templates.filter((t) => selectedIds.includes(t.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Task Templates
        </label>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {selectedIds.length} linked
            </span>
          )}
          <button
            type="button"
            onClick={onNewTemplate}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
          >
            <Plus size={10} />
            New Template
          </button>
        </div>
      </div>
      <div className="relative">
        <input
          className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Search task templates..."
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0) handleSelect(filtered[0].id);
            }
          }}
        />
        {showDropdown && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-50">
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-purple-50 text-slate-800 transition-colors"
                    onMouseDown={() => handleSelect(t.id)}
                  >
                    <span className="font-semibold block">{t.name}</span>
                    {t.description && <span className="text-slate-400">{t.description}</span>}
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-xs text-slate-400 text-center">
                  {inputValue.trim()
                    ? 'No matching templates'
                    : templates.length === 0
                    ? 'No task templates available.'
                    : 'All templates have been linked'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedItems.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800"
            >
              <Layout size={10} />
              {t.name}
              <button type="button" onClick={() => onRemove(t.id)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type BillingType = 'RECURRING' | 'ONE_TIME';

const FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUALLY', label: 'Semi-Annually' },
  { value: 'ANNUALLY', label: 'Annually' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'DAILY', label: 'Daily' },
] as const;

const INITIAL_FORM = {
  code: '',
  name: '',
  description: '',
  frequency: 'MONTHLY' as typeof FREQUENCY_OPTIONS[number]['value'],
  serviceRate: '',
  isVatable: false,
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
  taskTemplateIds: [] as number[],
};


interface NewServiceFormProps {
  billingType: BillingType;
}

export function NewServiceForm({ billingType }: NewServiceFormProps): React.ReactNode {
  const router = useRouter();
  const { success, error } = useToast();

  const backPath =
    billingType === 'RECURRING'
      ? '/portal/sales/services/monthly'
      : '/portal/sales/services/one-time';

  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskTemplates, setTaskTemplates] = useState<TaskTemplateOption[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

  useEffect(() => {
    fetch('/api/sales/task-templates')
      .then((r) => r.json())
      .then((tmpl) => {
        setTaskTemplates(tmpl.data ?? []);
      })
      .catch(() => {
        error('Failed to load reference data', 'Some dropdowns may be unavailable.');
      })
      .finally(() => setIsLoadingRefs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTemplateCreated = (t: ApiTemplate) => {
    setTaskTemplates((prev) => [...prev, { id: t.id, name: t.name, description: t.description }]);
    setForm((prev) => ({ ...prev, taskTemplateIds: [...prev.taskTemplateIds, t.id] }));
    setShowNewTemplateModal(false);
  };

  const isValid = form.code.trim() !== '' && form.name.trim() !== '' && form.serviceRate !== '' && Number(form.serviceRate) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sales/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          billingType,
          frequency: billingType === 'ONE_TIME' ? 'NONE' : form.frequency,
          serviceRate: parseFloat(form.serviceRate),
          isVatable: form.isVatable,
          status: form.status,
          taskTemplateIds: form.taskTemplateIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        error('Failed to create service', (data as { error?: string }).error ?? 'An error occurred.');
        return;
      }

      success(
        'Service created',
        `"${(data as { data: { name: string } }).data.name}" was saved successfully.`,
      );
      router.push(backPath);
    } catch {
      error('Failed to create service', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRecurring = billingType === 'RECURRING';
  const accentColor = isRecurring ? 'purple' : 'blue';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(backPath)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 bg-${accentColor}-100 text-${accentColor}-600 rounded-xl`}>
            {isRecurring ? <CalendarClock size={22} /> : <FileText size={22} />}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isRecurring ? 'New Recurring Service' : 'New One-Time Service'}
            </h2>
            <p className="text-xs text-slate-500">
              {isRecurring
                ? 'Create a recurring subscription service'
                : 'Create a one-time engagement service'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Service Details</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Service Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Service Code <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. TAX-EWT-MO"
                className="bg-white border-slate-200 font-mono"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Service Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Service Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={isRecurring ? 'e.g. Monthly Tax Compliance' : 'e.g. BIR Registration'}
                className="bg-white border-slate-200"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what this service covers..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

            {/* Service Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Service Rate (PHP) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.serviceRate}
                onChange={(e) => setForm({ ...form, serviceRate: e.target.value })}
                placeholder="0.00"
                className="bg-white border-slate-200"
              />
            </div>

            {/* Frequency — only for RECURRING */}
            {isRecurring && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Billing Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({ ...form, frequency: e.target.value as typeof form.frequency })
                  }
                  className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* VAT Checkbox */}
            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <input
                id="isVatable"
                type="checkbox"
                checked={form.isVatable}
                onChange={(e) => setForm({ ...form, isVatable: e.target.checked })}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-400"
              />
              <label htmlFor="isVatable" className="text-sm font-medium text-slate-700 cursor-pointer">
                Subject to VAT (12%)
              </label>
            </div>
          </div>

          {/* Reference Data */}
          {isLoadingRefs ? (
            <div className="text-xs text-slate-400 text-center py-4">Loading options...</div>
          ) : (
            <TaskTemplateTagInput
              templates={taskTemplates}
              selectedIds={form.taskTemplateIds}
              onAdd={(id) =>
                setForm((prev) => ({ ...prev, taskTemplateIds: [...prev.taskTemplateIds, id] }))
              }
              onRemove={(id) =>
                setForm((prev) => ({
                  ...prev,
                  taskTemplateIds: prev.taskTemplateIds.filter((v) => v !== id),
                }))
              }
              onNewTemplate={() => setShowNewTemplateModal(true)}
            />
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(backPath)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            <Save size={14} className="mr-1.5" />
            {isSubmitting ? 'Saving...' : 'Save Service'}
          </Button>
        </div>
      </Card>

      {showNewTemplateModal && (
        <CreateTaskTemplateModal
          onCreated={handleTemplateCreated}
          onClose={() => setShowNewTemplateModal(false)}
        />
      )}
    </div>
  );
}
