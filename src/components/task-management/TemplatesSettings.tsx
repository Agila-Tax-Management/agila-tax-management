// src/components/task-management/TemplatesSettings.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, FileText, Clock, Users, ChevronRight,
  Pencil, Trash2, Search, Briefcase, Copy,
  X, Check, AlertTriangle, Loader2,
  ArrowUp, ArrowDown, ListChecks, ChevronDown, ChevronUp, Minus,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';

// ── Types ────────────────────────────────────────────────────────────

type TPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface ApiSubtask {
  id:           number;
  routeId:      number;
  name:         string;
  description:  string | null;
  subtaskOrder: number;
  priority:     TPriority;
  daysDue:      number | null;
}

interface ApiRoute {
  id:           number;
  templateId:   number;
  departmentId: number;
  routeOrder:   number;
  daysDue:      number | null;
  department:   { id: number; name: string };
  subtasks:     ApiSubtask[];
}

interface ApiLinkedPlan {
  id:          number;
  name:        string;
  serviceRate: string;
  recurring:   string;
  status:      string;
}

interface ApiLinkedOneTime {
  id:          number;
  name:        string;
  serviceRate: string;
  status:      string;
}

interface ApiAvailablePlan extends ApiLinkedPlan {
  taskTemplateId:      number | null;
  linkedToThisTemplate: boolean;
}

interface ApiAvailableOneTime extends ApiLinkedOneTime {
  taskTemplateId:      number | null;
  linkedToThisTemplate: boolean;
}

interface ApiTemplate {
  id:                  number;
  name:                string;
  description:         string | null;
  daysDue:             number | null;
  createdAt:           string;
  updatedAt:           string;
  departmentRoutes:    ApiRoute[];
  servicePlans:        ApiLinkedPlan[];
  serviceOneTimePlans: ApiLinkedOneTime[];
}

// ── Constants ─────────────────────────────────────────────────────

const PRIORITIES: TPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const PRIORITY_LABEL: Record<TPriority, string> = {
  LOW: 'Low', NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent',
};

const PRIORITY_COLOR: Record<TPriority, string> = {
  LOW:    'bg-slate-100 text-slate-600',
  NORMAL: 'bg-blue-100  text-blue-700',
  HIGH:   'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100   text-red-700',
};

const BASE = '/api/admin/settings/task-workflow/templates';

// ── Delete Confirm Modal ──────────────────────────────────────────

function DeleteModal({
  name, onConfirm, onClose, loading,
}: {
  name: string; onConfirm: () => void; onClose: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Delete Template</h3>
            <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-700">
          Delete <span className="font-bold">&ldquo;{name}&rdquo;</span>?
        </p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Template Modal ─────────────────────────────────────────

function CreateTemplateModal({ onCreated, onClose }: {
  onCreated: (t: ApiTemplate) => void;
  onClose: () => void;
}) {
  const { success, error } = useToast();
  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [daysDue, setDaysDue]     = useState('');
  const [saving, setSaving]       = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          daysDue: daysDue ? parseInt(daysDue, 10) : undefined,
        }),
      });
      const data = await res.json() as { data?: ApiTemplate; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not create template'); return; }
      success('Created', `"${name.trim()}" template has been created.`);
      onCreated(data.data!);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-black text-slate-900 text-base">New Template</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Template Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. BIR Registration Pipeline"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="What workflow does this template define?"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Total Days Due</label>
            <input
              type="number"
              min={1}
              value={daysDue}
              onChange={e => setDaysDue(e.target.value)}
              placeholder="e.g. 30"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            className="px-5 py-2 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors disabled:opacity-40 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Template Modal ───────────────────────────────────────────

interface AddSubtaskForm {
  name: string; description: string; priority: TPriority; daysDue: string;
  open: boolean; saving: boolean;
}

function EditTemplateModal({
  template: initialTemplate,
  allDepartments,
  onClose,
  onUpdated,
}: {
  template: ApiTemplate;
  allDepartments: { id: number; name: string }[];
  onClose: () => void;
  onUpdated: (t: ApiTemplate) => void;
}) {
  const { success, error } = useToast();
  const [tpl, setTpl] = useState<ApiTemplate>(initialTemplate);

  // Details form
  const [detailsName, setDetailsName]       = useState(initialTemplate.name);
  const [detailsDesc, setDetailsDesc]       = useState(initialTemplate.description ?? '');
  const [detailsDaysDue, setDetailsDaysDue] = useState(initialTemplate.daysDue?.toString() ?? '');
  const [detailsSaving, setDetailsSaving]   = useState(false);

  // Route management
  const [expandedRouteId, setExpandedRouteId]         = useState<number | null>(null);
  const [confirmRemoveRouteId, setConfirmRemoveRouteId] = useState<number | null>(null);

  // Add step form
  const [addStepDeptId, setAddStepDeptId]   = useState('');
  const [addStepDaysDue, setAddStepDaysDue] = useState('');
  const [addingStep, setAddingStep]         = useState(false);

  // Subtask inline edit
  const [editingSubtask, setEditingSubtask] = useState<{
    routeId: number; subtaskId: number;
    name: string; description: string; priority: TPriority; daysDue: string; saving: boolean;
  } | null>(null);
  const [confirmDeleteSubtask, setConfirmDeleteSubtask] = useState<{
    routeId: number; subtaskId: number;
  } | null>(null);

  // Add subtask forms (per route)
  const [addSubtaskForms, setAddSubtaskForms] = useState<Record<number, AddSubtaskForm>>({});

  // Services
  const [availPlans, setAvailPlans]         = useState<ApiAvailablePlan[]>([]);
  const [availOneTime, setAvailOneTime]     = useState<ApiAvailableOneTime[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [linkingService, setLinkingService] = useState(false);
  const [serviceSearch, setServiceSearch]   = useState('');
  const [serviceTypeTab, setServiceTypeTab] = useState<'plan' | 'oneTime'>('plan');
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [confirmUnlink, setConfirmUnlink]   = useState<{ type: 'plan' | 'oneTime'; id: number; name: string } | null>(null);

  const base         = `${BASE}/${tpl.id}`;
  const sortedRoutes = [...tpl.departmentRoutes].sort((a, b) => a.routeOrder - b.routeOrder);
  const usedDeptIds  = new Set(tpl.departmentRoutes.map(r => r.departmentId));
  const availDepts   = allDepartments.filter(d => !usedDeptIds.has(d.id));

  const syncUp = (updated: ApiTemplate) => {
    setTpl(updated);
    onUpdated(updated);
  };

  // Load available services when picker opens
  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const res = await fetch(`${base}/services`);
      const data = await res.json() as { data?: { plans: ApiAvailablePlan[]; oneTimePlans: ApiAvailableOneTime[] }; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not load services'); return; }
      setAvailPlans(data.data?.plans ?? []);
      setAvailOneTime(data.data?.oneTimePlans ?? []);
    } finally {
      setServicesLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  const openServicePicker = () => {
    setShowServicePicker(true);
    void loadServices();
  };

  const linkService = async (type: 'plan' | 'oneTime', serviceId: number) => {
    setLinkingService(true);
    try {
      const res = await fetch(`${base}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, serviceId }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not link service'); return; }
      // Update available list + template local state
      const svcName = type === 'plan'
        ? availPlans.find(p => p.id === serviceId)?.name ?? ''
        : availOneTime.find(p => p.id === serviceId)?.name ?? '';
      if (type === 'plan') {
        const plan = availPlans.find(p => p.id === serviceId);
        if (plan) {
          syncUp({ ...tpl, servicePlans: [...tpl.servicePlans, { id: plan.id, name: plan.name, serviceRate: plan.serviceRate, recurring: plan.recurring, status: plan.status }] });
          setAvailPlans(prev => prev.map(p => p.id === serviceId ? { ...p, linkedToThisTemplate: true, taskTemplateId: tpl.id } : p));
        }
      } else {
        const svc = availOneTime.find(p => p.id === serviceId);
        if (svc) {
          syncUp({ ...tpl, serviceOneTimePlans: [...tpl.serviceOneTimePlans, { id: svc.id, name: svc.name, serviceRate: svc.serviceRate, status: svc.status }] });
          setAvailOneTime(prev => prev.map(p => p.id === serviceId ? { ...p, linkedToThisTemplate: true, taskTemplateId: tpl.id } : p));
        }
      }
      success('Linked', `"${svcName}" linked to this template.`);
    } finally {
      setLinkingService(false);
    }
  };

  const unlinkService = async () => {
    if (!confirmUnlink) return;
    const { type, id: serviceId, name: svcName } = confirmUnlink;
    const res = await fetch(`${base}/services`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, serviceId }),
    });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      error('Failed', d.error ?? 'Could not unlink');
      setConfirmUnlink(null);
      return;
    }
    if (type === 'plan') {
      syncUp({ ...tpl, servicePlans: tpl.servicePlans.filter(p => p.id !== serviceId) });
      setAvailPlans(prev => prev.map(p => p.id === serviceId ? { ...p, linkedToThisTemplate: false, taskTemplateId: null } : p));
    } else {
      syncUp({ ...tpl, serviceOneTimePlans: tpl.serviceOneTimePlans.filter(p => p.id !== serviceId) });
      setAvailOneTime(prev => prev.map(p => p.id === serviceId ? { ...p, linkedToThisTemplate: false, taskTemplateId: null } : p));
    }
    success('Unlinked', `"${svcName}" unlinked from this template.`);
    setConfirmUnlink(null);
  };

  // ── Save details ──────────────────────────────────────────────

  const saveDetails = async () => {
    if (!detailsName.trim()) return;
    setDetailsSaving(true);
    try {
      const res = await fetch(base, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: detailsName.trim(),
          description: detailsDesc.trim() || null,
          daysDue: detailsDaysDue ? parseInt(detailsDaysDue, 10) : null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error('Save failed', data.error ?? 'Could not save'); return; }
      syncUp({
        ...tpl,
        name: detailsName.trim(),
        description: detailsDesc.trim() || null,
        daysDue: detailsDaysDue ? parseInt(detailsDaysDue, 10) : null,
      });
      success('Saved', 'Template details updated.');
    } finally {
      setDetailsSaving(false);
    }
  };

  // ── Add step ─────────────────────────────────────────────────

  const addStep = async () => {
    if (!addStepDeptId) return;
    setAddingStep(true);
    try {
      const res = await fetch(`${base}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: parseInt(addStepDeptId, 10),
          daysDue: addStepDaysDue ? parseInt(addStepDaysDue, 10) : undefined,
        }),
      });
      const data = await res.json() as { data?: ApiRoute; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not add step'); return; }
      const newRoute: ApiRoute = { ...data.data!, subtasks: data.data!.subtasks ?? [] };
      syncUp({ ...tpl, departmentRoutes: [...tpl.departmentRoutes, newRoute] });
      setAddStepDeptId('');
      setAddStepDaysDue('');
      success('Step added', `"${newRoute.department.name}" added to route.`);
    } finally {
      setAddingStep(false);
    }
  };

  // ── Remove step ───────────────────────────────────────────────

  const removeStep = async (routeId: number) => {
    const route = tpl.departmentRoutes.find(r => r.id === routeId);
    if (!route) return;
    const res = await fetch(`${base}/routes/${routeId}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      error('Failed', d.error ?? 'Could not remove step');
      return;
    }
    const remaining = tpl.departmentRoutes
      .filter(r => r.id !== routeId)
      .sort((a, b) => a.routeOrder - b.routeOrder)
      .map((r, i) => ({ ...r, routeOrder: i + 1 }));
    syncUp({ ...tpl, departmentRoutes: remaining });
    if (expandedRouteId === routeId) setExpandedRouteId(null);
    setConfirmRemoveRouteId(null);
    success('Removed', `"${route.department.name}" removed from route.`);
  };

  // ── Move step ─────────────────────────────────────────────────

  const moveStep = (routeId: number, direction: 'up' | 'down') => {
    const sorted  = [...tpl.departmentRoutes].sort((a, b) => a.routeOrder - b.routeOrder);
    const idx     = sorted.findIndex(r => r.id === routeId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reordered = sorted.map((r, i) => ({ ...r, routeOrder: i + 1 }));
    syncUp({ ...tpl, departmentRoutes: reordered });
    // Background reorder call
    fetch(`${base}/routes/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: reordered.map(r => ({ routeId: r.id, routeOrder: r.routeOrder })) }),
    }).then(async res => {
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        error('Reorder failed', d.error ?? 'Could not reorder');
      }
    });
  };

  // ── Update route daysDue ──────────────────────────────────────

  const updateRouteDaysDue = async (routeId: number, val: string) => {
    const daysDue = val ? parseInt(val, 10) : null;
    const res = await fetch(`${base}/routes/${routeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daysDue }),
    });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      error('Failed', d.error ?? 'Could not update');
      return;
    }
    syncUp({
      ...tpl,
      departmentRoutes: tpl.departmentRoutes.map(r => r.id === routeId ? { ...r, daysDue } : r),
    });
  };

  // ── Add subtask ───────────────────────────────────────────────

  const openAddSubtask = (routeId: number) => {
    setAddSubtaskForms(prev => ({
      ...prev,
      [routeId]: prev[routeId]
        ? { ...prev[routeId], open: true }
        : { name: '', description: '', priority: 'NORMAL', daysDue: '', open: true, saving: false },
    }));
    setExpandedRouteId(routeId);
  };

  const saveAddSubtask = async (routeId: number) => {
    const form = addSubtaskForms[routeId];
    if (!form?.name.trim()) return;
    setAddSubtaskForms(prev => ({ ...prev, [routeId]: { ...prev[routeId], saving: true } }));
    try {
      const res = await fetch(`${base}/routes/${routeId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          daysDue: form.daysDue ? parseInt(form.daysDue, 10) : undefined,
        }),
      });
      const data = await res.json() as { data?: ApiSubtask; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not add subtask'); return; }
      syncUp({
        ...tpl,
        departmentRoutes: tpl.departmentRoutes.map(r =>
          r.id === routeId ? { ...r, subtasks: [...r.subtasks, data.data!] } : r,
        ),
      });
      setAddSubtaskForms(prev => ({
        ...prev,
        [routeId]: { name: '', description: '', priority: 'NORMAL', daysDue: '', open: true, saving: false },
      }));
      success('Added', `"${data.data!.name}" subtask added.`);
    } finally {
      setAddSubtaskForms(prev => ({ ...prev, [routeId]: { ...prev[routeId], saving: false } }));
    }
  };

  // ── Edit subtask ──────────────────────────────────────────────

  const startEdit = (routeId: number, s: ApiSubtask) => {
    setEditingSubtask({
      routeId, subtaskId: s.id,
      name: s.name, description: s.description ?? '',
      priority: s.priority, daysDue: s.daysDue?.toString() ?? '',
      saving: false,
    });
  };

  const saveEditSubtask = async () => {
    if (!editingSubtask?.name.trim()) return;
    const { routeId, subtaskId } = editingSubtask;
    setEditingSubtask(p => p ? { ...p, saving: true } : null);
    try {
      const res = await fetch(`${base}/routes/${routeId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingSubtask.name.trim(),
          description: editingSubtask.description.trim() || null,
          priority: editingSubtask.priority,
          daysDue: editingSubtask.daysDue ? parseInt(editingSubtask.daysDue, 10) : null,
        }),
      });
      const data = await res.json() as { data?: ApiSubtask; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not update'); return; }
      syncUp({
        ...tpl,
        departmentRoutes: tpl.departmentRoutes.map(r =>
          r.id === routeId
            ? { ...r, subtasks: r.subtasks.map(s => s.id === subtaskId ? data.data! : s) }
            : r,
        ),
      });
      setEditingSubtask(null);
      success('Updated', 'Subtask updated.');
    } finally {
      setEditingSubtask(p => p ? { ...p, saving: false } : null);
    }
  };

  // ── Delete subtask ────────────────────────────────────────────

  const deleteSubtask = async (routeId: number, subtaskId: number) => {
    const res = await fetch(`${base}/routes/${routeId}/subtasks/${subtaskId}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      error('Failed', d.error ?? 'Could not delete');
      return;
    }
    syncUp({
      ...tpl,
      departmentRoutes: tpl.departmentRoutes.map(r =>
        r.id === routeId
          ? { ...r, subtasks: r.subtasks.filter(s => s.id !== subtaskId).map((s, i) => ({ ...s, subtaskOrder: i + 1 })) }
          : r,
      ),
    });
    setConfirmDeleteSubtask(null);
    success('Deleted', 'Subtask removed.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-48px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-black text-slate-900 text-base">Edit Template</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              #{tpl.id} · {sortedRoutes.length} step{sortedRoutes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* ── Details ────────────────────────────────────────── */}
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Template Details</h3>
            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Name *</label>
                <input
                  value={detailsName}
                  onChange={e => setDetailsName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea
                  value={detailsDesc}
                  onChange={e => setDetailsDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Total Days Due</label>
                  <input
                    type="number"
                    min={1}
                    value={detailsDaysDue}
                    onChange={e => setDetailsDaysDue(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  onClick={saveDetails}
                  disabled={!detailsName.trim() || detailsSaving}
                  className="px-4 py-2 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors disabled:opacity-40 inline-flex items-center gap-2 shrink-0"
                >
                  {detailsSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Details
                </button>
              </div>
            </div>
          </section>

          {/* ── Route Builder ──────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department Route</h3>
              <span className="text-[11px] text-slate-400">{sortedRoutes.length} step{sortedRoutes.length !== 1 ? 's' : ''}</span>
            </div>

            {sortedRoutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Users size={24} className="text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No route steps yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add departments below to define the workflow order.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedRoutes.map((route, idx) => {
                  const isExpanded        = expandedRouteId === route.id;
                  const isConfirmRemove   = confirmRemoveRouteId === route.id;
                  const addForm           = addSubtaskForms[route.id];
                  const totalSubs         = route.subtasks.length;

                  return (
                    <div key={route.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      {/* Step row */}
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
                        <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-[11px] font-black flex items-center justify-center shrink-0">
                          {route.routeOrder}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm text-slate-800">{route.department.name}</span>
                        </div>

                        {/* Days due inline */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock size={11} className="text-slate-400" />
                          <input
                            type="number"
                            min={1}
                            defaultValue={route.daysDue ?? ''}
                            placeholder="days"
                            onBlur={e => {
                              const val = e.target.value;
                              const unchanged = (val === '' && route.daysDue === null) ||
                                (val !== '' && parseInt(val, 10) === route.daysDue);
                              if (!unchanged) updateRouteDaysDue(route.id, val);
                            }}
                            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <span className="text-[10px] text-slate-400">d</span>
                        </div>

                        {/* Subtasks toggle */}
                        <button
                          onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 text-[11px] font-bold transition-colors shrink-0"
                        >
                          <ListChecks size={12} /> {totalSubs}
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>

                        {/* Up / Down */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => moveStep(route.id, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => moveStep(route.id, 'down')}
                            disabled={idx === sortedRoutes.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>

                        {/* Remove (inline confirm) */}
                        {isConfirmRemove ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-red-600 font-bold">Remove?</span>
                            <button
                              onClick={() => removeStep(route.id)}
                              className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmRemoveRouteId(null)}
                              className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemoveRouteId(route.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          >
                            <Minus size={13} />
                          </button>
                        )}
                      </div>

                      {/* Expanded subtasks */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50 px-3 py-3 space-y-2">
                          {route.subtasks.length === 0 && !addForm?.open && (
                            <p className="text-[11px] text-slate-400 text-center py-1">No subtasks for this step yet.</p>
                          )}

                          {route.subtasks.map(sub => {
                            const isEditThis   = editingSubtask?.subtaskId === sub.id && editingSubtask?.routeId === route.id;
                            const isDelConfirm = confirmDeleteSubtask?.subtaskId === sub.id;

                            if (isEditThis && editingSubtask) {
                              return (
                                <div key={sub.id} className="bg-white border border-teal-200 rounded-lg p-3 space-y-2">
                                  <input
                                    value={editingSubtask.name}
                                    onChange={e => setEditingSubtask(p => p ? { ...p, name: e.target.value } : null)}
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  />
                                  <textarea
                                    value={editingSubtask.description}
                                    onChange={e => setEditingSubtask(p => p ? { ...p, description: e.target.value } : null)}
                                    rows={2}
                                    placeholder="Description (optional)"
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                                  />
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={editingSubtask.priority}
                                      onChange={e => setEditingSubtask(p => p ? { ...p, priority: e.target.value as TPriority } : null)}
                                      className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    >
                                      {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                                    </select>
                                    <input
                                      type="number"
                                      min={1}
                                      value={editingSubtask.daysDue}
                                      onChange={e => setEditingSubtask(p => p ? { ...p, daysDue: e.target.value } : null)}
                                      placeholder="Days due"
                                      className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                    <button
                                      onClick={saveEditSubtask}
                                      disabled={!editingSubtask.name.trim() || editingSubtask.saving}
                                      className="px-3 py-1.5 text-xs font-bold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-40 inline-flex items-center gap-1"
                                    >
                                      {editingSubtask.saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                                    </button>
                                    <button
                                      onClick={() => setEditingSubtask(null)}
                                      className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div key={sub.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLOR[sub.priority]}`}>
                                  {PRIORITY_LABEL[sub.priority]}
                                </span>
                                <span className="flex-1 text-xs text-slate-700 font-medium min-w-0 truncate">{sub.name}</span>
                                {sub.daysDue !== null && (
                                  <span className="text-[10px] text-slate-400 shrink-0">{sub.daysDue}d</span>
                                )}
                                {isDelConfirm ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-red-600 font-bold">Delete?</span>
                                    <button
                                      onClick={() => deleteSubtask(route.id, sub.id)}
                                      className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteSubtask(null)}
                                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      onClick={() => startEdit(route.id, sub)}
                                      className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteSubtask({ routeId: route.id, subtaskId: sub.id })}
                                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Add subtask form */}
                          {addForm?.open ? (
                            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                              <input
                                value={addForm.name}
                                onChange={e => setAddSubtaskForms(prev => ({ ...prev, [route.id]: { ...prev[route.id], name: e.target.value } }))}
                                placeholder="Subtask name *"
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                              <textarea
                                value={addForm.description}
                                onChange={e => setAddSubtaskForms(prev => ({ ...prev, [route.id]: { ...prev[route.id], description: e.target.value } }))}
                                rows={2}
                                placeholder="Description (optional)"
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                              />
                              <div className="flex items-center gap-2">
                                <select
                                  value={addForm.priority}
                                  onChange={e => setAddSubtaskForms(prev => ({ ...prev, [route.id]: { ...prev[route.id], priority: e.target.value as TPriority } }))}
                                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                  {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                                </select>
                                <input
                                  type="number"
                                  min={1}
                                  value={addForm.daysDue}
                                  onChange={e => setAddSubtaskForms(prev => ({ ...prev, [route.id]: { ...prev[route.id], daysDue: e.target.value } }))}
                                  placeholder="Days due"
                                  className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                <button
                                  onClick={() => saveAddSubtask(route.id)}
                                  disabled={!addForm.name.trim() || addForm.saving}
                                  className="px-3 py-1.5 text-xs font-bold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-40 inline-flex items-center gap-1"
                                >
                                  {addForm.saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Add
                                </button>
                                <button
                                  onClick={() => setAddSubtaskForms(prev => ({ ...prev, [route.id]: { ...prev[route.id], open: false } }))}
                                  className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAddSubtask(route.id)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-lg border border-dashed border-teal-200 transition-colors"
                            >
                              <Plus size={12} /> Add Subtask
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add step */}
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Add Department Step</p>
              {availDepts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">All departments are already in the route.</p>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={addStepDeptId}
                    onChange={e => setAddStepDeptId(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select department…</option>
                    {availDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={addStepDaysDue}
                    onChange={e => setAddStepDaysDue(e.target.value)}
                    placeholder="Days (opt.)"
                    className="w-24 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={addStep}
                    disabled={!addStepDeptId || addingStep}
                    className="px-4 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors disabled:opacity-40 inline-flex items-center gap-1.5 shrink-0"
                  >
                    {addingStep ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Add Step
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Linked Services ──────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Services</h3>
              <button
                onClick={openServicePicker}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
              >
                <Plus size={12} /> Link Service
              </button>
            </div>

            {/* Monthly Plans */}
            <div className="mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Monthly Plans</p>
              {tpl.servicePlans.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic px-1">No monthly plans linked.</p>
              ) : (
                <div className="space-y-1.5">
                  {tpl.servicePlans.map(plan => (
                    <div key={plan.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full shrink-0">
                        Monthly
                      </span>
                      <span className="flex-1 text-xs font-medium text-slate-700 min-w-0 truncate">{plan.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">₱{Number(plan.serviceRate).toLocaleString()}</span>
                      {confirmUnlink?.id === plan.id && confirmUnlink.type === 'plan' ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-red-600 font-bold">Unlink?</span>
                          <button onClick={unlinkService} className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded hover:bg-red-700">Yes</button>
                          <button onClick={() => setConfirmUnlink(null)} className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded hover:bg-slate-200">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmUnlink({ type: 'plan', id: plan.id, name: plan.name })}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* One-time Services */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">One-time Services</p>
              {tpl.serviceOneTimePlans.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic px-1">No one-time services linked.</p>
              ) : (
                <div className="space-y-1.5">
                  {tpl.serviceOneTimePlans.map(svc => (
                    <div key={svc.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full shrink-0">
                        One-time
                      </span>
                      <span className="flex-1 text-xs font-medium text-slate-700 min-w-0 truncate">{svc.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">₱{Number(svc.serviceRate).toLocaleString()}</span>
                      {confirmUnlink?.id === svc.id && confirmUnlink.type === 'oneTime' ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-red-600 font-bold">Unlink?</span>
                          <button onClick={unlinkService} className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded hover:bg-red-700">Yes</button>
                          <button onClick={() => setConfirmUnlink(null)} className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded hover:bg-slate-200">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmUnlink({ type: 'oneTime', id: svc.id, name: svc.name })}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Done
          </button>
        </div>

        {/* Service Picker Overlay */}
        {showServicePicker && (
          <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Link a Service</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Select a service to link to this template.</p>
              </div>
              <button onClick={() => setShowServicePicker(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pt-4 shrink-0 space-y-3">
              {/* Type tabs */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 w-fit">
                {([['plan', 'Monthly Plans'], ['oneTime', 'One-time Services']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setServiceTypeTab(val)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${serviceTypeTab === val ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  placeholder="Search services…"
                  className="w-full pl-8 pr-3 h-8 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-teal-600" />
                </div>
              ) : serviceTypeTab === 'plan' ? (
                availPlans
                  .filter(p => !serviceSearch || p.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                  .map(plan => (
                    <div key={plan.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{plan.name}</p>
                        <p className="text-[10px] text-slate-400">₱{Number(plan.serviceRate).toLocaleString()} · {plan.recurring}</p>
                      </div>
                      {plan.linkedToThisTemplate ? (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full shrink-0">Linked</span>
                      ) : plan.taskTemplateId !== null ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">Other</span>
                      ) : (
                        <button
                          onClick={() => void linkService('plan', plan.id)}
                          disabled={linkingService}
                          className="px-3 py-1 text-[10px] font-bold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-40 shrink-0"
                        >
                          {linkingService ? <Loader2 size={10} className="animate-spin" /> : 'Link'}
                        </button>
                      )}
                    </div>
                  ))
              ) : (
                availOneTime
                  .filter(p => !serviceSearch || p.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                  .map(svc => (
                    <div key={svc.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{svc.name}</p>
                        <p className="text-[10px] text-slate-400">₱{Number(svc.serviceRate).toLocaleString()}</p>
                      </div>
                      {svc.linkedToThisTemplate ? (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full shrink-0">Linked</span>
                      ) : svc.taskTemplateId !== null ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">Other</span>
                      ) : (
                        <button
                          onClick={() => void linkService('oneTime', svc.id)}
                          disabled={linkingService}
                          className="px-3 py-1 text-[10px] font-bold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-40 shrink-0"
                        >
                          {linkingService ? <Loader2 size={10} className="animate-spin" /> : 'Link'}
                        </button>
                      )}
                    </div>
                  ))
              )}
              {!servicesLoading && serviceTypeTab === 'plan' && availPlans.filter(p => !serviceSearch || p.name.toLowerCase().includes(serviceSearch.toLowerCase())).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No monthly plans found.</p>
              )}
              {!servicesLoading && serviceTypeTab === 'oneTime' && availOneTime.filter(p => !serviceSearch || p.name.toLowerCase().includes(serviceSearch.toLowerCase())).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No one-time services found.</p>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => { setShowServicePicker(false); setServiceSearch(''); }}
                className="px-5 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Template Card ─────────────────────────────────────────────────

function TemplateCard({
  template, onEdit, onDelete, onDuplicate, onUse,
}: {
  template: ApiTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUse: () => void;
}) {
  const sortedRoutes    = [...template.departmentRoutes].sort((a, b) => a.routeOrder - b.routeOrder);
  const totalSubtasks   = template.departmentRoutes.reduce((acc, r) => acc + r.subtasks.length, 0);
  const totalServices   = template.servicePlans.length + template.serviceOneTimePlans.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group flex flex-col">
      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={15} className="text-teal-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{template.name}</h3>
              <span className="text-[10px] text-slate-400 font-medium">#{template.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onDuplicate} title="Duplicate template"
              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
              <Copy size={13} />
            </button>
            <button onClick={onEdit} title="Edit"
              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={onDelete} title="Delete"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {template.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{template.description}</p>
        )}

        {/* Route flow */}
        {sortedRoutes.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {sortedRoutes.map((route, i) => (
              <React.Fragment key={route.id}>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Users size={9} /> {route.department.name}
                </span>
                {i < sortedRoutes.length - 1 && (
                  <ChevronRight size={10} className="text-slate-300" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 italic">No route defined yet.</p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center gap-3">
        {template.daysDue !== null && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
            <Clock size={9} /> {template.daysDue}d total
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
          <ListChecks size={9} /> {totalSubtasks} subtask{totalSubtasks !== 1 ? 's' : ''}
        </span>
        {totalServices > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
            <Briefcase size={9} /> {totalServices} service{totalServices !== 1 ? 's' : ''}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onUse}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors"
          >
            Use template
          </button>
          <button onClick={onEdit} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Edit <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export function TemplatesSettings(): React.ReactNode {
  const { success, error } = useToast();
  const { departments: allDepartments } = useTaskDepartments();

  const [templates, setTemplates]   = useState<ApiTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  // Modal state
  const [showCreate, setShowCreate]           = useState(false);
  const [editTarget, setEditTarget]           = useState<ApiTemplate | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<ApiTemplate | null>(null);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [duplicatingId, setDuplicatingId]     = useState<number | null>(null);

  // Load templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE);
      const data = await res.json() as { data?: ApiTemplate[]; error?: string };
      if (!res.ok) { error('Failed to load', data.error ?? 'Could not load templates'); return; }
      setTemplates(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { void loadTemplates(); }, [loadTemplates]);

  const filtered = templates.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q);
  });

  const handleCreated = (t: ApiTemplate) => {
    setTemplates(prev => [t, ...prev]);
    setShowCreate(false);
  };

  const handleUpdated = (t: ApiTemplate) => {
    setTemplates(prev => prev.map(x => x.id === t.id ? t : x));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${BASE}/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        error('Delete failed', d.error ?? 'Could not delete template');
        return;
      }
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
      success('Deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDuplicate = async (template: ApiTemplate, openEdit = false) => {
    if (duplicatingId !== null) return;
    setDuplicatingId(template.id);
    try {
      const res = await fetch(`${BASE}/${template.id}/duplicate`, { method: 'POST' });
      const d = await res.json() as { data?: ApiTemplate; error?: string };
      if (!res.ok) { error('Duplicate failed', d.error ?? 'Could not duplicate template'); return; }
      const copy = d.data!;
      setTemplates(prev => [copy, ...prev]);
      success('Duplicated', `"${copy.name}" has been created.`);
      if (openEdit) setEditTarget(copy);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <>
      <div className="space-y-5">
        {/* Sub-header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-800">Task Templates</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? 'Loading…' : `${templates.length} template${templates.length !== 1 ? 's' : ''} — define department routes and subtasks per workflow.`}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus size={15} /> New Template
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-8 pr-3 h-9 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <FileText size={28} className="text-slate-300 mb-3" />
            <p className="font-bold text-slate-500 text-sm">
              {search ? 'No templates match your search' : 'No templates yet'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-xs text-teal-700 hover:underline font-medium">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => setEditTarget(t)}
                onDelete={() => setDeleteTarget(t)}
                onDuplicate={() => void handleDuplicate(t)}
                onUse={() => void handleDuplicate(t, true)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateTemplateModal
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditTemplateModal
          template={editTarget}
          allDepartments={allDepartments}
          onClose={() => setEditTarget(null)}
          onUpdated={t => { handleUpdated(t); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}
