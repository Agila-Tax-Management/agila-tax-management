// src/components/task-management/WorkflowSettings.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Pencil, Check, X, Loader2, Settings2, ArrowRight,
  Building2, ChevronRight,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useTaskDepartments, applyStoredDeptOrder } from '@/context/TaskDepartmentsContext';

// ── Helpers ─────────────────────────────────────────────────────────

/** Safely parse a response body — returns {} for empty / non-JSON bodies. */
async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { return {}; }
}

// ── Types ──────────────────────────────────────────────────────────

interface DepartmentStatus {
  id: number;
  name: string;
  color: string | null;
  statusOrder: number;
}

interface Department {
  id: number;
  name: string;
  statuses: DepartmentStatus[];
}

interface TemplateRoute {
  id: number;
  routeOrder: number;
  department: Department;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  daysDue: number | null;
  departmentRoutes: TemplateRoute[];
}

// ── Status pill colours ─────────────────────────────────────────────

const STATUS_COLOR_OPTIONS = [
  { label: 'Slate',  value: '#64748b' },
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Teal',   value: '#0f766e' },
  { label: 'Green',  value: '#16a34a' },
  { label: 'Yellow', value: '#ca8a04' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Red',    value: '#dc2626' },
  { label: 'Purple', value: '#9333ea' },
];

// ── Inline editable text ────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  className = '',
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  // Keep draft in sync with prop when not actively editing
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value && !editing) {
    setPrevValue(value);
    setDraft(value);
  }

  const save = async () => {
    if (!draft.trim() || draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          className={`border border-slate-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${className}`}
        />
        {saving
          ? <Loader2 size={14} className="animate-spin text-slate-400" />
          : (
            <>
              <button onClick={save} className="text-teal-600 hover:text-teal-800"><Check size={14} /></button>
              <button onClick={() => { setDraft(value); setEditing(false); }} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </>
          )
        }
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 group cursor-pointer"
      onClick={() => setEditing(true)}
    >
      <span className={className}>{value}</span>
      <Pencil size={12} className="opacity-0 group-hover:opacity-50 text-slate-400 transition-opacity" />
    </span>
  );
}

// ── Status row ──────────────────────────────────────────────────────

function StatusRow({
  status,
  deptId,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdate,
}: {
  status: DepartmentStatus;
  deptId: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<DepartmentStatus>) => void;
}) {
  const { success, error } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/settings/task-workflow/departments/${deptId}/statuses/${status.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) { const d = await safeJson(res); error('Delete failed', (d.error as string) ?? 'Unexpected error'); setDeleting(false); return; }
      onDelete();
    } catch {
      error('Delete failed', 'Unexpected error');
      setDeleting(false);
    }
  };

  const handleNameSave = async (name: string) => {
    const res = await fetch(
      `/api/admin/settings/task-workflow/departments/${deptId}/statuses/${status.id}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }
    );
    const d = await res.json() as { data?: DepartmentStatus; error?: string };
    if (!res.ok) { error('Update failed', d.error ?? 'Unexpected error'); return; }
    if (d.data) onUpdate(d.data);
    success('Status renamed', `Status renamed to "${name}".`);
  };

  const handleColorChange = async (color: string) => {
    const res = await fetch(
      `/api/admin/settings/task-workflow/departments/${deptId}/statuses/${status.id}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color }) }
    );
    const d = await res.json() as { data?: DepartmentStatus; error?: string };
    if (!res.ok) { error('Update failed', d.error ?? 'Unexpected error'); return; }
    if (d.data) onUpdate(d.data);
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 group">
      {/* Drag handle / order buttons */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          disabled={isFirst}
          onClick={onMoveUp}
          className="text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronUp size={14} />
        </button>
        <button
          disabled={isLast}
          onClick={onMoveDown}
          className="text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <GripVertical size={14} className="text-slate-300 shrink-0" />

      {/* Color dot picker */}
      <div className="relative group/color shrink-0">
        <button
          className="w-4 h-4 rounded-full border-2 border-white ring-1 ring-slate-200 shadow-sm"
          style={{ backgroundColor: status.color ?? '#64748b' }}
          title="Change color"
        />
        <div className="absolute left-0 top-6 z-10 hidden group-hover/color:flex flex-wrap gap-1 bg-white border border-slate-200 rounded-lg p-2 shadow-lg w-44">
          {STATUS_COLOR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              title={opt.label}
              onClick={() => handleColorChange(opt.value)}
              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${status.color === opt.value ? 'border-slate-700' : 'border-transparent'}`}
              style={{ backgroundColor: opt.value }}
            />
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <InlineEdit
          value={status.name}
          onSave={handleNameSave}
          className="font-medium text-slate-700 text-sm"
        />
      </div>

      {/* Delete */}
      {confirmDel ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 flex items-center gap-0.5"
          >
            {deleting ? <Loader2 size={10} className="animate-spin" /> : 'Yes'}
          </button>
          <button
            onClick={() => setConfirmDel(false)}
            className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDel(true)}
          className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
          title="Delete status"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ── Department panel ────────────────────────────────────────────────

function DepartmentPanel({
  route,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemoveFromRoute,
  templateId,
}: {
  route: TemplateRoute;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveFromRoute: () => void;
  templateId: number;
}) {
  const { success, error } = useToast();
  const [statuses, setStatuses] = useState<DepartmentStatus[]>(route.department.statuses);
  const [newStatusName, setNewStatusName] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);

  const deptId = route.department.id;

  const moveStatus = async (index: number, direction: 'up' | 'down') => {
    const newStatuses = [...statuses];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    [newStatuses[index], newStatuses[targetIdx]] = [newStatuses[targetIdx], newStatuses[index]];
    const reordered = newStatuses.map((s, i) => ({ ...s, statusOrder: i + 1 }));
    setStatuses(reordered);

    const res = await fetch(
      `/api/admin/settings/task-workflow/departments/${deptId}/statuses/reorder`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: reordered.map(s => ({ statusId: s.id, statusOrder: s.statusOrder })) }),
      }
    );
    if (!res.ok) {
      error('Reorder failed', 'Could not save new order');
      setStatuses(statuses); // revert
    }
  };

  const addStatus = async () => {
    if (!newStatusName.trim()) return;
    setAdding(true);
    const res = await fetch(
      `/api/admin/settings/task-workflow/departments/${deptId}/statuses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStatusName.trim() }),
      }
    );
    const data = await res.json();
    if (!res.ok) { error('Add failed', data.error); setAdding(false); return; }
    setStatuses(prev => [...prev, data.data]);
    setNewStatusName('');
    setAdding(false);
    success('Status added', `"${data.data.name}" added to ${route.department.name}`);
  };

  const removeFromRoute = async () => {
    setRemoving(true);
    const res = await fetch(
      `/api/task-management/settings/templates/${templateId}/routes/${route.id}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const d = await safeJson(res);
      error('Remove failed', (d.error as string) ?? 'Unexpected error');
      setRemoving(false);
      return;
    }
    success('Department removed', `${route.department.name} removed from workflow`);
    onRemoveFromRoute();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Department header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        {/* Order arrows */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button disabled={isFirst} onClick={onMoveUp} className="text-slate-400 hover:text-slate-700 disabled:opacity-20">
            <ChevronUp size={16} />
          </button>
          <button disabled={isLast} onClick={onMoveDown} className="text-slate-400 hover:text-slate-700 disabled:opacity-20">
            <ChevronDown size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {route.routeOrder}
          </span>
          <span className="font-semibold text-slate-800 truncate">{route.department.name}</span>
          <ArrowRight size={14} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500">{statuses.length} status{statuses.length !== 1 ? 'es' : ''}</span>
        </div>

        <button
          onClick={removeFromRoute}
          disabled={removing}
          className="text-slate-300 hover:text-red-500 transition-colors disabled:animate-pulse shrink-0"
          title="Remove department from workflow"
        >
          {removing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>

      {/* Statuses */}
      <div className="p-4 space-y-2">
        {statuses.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-2">No statuses yet — add one below</p>
        )}
        {statuses.map((st, idx) => (
          <StatusRow
            key={st.id}
            status={st}
            deptId={deptId}
            isFirst={idx === 0}
            isLast={idx === statuses.length - 1}
            onMoveUp={() => moveStatus(idx, 'up')}
            onMoveDown={() => moveStatus(idx, 'down')}
            onDelete={() => setStatuses(prev => prev.filter(s => s.id !== st.id))}
            onUpdate={patch => setStatuses(prev => prev.map(s => s.id === st.id ? { ...s, ...patch } : s))}
          />
        ))}

        {/* Add status */}
        <div className="flex gap-2 pt-1">
          <input
            value={newStatusName}
            onChange={e => setNewStatusName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addStatus(); }}
            placeholder="New status name…"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={addStatus}
            disabled={adding || !newStatusName.trim()}
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm rounded-lg font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Template tab content ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future template editing UI
function TemplateEditor({
  template,
  allDepartments,
  onUpdate,
  onDelete,
}: {
  template: Template;
  allDepartments: Department[];
  onUpdate: (updated: Template) => void;
  onDelete: () => void;
}) {
  const { success, error } = useToast();
  const [routes, setRoutes] = useState<TemplateRoute[]>(template.departmentRoutes);
  const [addingDept, setAddingDept] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState(false);

  const usedDeptIds = new Set(routes.map(r => r.department.id));
  const availableDepts = allDepartments.filter(d => !usedDeptIds.has(d.id));

  const addDepartment = async () => {
    if (!selectedDeptId) return;
    setAddingDept(true);
    const res = await fetch(
      `/api/task-management/settings/templates/${template.id}/routes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: selectedDeptId }),
      }
    );
    const data = await res.json();
    if (!res.ok) { error('Add failed', data.error); setAddingDept(false); return; }
    setRoutes(prev => [...prev, data.data]);
    setSelectedDeptId('');
    setAddingDept(false);
    success('Department added', `${data.data.department.name} added to workflow`);
  };

  const moveRoute = async (index: number, direction: 'up' | 'down') => {
    const newRoutes = [...routes];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    [newRoutes[index], newRoutes[targetIdx]] = [newRoutes[targetIdx], newRoutes[index]];
    const reordered = newRoutes.map((r, i) => ({ ...r, routeOrder: i + 1 }));
    setRoutes(reordered);

    const res = await fetch(
      `/api/task-management/settings/templates/${template.id}/routes/reorder`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: reordered.map(r => ({ routeId: r.id, routeOrder: r.routeOrder })) }),
      }
    );
    if (!res.ok) {
      error('Reorder failed', 'Could not save new order');
      setRoutes(routes); // revert
    }
  };

  const handleNameSave = async (name: string) => {
    const res = await fetch(
      `/api/task-management/settings/templates/${template.id}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }
    );
    const data = await res.json();
    if (!res.ok) { error('Update failed', data.error); return; }
    onUpdate({ ...template, name });
    success('Template renamed', `Renamed to "${name}"`);
  };

  const handleDeleteTemplate = async () => {
    setDeletingTemplate(true);
    const res = await fetch(
      `/api/task-management/settings/templates/${template.id}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const d = await safeJson(res);
      error('Delete failed', (d.error as string) ?? 'Unexpected error');
      setDeletingTemplate(false);
      setConfirmDeleteTemplate(false);
      return;
    }
    success('Template deleted', `"${template.name}" has been removed`);
    onDelete();
  };

  return (
    <div className="space-y-4">
      {/* Template name + delete */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <InlineEdit
            value={template.name}
            onSave={handleNameSave}
            className="text-base font-bold text-slate-800"
          />
          {template.description && (
            <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
          )}
        </div>
        {confirmDeleteTemplate ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-red-600 font-medium">Delete workflow?</span>
            <button
              onClick={handleDeleteTemplate}
              disabled={deletingTemplate}
              className="px-2 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {deletingTemplate ? <Loader2 size={11} className="animate-spin" /> : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDeleteTemplate(false)}
              className="px-2 py-1 text-xs font-bold text-slate-600 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteTemplate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 size={12} /> Delete workflow
          </button>
        )}
      </div>

      {/* Department sequence */}
      {routes.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          No departments in this workflow yet. Add one below.
        </div>
      )}

      <div className="space-y-3">
        {routes.map((route, idx) => (
          <DepartmentPanel
            key={route.id}
            route={route}
            isFirst={idx === 0}
            isLast={idx === routes.length - 1}
            onMoveUp={() => moveRoute(idx, 'up')}
            onMoveDown={() => moveRoute(idx, 'down')}
            onRemoveFromRoute={() => setRoutes(prev => prev.filter(r => r.id !== route.id))}
            templateId={template.id}
          />
        ))}
      </div>

      {/* Add department */}
      {availableDepts.length > 0 && (
        <div className="flex gap-2 pt-2">
          <select
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(Number(e.target.value) || '')}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Select department to add…</option>
            {availableDepts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button
            onClick={addDepartment}
            disabled={addingDept || !selectedDeptId}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            {addingDept ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Department
          </button>
        </div>
      )}
      {availableDepts.length === 0 && routes.length > 0 && (
        <p className="text-xs text-slate-400 italic text-center pt-1">All available departments are already in this workflow.</p>
      )}
    </div>
  );
}

// ── Department manager ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future department management UI
function DepartmentManager({
  departments,
  setDepartments,
  onRefresh,
}: {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  onRefresh: () => void;
}) {
  const { success, error } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // per-dept "add status" state
  const [newStatusNames, setNewStatusNames] = useState<Record<number, string>>({});
  const [addingStatus, setAddingStatus] = useState<number | null>(null);

  const addDept = async () => {
    if (!newDeptName.trim()) return;
    setAdding(true);
    const res = await fetch('/api/admin/settings/task-workflow/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDeptName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { error('Create failed', data.error); setAdding(false); return; }
    setDepartments(prev => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewDeptName('');
    setAdding(false);
    success('Department created', `"${data.data.name}" has been added.`);
    onRefresh();
  };

  const renameDept = async (deptId: number, name: string) => {
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${deptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) { error('Rename failed', data.error); throw new Error(data.error); }
    setDepartments(prev =>
      prev.map(d => d.id === deptId ? { ...d, name } : d)
          .sort((a, b) => a.name.localeCompare(b.name))
    );
    success('Renamed', `Department renamed to "${name}".`);
    onRefresh();
  };

  const deleteDept = async (deptId: number) => {
    setDeletingId(deptId);
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${deptId}`, { method: 'DELETE' });
    const data = await safeJson(res);
    setConfirmDeleteId(null);
    if (!res.ok) { error('Delete failed', (data.error as string) ?? 'Unexpected error'); setDeletingId(null); return; }
    setDepartments(prev => prev.filter(d => d.id !== deptId));
    setDeletingId(null);
    success('Deleted', 'Department removed.');
    onRefresh();
  };

  const addStatus = async (deptId: number) => {
    const name = newStatusNames[deptId]?.trim();
    if (!name) return;
    setAddingStatus(deptId);
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${deptId}/statuses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) { error('Add failed', data.error); setAddingStatus(null); return; }
    setDepartments(prev =>
      prev.map(d => d.id === deptId ? { ...d, statuses: [...d.statuses, data.data] } : d)
    );
    setNewStatusNames(prev => ({ ...prev, [deptId]: '' }));
    setAddingStatus(null);
    success('Status added', `"${data.data.name}" added.`);
    onRefresh();
  };

  const moveStatus = async (deptId: number, statuses: DepartmentStatus[], index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...statuses];
    [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
    const reordered = next.map((s, i) => ({ ...s, statusOrder: i + 1 }));

    setDepartments(prev =>
      prev.map(d => d.id === deptId ? { ...d, statuses: reordered } : d)
    );

    const res = await fetch(`/api/admin/settings/task-workflow/departments/${deptId}/statuses/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: reordered.map(s => ({ statusId: s.id, statusOrder: s.statusOrder })) }),
    });
    if (!res.ok) {
      error('Reorder failed', 'Could not save new order');
      setDepartments(prev =>
        prev.map(d => d.id === deptId ? { ...d, statuses } : d)
      );
    } else {
      onRefresh();
    }
  };

  const updateStatus = (deptId: number, statusId: number, patch: Partial<DepartmentStatus>) => {
    setDepartments(prev =>
      prev.map(d =>
        d.id === deptId
          ? { ...d, statuses: d.statuses.map(s => s.id === statusId ? { ...s, ...patch } : s) }
          : d
      )
    );
  };

  const removeStatus = (deptId: number, statusId: number) => {
    setDepartments(prev =>
      prev.map(d =>
        d.id === deptId ? { ...d, statuses: d.statuses.filter(s => s.id !== statusId) } : d
      )
    );
  };

  return (
    <>
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/80 border-b border-slate-100">
        <Building2 size={14} className="text-teal-700 shrink-0" />
        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Departments</span>
        <span className="ml-auto text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">{departments.length}</span>
      </div>

      {/* Department list */}
      <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
        {departments.length === 0 && (
          <p className="text-center text-sm text-slate-400 italic py-8">
            No departments yet — add one below.
          </p>
        )}

        {departments.map(dept => {
          const isExpanded = expandedId === dept.id;
          return (
            <div key={dept.id}>
              {/* Department row */}
              <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                  className="text-slate-400 hover:text-teal-700 transition-colors"
                >
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <InlineEdit
                    value={dept.name}
                    onSave={name => renameDept(dept.id, name)}
                    className="font-semibold text-slate-800 text-sm"
                  />
                </div>

                <span className="text-[11px] text-slate-400 shrink-0">
                  {dept.statuses.length} status{dept.statuses.length !== 1 ? 'es' : ''}
                </span>

                {/* Delete with confirmation */}
                {confirmDeleteId === dept.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-red-600 font-medium">Delete?</span>
                    <button
                      onClick={() => deleteDept(dept.id)}
                      disabled={deletingId === dept.id}
                      className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === dept.id ? <Loader2 size={12} className="animate-spin" /> : 'Yes'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(dept.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                    title="Delete department"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Expanded statuses */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Statuses in {dept.name}
                  </p>

                  <div className="space-y-1.5 mb-3">
                    {dept.statuses.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2 text-center">
                        No statuses yet.
                      </p>
                    )}
                    {dept.statuses.map((st, idx) => (
                      <StatusRow
                        key={st.id}
                        status={st}
                        deptId={dept.id}
                        isFirst={idx === 0}
                        isLast={idx === dept.statuses.length - 1}
                        onMoveUp={() => moveStatus(dept.id, dept.statuses, idx, 'up')}
                        onMoveDown={() => moveStatus(dept.id, dept.statuses, idx, 'down')}
                        onDelete={() => { removeStatus(dept.id, st.id); onRefresh(); }}
                        onUpdate={patch => updateStatus(dept.id, st.id, patch)}
                      />
                    ))}
                  </div>

                  {/* Add status input */}
                  <div className="flex gap-2">
                    <input
                      value={newStatusNames[dept.id] ?? ''}
                      onChange={e => setNewStatusNames(prev => ({ ...prev, [dept.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') addStatus(dept.id); }}
                      placeholder="New status name…"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                    <button
                      onClick={() => addStatus(dept.id)}
                      disabled={addingStatus === dept.id || !newStatusNames[dept.id]?.trim()}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm rounded-lg font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {addingStatus === dept.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add department footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex gap-2">
        <input
          value={newDeptName}
          onChange={e => setNewDeptName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addDept(); }}
          placeholder="New department name…"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
        <button
          onClick={addDept}
          disabled={adding || !newDeptName.trim()}
          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm rounded-lg font-medium disabled:opacity-50 flex items-center gap-1 transition-colors shrink-0"
        >
          {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Add
        </button>
      </div>
    </>
  );
}

// ── Dept status panel ─────────────────────────────────────────────────
// Self-contained panel rendering the statuses for a single active department.

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future per-dept status panel UI
function DeptStatusPanel({
  dept,
  setDepts,
  onRefresh,
}: {
  dept: Department;
  setDepts: React.Dispatch<React.SetStateAction<Department[]>>;
  onRefresh: () => void;
}) {
  const { success, error } = useToast();
  const [newStatusName, setNewStatusName] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statuses = dept.statuses;

  const addStatus = async () => {
    if (!newStatusName.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${dept.id}/statuses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newStatusName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { error('Add failed', data.error); setAdding(false); return; }
    setDepts(prev => prev.map(d => d.id === dept.id ? { ...d, statuses: [...d.statuses, data.data] } : d));
    setNewStatusName('');
    setAdding(false);
    success('Status added', `"${data.data.name}" added.`);
    onRefresh();
  };

  const moveStatus = async (idx: number, direction: 'up' | 'down') => {
    const next = [...statuses];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    const reordered = next.map((s, i) => ({ ...s, statusOrder: i + 1 }));
    setDepts(prev => prev.map(d => d.id === dept.id ? { ...d, statuses: reordered } : d));
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${dept.id}/statuses/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: reordered.map(s => ({ statusId: s.id, statusOrder: s.statusOrder })) }),
    });
    if (!res.ok) {
      error('Reorder failed', 'Could not save order');
      setDepts(prev => prev.map(d => d.id === dept.id ? { ...d, statuses } : d));
    } else { onRefresh(); }
  };

  const updateStatus = (statusId: number, patch: Partial<DepartmentStatus>) => {
    setDepts(prev => prev.map(d =>
      d.id === dept.id
        ? { ...d, statuses: d.statuses.map(s => s.id === statusId ? { ...s, ...patch } : s) }
        : d
    ));
    // Do not call onRefresh() for rename/color changes — that triggers
    // ensureDefaultDepartments via GET, which can insert default statuses
    // into departments that happen to have 0 task statuses at that moment.
  };

  const removeStatus = (statusId: number) => {
    setDepts(prev => prev.map(d =>
      d.id === dept.id ? { ...d, statuses: d.statuses.filter(s => s.id !== statusId) } : d
    ));
    onRefresh();
  };

  const handleRename = async (name: string) => {
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${dept.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) { error('Rename failed', data.error); throw new Error(data.error); }
    setDepts(prev =>
      prev.map(d => d.id === dept.id ? { ...d, name } : d)
          .sort((a, b) => a.name.localeCompare(b.name))
    );
    success('Renamed', `Department renamed to "${name}".`);
    onRefresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${dept.id}`, { method: 'DELETE' });
    const data = await safeJson(res);
    setConfirmDelete(false);
    if (!res.ok) { error('Delete failed', (data.error as string) ?? 'Unexpected error'); setDeleting(false); return; }
    setDepts(prev => prev.filter(d => d.id !== dept.id));
    setDeleting(false);
    success('Deleted', 'Department removed.');
    onRefresh();
  };

  return (
    <div className="space-y-5">
      {/* Header: rename + delete */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <InlineEdit
            value={dept.name}
            onSave={handleRename}
            className="text-base font-bold text-slate-800"
          />
          <p className="text-xs text-slate-400 mt-0.5">
            {statuses.length} status{statuses.length !== 1 ? 'es' : ''} configured
          </p>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-red-600 font-medium">Delete department?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 flex items-center gap-0.5"
            >
              {deleting ? <Loader2 size={11} className="animate-spin" /> : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs font-bold text-slate-600 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 size={12} /> Delete
          </button>
        )}
      </div>

      {/* Status list */}
      <div className="space-y-2">
        {statuses.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
            No statuses yet — add one below.
          </p>
        )}
        {statuses.map((st, idx) => (
          <StatusRow
            key={st.id}
            status={st}
            deptId={dept.id}
            isFirst={idx === 0}
            isLast={idx === statuses.length - 1}
            onMoveUp={() => moveStatus(idx, 'up')}
            onMoveDown={() => moveStatus(idx, 'down')}
            onDelete={() => removeStatus(st.id)}
            onUpdate={patch => updateStatus(st.id, patch)}
          />
        ))}
      </div>

      {/* Add status */}
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <input
          value={newStatusName}
          onChange={e => setNewStatusName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addStatus(); }}
          placeholder="New status name…"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={addStatus}
          disabled={adding || !newStatusName.trim()}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add Status
        </button>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────

export function WorkflowSettings(): React.ReactNode {
  const { success, error } = useToast();
  const { refresh, reorderDepts } = useTaskDepartments();
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showNewDeptInput, setShowNewDeptInput] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [addingDept, setAddingDept] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [newStatusNames, setNewStatusNames] = useState<Record<number, string>>({});
  const [addingStatus, setAddingStatus] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/settings/task-workflow/departments');
    const data = await res.json();
    if (res.ok) {
      const sorted = applyStoredDeptOrder(data.data as Department[]);
      setAllDepartments(sorted);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching callback: loadData sets loading state before await
  useEffect(() => { loadData(); }, [loadData]);

  // ── Drag-to-reorder ──────────────────────────────────────────────
  const handleDrop = (targetId: number) => {
    if (!draggingId || draggingId === targetId) return;
    const next = [...allDepartments];
    const fromIdx = next.findIndex(d => d.id === draggingId);
    const toIdx = next.findIndex(d => d.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setAllDepartments(next);
    reorderDepts(next.map(d => d.id));
  };

  // ── Dept CRUD ────────────────────────────────────────────────────
  const addDept = async () => {
    if (!newDeptName.trim()) return;
    setAddingDept(true);
    const res = await fetch('/api/admin/settings/task-workflow/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDeptName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { error('Create failed', data.error); setAddingDept(false); return; }
    const newDept: Department = { ...data.data, statuses: [] };
    setAllDepartments(prev => [...prev, newDept]);
    setExpandedId(newDept.id);
    setNewDeptName('');
    setShowNewDeptInput(false);
    setAddingDept(false);
    success('Department created', `"${newDept.name}" is ready to configure`);
    refresh();
  };

  const renameDept = async (deptId: number, name: string) => {
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${deptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) { error('Rename failed', data.error); throw new Error(data.error as string); }
    setAllDepartments(prev => prev.map(d => d.id === deptId ? { ...d, name } : d));
    success('Renamed', `Department renamed to "${name}".`);
    refresh();
  };

  const deleteDept = async (deptId: number) => {
    setDeletingId(deptId);
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${deptId}`, { method: 'DELETE' });
    const data = await safeJson(res);
    setConfirmDeleteId(null);
    if (!res.ok) { error('Delete failed', (data.error as string) ?? 'Unexpected error'); setDeletingId(null); return; }
    setAllDepartments(prev => prev.filter(d => d.id !== deptId));
    if (expandedId === deptId) setExpandedId(null);
    setDeletingId(null);
    success('Deleted', 'Department removed.');
    refresh();
  };

  // ── Status CRUD ──────────────────────────────────────────────────
  const addStatus = async (deptId: number) => {
    const name = (newStatusNames[deptId] ?? '').trim();
    if (!name) return;
    setAddingStatus(deptId);
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${deptId}/statuses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) { error('Add failed', data.error); setAddingStatus(null); return; }
    setAllDepartments(prev => prev.map(d =>
      d.id === deptId ? { ...d, statuses: [...d.statuses, data.data as DepartmentStatus] } : d
    ));
    setNewStatusNames(prev => ({ ...prev, [deptId]: '' }));
    setAddingStatus(null);
    success('Status added', `"${(data.data as DepartmentStatus).name}" added.`);
    refresh();
  };

  const moveStatus = async (deptId: number, statuses: DepartmentStatus[], index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...statuses];
    [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
    const reordered = next.map((s, i) => ({ ...s, statusOrder: i + 1 }));
    setAllDepartments(prev => prev.map(d => d.id === deptId ? { ...d, statuses: reordered } : d));
    const res = await fetch(`/api/admin/settings/task-workflow/departments/${deptId}/statuses/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: reordered.map(s => ({ statusId: s.id, statusOrder: s.statusOrder })) }),
    });
    if (!res.ok) {
      error('Reorder failed', 'Could not save order');
      setAllDepartments(prev => prev.map(d => d.id === deptId ? { ...d, statuses } : d));
    } else { refresh(); }
  };

  const updateStatus = (deptId: number, statusId: number, patch: Partial<DepartmentStatus>) => {
    setAllDepartments(prev => prev.map(d =>
      d.id === deptId
        ? { ...d, statuses: d.statuses.map(s => s.id === statusId ? { ...s, ...patch } : s) }
        : d
    ));
    // Do NOT call refresh() here — it triggers ensureDefaultDepartments on every
    // GET, which re-creates any default status names that were renamed (e.g.
    // renaming "To Do" → "test do" would cause "To Do" to be re-inserted at the
    // bottom on the next GET because the (departmentId, name) unique constraint
    // no longer blocks it). Context sync happens on next structural change or mount.
  };

  const removeStatus = (deptId: number, statusId: number) => {
    setAllDepartments(prev => prev.map(d =>
      d.id === deptId ? { ...d, statuses: d.statuses.filter(s => s.id !== statusId) } : d
    ));
    refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Settings2 size={15} className="text-teal-700 shrink-0" />
          <span className="text-sm font-bold text-slate-700">Department Workflows</span>
          <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
            {allDepartments.length}
          </span>
        </div>
        {showNewDeptInput ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addDept(); if (e.key === 'Escape') { setShowNewDeptInput(false); setNewDeptName(''); } }}
              placeholder="Department name…"
              className="border border-slate-300 rounded-lg px-2 py-1 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={addDept}
              disabled={addingDept || !newDeptName.trim()}
              className="text-teal-700 hover:text-teal-900 disabled:opacity-40"
            >
              {addingDept ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button onClick={() => { setShowNewDeptInput(false); setNewDeptName(''); }} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewDeptInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <Plus size={14} /> New Department
          </button>
        )}
      </div>

      {/* Department list */}
      {allDepartments.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Settings2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No departments yet</p>
          <p className="text-sm mt-1">Click &ldquo;+ New Department&rdquo; to get started.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {allDepartments.map((dept, idx) => {
            const isExpanded = expandedId === dept.id;
            const isDragging = draggingId === dept.id;
            const isDragOver = dragOverId === dept.id && !isDragging;
            return (
              <div
                key={dept.id}
                draggable
                onDragStart={() => setDraggingId(dept.id)}
                onDragOver={e => { e.preventDefault(); setDragOverId(dept.id); }}
                onDrop={() => { handleDrop(dept.id); setDragOverId(null); }}
                onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                className={`transition-all ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'bg-teal-50/60' : ''}`}
              >
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70 transition-colors">
                  <GripVertical size={15} className="text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
                  <span className="w-5 h-5 rounded-full bg-teal-700/10 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0 select-none">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <InlineEdit
                      value={dept.name}
                      onSave={name => renameDept(dept.id, name)}
                      className="font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {dept.statuses.length} status{dept.statuses.length !== 1 ? 'es' : ''}
                  </span>
                  {/* Delete with confirm */}
                  {confirmDeleteId === dept.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-red-600 font-medium">Delete?</span>
                      <button
                        onClick={() => deleteDept(dept.id)}
                        disabled={deletingId === dept.id}
                        className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                      >
                        {deletingId === dept.id ? <Loader2 size={11} className="animate-spin" /> : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(dept.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      title="Delete department"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {/* Expand/collapse */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                    className={`p-1 rounded-lg transition-colors shrink-0 ${isExpanded ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                    title={isExpanded ? 'Collapse' : 'Show statuses'}
                  >
                    <ChevronDown size={15} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expanded statuses panel */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pt-2">
                      Statuses
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {dept.statuses.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-3 text-center border-2 border-dashed border-slate-100 rounded-xl">
                          No statuses yet — add one below.
                        </p>
                      )}
                      {dept.statuses.map((st, sIdx) => (
                        <StatusRow
                          key={st.id}
                          status={st}
                          deptId={dept.id}
                          isFirst={sIdx === 0}
                          isLast={sIdx === dept.statuses.length - 1}
                          onMoveUp={() => moveStatus(dept.id, dept.statuses, sIdx, 'up')}
                          onMoveDown={() => moveStatus(dept.id, dept.statuses, sIdx, 'down')}
                          onDelete={() => removeStatus(dept.id, st.id)}
                          onUpdate={patch => updateStatus(dept.id, st.id, patch)}
                        />
                      ))}
                    </div>
                    {/* Add status */}
                    <div className="flex gap-2">
                      <input
                        value={newStatusNames[dept.id] ?? ''}
                        onChange={e => setNewStatusNames(prev => ({ ...prev, [dept.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') addStatus(dept.id); }}
                        placeholder="New status name…"
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      />
                      <button
                        onClick={() => addStatus(dept.id)}
                        disabled={addingStatus === dept.id || !(newStatusNames[dept.id] ?? '').trim()}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm rounded-lg font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
                      >
                        {addingStatus === dept.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
