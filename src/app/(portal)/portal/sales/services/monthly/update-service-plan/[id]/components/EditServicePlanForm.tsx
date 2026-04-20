// src/app/(portal)/portal/sales/services/monthly/update-service-plan/[id]/components/EditServicePlanForm.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import { CreateTaskTemplateModal } from '@/components/task-management/CreateTaskTemplateModal';
import type { ApiTemplate } from '@/components/task-management/CreateTaskTemplateModal';
import { ArrowLeft, CalendarClock, Layout, Plus, Save, X } from 'lucide-react';

interface ServicePlanDetail {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY' | 'NONE';
  serviceRate: string;
  isVatable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  complianceType: 'NONE' | 'EWT' | 'COMPENSATION' | 'PERCENTAGE' | 'VAT' | 'INCOME_TAX' | 'SSS' | 'PHILHEALTH' | 'PAGIBIG' | 'LGU_RENEWAL';
  taskTemplates: { taskTemplate: { id: number; name: string; description: string | null } }[];
}

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
                    {t.description && (
                      <span className="text-slate-400">{t.description}</span>
                    )}
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-xs text-slate-400 text-center">
                  {inputValue.trim() ? 'No matching templates' : templates.length === 0 ? 'No task templates. Create one in Task Workflow settings.' : 'All templates have been linked'}
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

interface FormState {
  code: string;
  name: string;
  description: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  serviceRate: string;
  isVatable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  complianceType: 'NONE' | 'EWT' | 'COMPENSATION' | 'PERCENTAGE' | 'VAT' | 'INCOME_TAX' | 'SSS' | 'PHILHEALTH' | 'PAGIBIG' | 'LGU_RENEWAL';
  taskTemplateIds: number[];
}

interface EditServicePlanFormProps {
  planId: number;
}

export function EditServicePlanForm({ planId }: EditServicePlanFormProps): React.ReactNode {
  const router = useRouter();
  const { success, error } = useToast();

  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    frequency: 'MONTHLY',
    serviceRate: '',
    isVatable: false,
    status: 'ACTIVE',
    complianceType: 'NONE',
    taskTemplateIds: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplateOption[]>([]);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sales/services/${planId}`).then((r) => r.json()),
      fetch('/api/sales/task-templates').then((r) => r.json()),
    ])
      .then(([planRes, tmpl]) => {
        const plan: ServicePlanDetail = planRes.data;
        setForm({
          code: plan.code ?? '',
          name: plan.name,
          description: plan.description ?? '',
          frequency: (plan.frequency === 'NONE' ? 'MONTHLY' : plan.frequency) as FormState['frequency'],
          serviceRate: String(parseFloat(plan.serviceRate)),
          isVatable: plan.isVatable,
          status: plan.status,
          complianceType: plan.complianceType ?? 'NONE',
          taskTemplateIds: plan.taskTemplates.map((t) => t.taskTemplate.id),
        });
        setTaskTemplates(tmpl.data ?? []);
      })
      .catch(() => {
        error('Failed to load plan', 'Could not fetch service plan details.');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleTemplateCreated = (t: ApiTemplate) => {
    setTaskTemplates((prev) => [...prev, { id: t.id, name: t.name, description: t.description ?? null }]);
    setForm((prev) => ({ ...prev, taskTemplateIds: [...prev.taskTemplateIds, t.id] }));
    setShowNewTemplateModal(false);
  };

  const isValid = form.name.trim() !== '' && form.serviceRate !== '' && Number(form.serviceRate) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/sales/services/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim() || undefined,
          name: form.name.trim(),
          description: form.description.trim() || null,
          frequency: form.frequency,
          serviceRate: parseFloat(form.serviceRate),
          isVatable: form.isVatable,
          status: form.status,
          complianceType: form.complianceType,
          taskTemplateIds: form.taskTemplateIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        error('Failed to update plan', data.error ?? 'An error occurred.');
        return;
      }

      success('Service plan updated', `"${data.data.name}" was updated successfully.`);
      router.push('/portal/sales/services/monthly');
    } catch {
      error('Failed to update plan', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-[3px] border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading service plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/portal/sales/services/monthly')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
            <CalendarClock size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Service Plan</h2>
            <p className="text-xs text-slate-500">Update recurring monthly service package</p>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Details</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Service Code <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SVC-001"
                className="bg-white border-slate-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Plan Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Agila Starter Plan"
                className="bg-white border-slate-200"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what this plan covers..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Billing Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as typeof form.frequency })}
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="SEMI_ANNUALLY">Semi-Annually</option>
                <option value="ANNUALLY">Annually</option>
                <option value="WEEKLY">Weekly</option>
                <option value="DAILY">Daily</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Compliance Type</label>
              <select
                value={form.complianceType}
                onChange={(e) => setForm({ ...form, complianceType: e.target.value as typeof form.complianceType })}
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="NONE">None (No Compliance)</option>
                <option value="EWT">EWT - Expanded Withholding Tax</option>
                <option value="COMPENSATION">Compensation (1601-C)</option>
                <option value="PERCENTAGE">Percentage Tax (2551Q)</option>
                <option value="VAT">VAT (2550M / 2550Q)</option>
                <option value="INCOME_TAX">Income Tax (1701 / 1702)</option>
                <option value="SSS">SSS - Social Security System</option>
                <option value="PHILHEALTH">PhilHealth</option>
                <option value="PAGIBIG">Pag-IBIG</option>
                <option value="LGU_RENEWAL">LGU / Mayor&apos;s Permit Renewal</option>
              </select>
            </div>

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

            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="isVatable"
                checked={form.isVatable}
                onChange={(e) => setForm({ ...form, isVatable: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400"
              />
              <label htmlFor="isVatable" className="text-sm text-slate-700 cursor-pointer">
                Subject to VAT (12%)
              </label>
            </div>
          </div>

          {/* Task Templates */}
          <TaskTemplateTagInput
            templates={taskTemplates}
            selectedIds={form.taskTemplateIds}
            onAdd={(id) => setForm((prev) => ({ ...prev, taskTemplateIds: [...prev.taskTemplateIds, id] }))}
            onRemove={(id) => setForm((prev) => ({ ...prev, taskTemplateIds: prev.taskTemplateIds.filter((v) => v !== id) }))}
            onNewTemplate={() => setShowNewTemplateModal(true)}
          />
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/portal/sales/services/monthly')}
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {showNewTemplateModal && (
        <CreateTaskTemplateModal
          onClose={() => setShowNewTemplateModal(false)}
          onCreated={handleTemplateCreated}
        />
      )}
    </div>
  );
}
