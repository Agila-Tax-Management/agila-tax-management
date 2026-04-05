// src/components/task-management/CreateTaskTemplateModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Clock, Users, ChevronRight, ChevronLeft,
  X, Check, Loader2,
  ArrowUp, ArrowDown, ListChecks, Minus,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// -- Types ------------------------------------------------------------

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

export interface ApiTemplate {
  id:                  number;
  name:                string;
  description:         string | null;
  daysDue:             number | null;
  createdAt:           string;
  updatedAt:           string;
  departmentRoutes:    ApiRoute[];
  servicePlans:        { id: number; name: string; serviceRate: string; recurring: string; status: string }[];
  serviceOneTimePlans: { id: number; name: string; serviceRate: string; status: string }[];
}

interface DraftRoute {
  tempId:         string;
  departmentId:   number;
  departmentName: string;
  daysDue:        string;
  subtasks:       { tempId: string; name: string; description: string; priority: TPriority; daysDue: string }[];
}

interface DraftTaskSubtask {
  tempId:      string;
  name:        string;
  description: string;
  priority:    TPriority;
  daysDue:     string;
  routeTempId: string;
}

// -- Constants --------------------------------------------------------

const PRIORITIES: TPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const PRIORITY_LABEL: Record<TPriority, string> = {
  LOW: 'Low', NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent',
};

const BASE = '/api/admin/settings/task-workflow/templates';

// -- Component --------------------------------------------------------

export function CreateTaskTemplateModal({ onCreated, onClose }: {
  onCreated: (t: ApiTemplate) => void;
  onClose: () => void;
}) {
  const { success, error } = useToast();

  const [allDepartments, setAllDepartments] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/admin/settings/task-workflow/departments')
      .then((r) => r.json())
      .then((d) => { if (d.data) setAllDepartments(d.data as { id: number; name: string }[]); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — Template info
  const [name, setName]        = useState('');
  const [description, setDesc] = useState('');
  const [daysDue, setDaysDue]  = useState('');

  // Step 1 — Department routes
  const [routes, setRoutes]               = useState<DraftRoute[]>([]);
  const [addDeptId, setAddDeptId]         = useState('');
  const [addDeptDays, setAddDeptDays]     = useState('');
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  // Step 2 — Subtasks
  const [taskSubtasks, setTaskSubtasks] = useState<DraftTaskSubtask[]>([]);

  const [saving, setSaving] = useState(false);

  const usedDeptIds = new Set(routes.map(r => r.departmentId));
  const availDepts  = allDepartments.filter(d => !usedDeptIds.has(d.id));

  // -- Route helpers --------------------------------------------------

  const addRoute = () => {
    if (!addDeptId) return;
    const dept = allDepartments.find(d => d.id === parseInt(addDeptId, 10));
    if (!dept) return;
    const tempId = crypto.randomUUID();
    setRoutes(prev => [...prev, {
      tempId,
      departmentId:   dept.id,
      departmentName: dept.name,
      daysDue: addDeptDays,
      subtasks: [],
    }]);
    setAddDeptId('');
    setAddDeptDays('');
    setExpandedRoute(tempId);
  };

  const removeRoute = (tempId: string) => {
    setRoutes(prev => prev.filter(r => r.tempId !== tempId));
    if (expandedRoute === tempId) setExpandedRoute(null);
  };

  const moveRoute = (tempId: string, dir: 'up' | 'down') => {
    const idx     = routes.findIndex(r => r.tempId === tempId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= routes.length) return;
    const next = [...routes];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setRoutes(next);
  };

  // -- Subtask helpers -----------------------------------------------

  const addTaskSubtask = () => {
    if (routes.length === 0) return;
    setTaskSubtasks(prev => [...prev, {
      tempId:     crypto.randomUUID(),
      name:       '',
      description:'',
      priority:   'NORMAL' as TPriority,
      daysDue:    '',
      routeTempId: routes[0].tempId,
    }]);
  };

  const updateTaskSubtask = (id: string, patch: Partial<DraftTaskSubtask>) => {
    setTaskSubtasks(prev => prev.map(s => s.tempId === id ? { ...s, ...patch } : s));
  };

  const removeTaskSubtask = (id: string) => {
    setTaskSubtasks(prev => prev.filter(s => s.tempId !== id));
  };

  // -- Submit ---------------------------------------------------------

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      // 1. Create template
      const tplRes  = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        name.trim(),
          description: description.trim() || undefined,
          daysDue:     daysDue ? parseInt(daysDue, 10) : undefined,
        }),
      });
      const tplData = await tplRes.json() as { data?: ApiTemplate; error?: string };
      if (!tplRes.ok) { error('Failed', tplData.error ?? 'Could not create template'); return; }

      const tpl       = tplData.data!;
      const apiRoutes: ApiRoute[] = [];

      // 2. Add routes sequentially
      for (const draft of routes) {
        const routeRes  = await fetch(`${BASE}/${tpl.id}/routes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            departmentId: draft.departmentId,
            daysDue:      draft.daysDue ? parseInt(draft.daysDue, 10) : undefined,
          }),
        });
        const routeData = await routeRes.json() as { data?: ApiRoute; error?: string };
        if (!routeRes.ok) {
          error('Partial failure', routeData.error ?? `Could not add route for ${draft.departmentName}`);
          continue;
        }
        apiRoutes.push({ ...routeData.data!, subtasks: [] });
      }

      // 3. Add subtasks mapped to correct route
      const routeTempToApiId = new Map(routes.map((draft, i) => [draft.tempId, apiRoutes[i]?.id]));
      for (const sub of taskSubtasks.filter(s => s.name.trim())) {
        const routeApiId = routeTempToApiId.get(sub.routeTempId);
        if (!routeApiId) continue;
        await fetch(`${BASE}/${tpl.id}/routes/${routeApiId}/subtasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:        sub.name.trim(),
            description: sub.description.trim() || undefined,
            priority:    sub.priority,
            daysDue:     sub.daysDue ? parseInt(sub.daysDue, 10) : undefined,
          }),
        });
      }

      success('Created', `"${name.trim()}" template has been created.`);
      onCreated({ ...tpl, departmentRoutes: apiRoutes });
    } finally {
      setSaving(false);
    }
  };

  // -- Render ---------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[calc(100vh-48px)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-black text-slate-900 text-base">New Template</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${step === 1 ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700'}`}>1</span>
              <span className="text-[10px] text-slate-400">Info & Routes</span>
              <ChevronRight size={10} className="text-slate-300" />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${step === 2 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
              <span className="text-[10px] text-slate-400">Subtasks</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* -- Step 1: Template Info ---------------------------------- */}
        {step === 1 && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
        )}

        {/* -- Step 1 continued: Department Routes ------------------- */}
        {step === 1 && (
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {routes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Users size={24} className="text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No route steps yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add departments below to define the workflow order.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {routes.map((route, idx) => (
                  <div key={route.tempId} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
                      <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-[11px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-bold text-sm text-slate-800 min-w-0 truncate">{route.departmentName}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock size={11} className="text-slate-400" />
                        <input
                          type="number"
                          min={1}
                          value={route.daysDue}
                          onChange={e => setRoutes(prev => prev.map(r => r.tempId === route.tempId ? { ...r, daysDue: e.target.value } : r))}
                          placeholder="days"
                          className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <span className="text-[10px] text-slate-400">d</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => moveRoute(route.tempId, 'up')} disabled={idx === 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30">
                          <ArrowUp size={12} />
                        </button>
                        <button onClick={() => moveRoute(route.tempId, 'down')} disabled={idx === routes.length - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30">
                          <ArrowDown size={12} />
                        </button>
                      </div>
                      <button onClick={() => removeRoute(route.tempId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0">
                        <Minus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add department step */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Add Department Step</p>
              {availDepts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">All departments are already in the route.</p>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={addDeptId}
                    onChange={e => setAddDeptId(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select department…</option>
                    {availDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={addDeptDays}
                    onChange={e => setAddDeptDays(e.target.value)}
                    placeholder="Days (opt.)"
                    className="w-24 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={addRoute}
                    disabled={!addDeptId}
                    className="px-4 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors disabled:opacity-40 inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={12} /> Add Step
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -- Step 2: Subtasks --------------------------------------- */}
        {step === 2 && (
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {routes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <ListChecks size={24} className="text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No route steps defined</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Go back to Step 1 and add at least one department.</p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-slate-500">Add subtasks for this task template. Each subtask is assigned to a department step so it shows up in the right workflow stage.</p>

                {taskSubtasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <ListChecks size={22} className="text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No subtasks yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &ldquo;Add Subtask&rdquo; below to get started.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {taskSubtasks.map((sub, idx) => (
                    <div key={sub.tempId} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                        <input
                          value={sub.name}
                          onChange={e => updateTaskSubtask(sub.tempId, { name: e.target.value })}
                          placeholder="Subtask name *"
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <button onClick={() => removeTaskSubtask(sub.tempId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                      <textarea
                        value={sub.description}
                        onChange={e => updateTaskSubtask(sub.tempId, { description: e.target.value })}
                        rows={2}
                        placeholder="Description (optional)"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={sub.priority}
                          onChange={e => updateTaskSubtask(sub.tempId, { priority: e.target.value as TPriority })}
                          className="flex-1 min-w-25 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                        </select>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock size={10} className="text-slate-400" />
                          <input
                            type="number"
                            min={1}
                            value={sub.daysDue}
                            onChange={e => updateTaskSubtask(sub.tempId, { daysDue: e.target.value })}
                            placeholder="Days due"
                            className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Users size={10} className="text-slate-400" />
                          <select
                            value={sub.routeTempId}
                            onChange={e => updateTaskSubtask(sub.tempId, { routeTempId: e.target.value })}
                            className="flex-1 min-w-30 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            {routes.map(r => <option key={r.tempId} value={r.tempId}>{r.departmentName}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addTaskSubtask}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-xl border border-dashed border-teal-200 transition-colors"
                >
                  <Plus size={12} /> Add Subtask
                </button>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            {step < 2 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="px-5 py-2 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors disabled:opacity-40 inline-flex items-center gap-2"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-5 py-2 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors disabled:opacity-40 inline-flex items-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Create
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
