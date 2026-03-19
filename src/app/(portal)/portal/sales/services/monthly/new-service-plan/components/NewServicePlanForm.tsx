// src/app/(portal)/portal/sales/services/monthly/new-service-plan/components/NewServicePlanForm.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  CalendarClock,
  Plus,
  Save,
  Search,
  X,
  Layout,
} from 'lucide-react';

interface RefItem {
  id: number;
  name: string;
  code?: string;
  province?: string | null;
  category?: string | null;
}

function SearchableMultiSelect({
  label,
  items,
  selectedIds,
  onToggle,
  getLabel,
  getSubLabel,
  placeholder,
}: {
  label: string;
  items: RefItem[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  getLabel: (item: RefItem) => string;
  getSubLabel?: (item: RefItem) => string | undefined;
  placeholder: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () =>
      items.filter((i) =>
        getLabel(i).toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search, getLabel],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
        {selectedIds.length > 0 && (
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
            {selectedIds.length} selected
          </span>
        )}
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-2 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-44 overflow-y-auto divide-y divide-slate-50">
          {filtered.length === 0 && (
            <p className="p-3 text-xs text-slate-400 text-center">
              {items.length === 0 ? 'No options available' : 'No matches'}
            </p>
          )}
          {filtered.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-400"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{getLabel(item)}</p>
                  {getSubLabel && getSubLabel(item) && (
                    <p className="text-[10px] text-slate-400">{getSubLabel(item)}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InclusionTagInput({
  inclusions,
  selectedIds,
  onAdd,
  onRemove,
  onCreateNew,
}: {
  inclusions: RefItem[];
  selectedIds: number[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  onCreateNew?: (name: string) => Promise<void>;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filtered = useMemo(
    () =>
      inclusions.filter(
        (i) =>
          i.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedIds.includes(i.id),
      ),
    [inclusions, inputValue, selectedIds],
  );

  const handleSelect = (id: number) => {
    onAdd(id);
    setInputValue('');
    setShowDropdown(false);
  };

  const handleCreateNew = async () => {
    if (!inputValue.trim() || !onCreateNew || isCreating) return;
    setIsCreating(true);
    await onCreateNew(inputValue.trim());
    setInputValue('');
    setShowDropdown(false);
    setIsCreating(false);
  };

  const selectedItems = inclusions.filter((i) => selectedIds.includes(i.id));
  const hasInput = inputValue.trim().length > 0;
  const exactMatch = inclusions.some((i) => i.name.toLowerCase() === inputValue.toLowerCase());

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Plan Inclusions
        </label>
        {selectedIds.length > 0 && (
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
            {selectedIds.length} added
          </span>
        )}
      </div>

      <div className="relative">
        <input
          className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Search inclusions..."
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0) handleSelect(filtered[0].id);
              else if (hasInput && onCreateNew && !exactMatch) void handleCreateNew();
            }
          }}
        />
        {showDropdown && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-50">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-purple-50 text-slate-800 transition-colors flex items-center gap-2"
                    onMouseDown={() => handleSelect(item.id)}
                  >
                    <Plus size={11} className="text-purple-400 shrink-0" />
                    <span>
                      <span className="font-semibold">{item.name}</span>
                      {item.category && (
                        <span className="text-slate-400 ml-1">· {item.category}</span>
                      )}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-xs text-slate-400 text-center">
                  {hasInput ? 'No matching inclusions' : 'All inclusions have been added'}
                </p>
              )}
            </div>
            {onCreateNew && hasInput && !exactMatch && (
              <div className="border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  onMouseDown={handleCreateNew}
                  disabled={isCreating}
                >
                  <Plus size={11} className="shrink-0" />
                  {isCreating ? 'Adding...' : `Add "${inputValue}" as new inclusion`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800"
            >
              {item.name}
              <button type="button" onClick={() => onRemove(item.id)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const INITIAL_FORM = {
  name: '',
  description: '',
  recurring: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
  serviceRate: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
  governmentOfficeIds: [] as number[],
  cityIds: [] as number[],
  inclusionIds: [] as number[],
  taskTemplateSearch: '',
};

export function NewServicePlanForm(): React.ReactNode {
  const router = useRouter();
  const { success, error } = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference data
  const [govOffices, setGovOffices] = useState<RefItem[]>([]);
  const [cities, setCities] = useState<RefItem[]>([]);
  const [inclusions, setInclusions] = useState<RefItem[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/sales/government-offices').then((r) => r.json()),
      fetch('/api/sales/cities').then((r) => r.json()),
      fetch('/api/sales/service-inclusions').then((r) => r.json()),
    ])
      .then(([gov, cty, inc]) => {
        setGovOffices(gov.data ?? []);
        setCities(cty.data ?? []);
        setInclusions(inc.data ?? []);
      })
      .catch(() => {
        error('Failed to load reference data', 'Some dropdowns may be unavailable.');
      })
      .finally(() => setIsLoadingRefs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleId = (key: 'governmentOfficeIds' | 'cityIds' | 'inclusionIds', id: number) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter((v) => v !== id)
        : [...prev[key], id],
    }));
  };

  const handleCreateInclusion = async (name: string) => {
    try {
      const res = await fetch('/api/sales/service-inclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        error('Failed to create inclusion', (data as { error?: string }).error ?? 'An error occurred.');
        return;
      }
      const newItem = data.data as RefItem;
      setInclusions((prev) => [...prev, newItem]);
      setForm((prev) => ({ ...prev, inclusionIds: [...prev.inclusionIds, newItem.id] }));
      success('Inclusion added', `"${name}" was created and added.`);
    } catch {
      error('Failed to create inclusion', 'An unexpected error occurred.');
    }
  };

  const isValid = form.name.trim() !== '' && form.serviceRate !== '' && Number(form.serviceRate) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sales/service-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          recurring: form.recurring,
          serviceRate: parseFloat(form.serviceRate),
          status: form.status,
          governmentOfficeIds: form.governmentOfficeIds,
          cityIds: form.cityIds,
          inclusionIds: form.inclusionIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        error('Failed to create plan', data.error ?? 'An error occurred.');
        return;
      }

      success('Service plan created', `"${data.data.name}" was saved successfully.`);
      router.push('/portal/sales/services/monthly');
    } catch {
      error('Failed to create plan', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Page Header */}
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
            <h2 className="text-xl font-black text-slate-900 tracking-tight">New Service Plan</h2>
            <p className="text-xs text-slate-500">Create a recurring monthly service package</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Details</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
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
              <label className="text-xs font-bold text-slate-700">Recurring</label>
              <select
                value={form.recurring}
                onChange={(e) =>
                  setForm({ ...form, recurring: e.target.value as typeof form.recurring })
                }
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="DAILY">Daily</option>
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
          </div>

          {/* Reference Data */}
          {isLoadingRefs ? (
            <div className="text-xs text-slate-400 text-center py-4">Loading options...</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SearchableMultiSelect
                  label="Government Offices"
                  items={govOffices}
                  selectedIds={form.governmentOfficeIds}
                  onToggle={(id) => toggleId('governmentOfficeIds', id)}
                  getLabel={(item) => item.name}
                  getSubLabel={(item) => item.code}
                  placeholder="Search offices..."
                />

                <SearchableMultiSelect
                  label="Cities / Coverage"
                  items={cities}
                  selectedIds={form.cityIds}
                  onToggle={(id) => toggleId('cityIds', id)}
                  getLabel={(item) => item.name}
                  getSubLabel={(item) => item.province ?? undefined}
                  placeholder="Search cities..."
                />
              </div>

              <InclusionTagInput
                inclusions={inclusions}
                selectedIds={form.inclusionIds}
                onAdd={(id) => toggleId('inclusionIds', id)}
                onRemove={(id) => toggleId('inclusionIds', id)}
                onCreateNew={handleCreateInclusion}
              />
            </div>
          )}

          {/* Task Template Picker (UI-only — API coming soon) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Task Template
              </label>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                    placeholder="Search task templates..."
                    value={form.taskTemplateSearch}
                    onChange={(e) => setForm({ ...form, taskTemplateSearch: e.target.value })}
                    disabled
                  />
                </div>
              </div>
              <div className="p-6 text-center">
                <Layout size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-400">No task templates yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Task template management will be available in a future update.
                </p>
              </div>
            </div>
          </div>

          {/* Selected Summary Chips */}
          {(form.governmentOfficeIds.length > 0 || form.cityIds.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Selection Summary
              </p>
              {form.governmentOfficeIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.governmentOfficeIds.map((id) => {
                    const item = govOffices.find((g) => g.id === id);
                    return item ? (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800"
                      >
                        {item.code ?? item.name}
                        <button type="button" onClick={() => toggleId('governmentOfficeIds', id)}>
                          <X size={10} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              {form.cityIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.cityIds.map((id) => {
                    const item = cities.find((c) => c.id === id);
                    return item ? (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800"
                      >
                        {item.name}
                        <button type="button" onClick={() => toggleId('cityIds', id)}>
                          <X size={10} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
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
            {isSubmitting ? 'Saving...' : 'Save Plan'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
