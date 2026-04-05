// src/app/(portal)/portal/sales/services/one-time/update-service/[id]/components/EditOneTimeServiceForm.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import { CreateTaskTemplateModal } from '@/components/task-management/CreateTaskTemplateModal';
import type { ApiTemplate } from '@/components/task-management/CreateTaskTemplateModal';
import { ArrowLeft, FileText, Layout, Plus, Save, X } from 'lucide-react';

interface ServiceOneTimeDetail {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  serviceRate: string;
  isVatable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
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
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
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
          className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 text-slate-800 transition-colors"
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800"
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
  serviceRate: string;
  isVatable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  taskTemplateIds: number[];
}

export function EditOneTimeServiceForm({ serviceId }: { serviceId: number }): React.ReactNode {
  const router = useRouter();
  const { success, error } = useToast();

  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    serviceRate: '',
    isVatable: false,
    status: 'ACTIVE',
    taskTemplateIds: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplateOption[]>([]);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sales/services/${serviceId}`).then((r) => r.json()),
      fetch('/api/sales/task-templates').then((r) => r.json()),
    ])
      .then(([svcData, tmplData]) => {
        const svc = (svcData as { data?: ServiceOneTimeDetail }).data;
        if (!svc) {
          error('Service not found', 'The requested service could not be loaded.');
          router.push('/portal/sales/services/one-time');
          return;
        }
        setForm({
          code: svc.code ?? '',
          name: svc.name,
          description: svc.description ?? '',
          serviceRate: String(parseFloat(svc.serviceRate)),
          isVatable: svc.isVatable,
          status: svc.status,
          taskTemplateIds: svc.taskTemplates.map((t) => t.taskTemplate.id),
        });
        setTaskTemplates((tmplData as { data?: TaskTemplateOption[] }).data ?? []);
      })
      .catch(() => {
        error('Failed to load data', 'Could not load service details.');
      })
      .finally(() => setIsLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

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
      const res = await fetch(`/api/sales/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim() || undefined,
          name: form.name.trim(),
          description: form.description.trim() || null,
          serviceRate: parseFloat(form.serviceRate),
          isVatable: form.isVatable,
          status: form.status,
          taskTemplateIds: form.taskTemplateIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        error('Failed to update service', (data as { error?: string }).error ?? 'An error occurred.');
        return;
      }
      success('Service updated', `"${(data.data as { name: string }).name}" was saved successfully.`);
      router.push('/portal/sales/services/one-time');
    } catch {
      error('Failed to update service', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/portal/sales/services/one-time')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit One-Time Service</h2>
            <p className="text-xs text-slate-500">Update the details for this service</p>
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Service Code <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. OT-001"
                className="bg-white border-slate-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Service Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. BIR Registration Assistance"
                className="bg-white border-slate-200"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what this service covers..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
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
              <label className="text-xs font-bold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
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

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/portal/sales/services/one-time')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
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

