// src/components/it/ITTaskBoard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import {
  ClipboardList, Search, Plus, Loader2, User, Calendar, X,
  ChevronRight,
} from 'lucide-react';

interface ApiTask {
  id: number;
  name: string;
  description: string | null;
  priority: string | null;
  dueDate: string | null;
  createdAt: string;
  status: { id: number; name: string; color: string } | null;
  department: { id: number; name: string } | null;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
  subtasks: Array<{ id: number; isCompleted: boolean }>;
}

const PRIORITY_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = {
  LOW: 'neutral', NORMAL: 'info', HIGH: 'warning', URGENT: 'danger',
};

export function ITTaskBoard() {
  const { success, error } = useToast();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [itDeptId, setItDeptId] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<Array<{ id: number; name: string; color: string }>>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', priority: 'NORMAL', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch IT department ID
  useEffect(() => {
    void fetch('/api/tasks/departments', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: { data?: Array<{ id: number; name: string }> }) => {
        const depts = json.data ?? [];
        const itDept = depts.find((d) => d.name.toLowerCase().includes('it') || d.name.toLowerCase().includes('information technology'));
        if (itDept) setItDeptId(itDept.id);
      })
      .catch(() => {});

    void fetch('/api/tasks/statuses', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: { data?: Array<{ id: number; name: string; color: string }> }) => setStatuses(json.data ?? []))
      .catch(() => {});
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!itDeptId) { setTasks([]); return; }
    const params = new URLSearchParams({ pageSize: '200' });
    params.set('departmentId', String(itDeptId));
    if (filterStatus) params.set('statusId', filterStatus);
    const res = await fetch(`/api/tasks?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json() as { data?: ApiTask[]; pagination?: unknown };
    const all: ApiTask[] = json.data ?? [];
    const filtered = search
      ? all.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      : all;
    setTasks(filtered);
  }, [itDeptId, filterStatus, search]);

  useEffect(() => {
    setLoading(true);
    void fetchTasks().finally(() => setLoading(false));
  }, [fetchTasks]);

  async function handleCreate() {
    if (!form.name.trim()) { error('Missing name', 'Task name is required.'); return; }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { name: form.name, priority: form.priority };
      if (form.description.trim()) body.description = form.description;
      if (form.dueDate) body.dueDate = new Date(`${form.dueDate}T00:00:00`).toISOString();
      if (itDeptId) body.departmentId = itDeptId;
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const j = await res.json(); error('Failed', j.error ?? 'Error occurred.'); return; }
      success('Task created', 'IT task has been added to the board.');
      setForm({ name: '', description: '', priority: 'NORMAL', dueDate: '' });
      setShowForm(false);
      void fetchTasks();
    } catch { error('Failed', 'Unexpected error.'); }
    finally { setSubmitting(false); }
  }

  // Group tasks by status
  const grouped = statuses.reduce<Record<string, ApiTask[]>>((acc, s) => {
    acc[s.name] = tasks.filter((t) => t.status?.id === s.id);
    return acc;
  }, {});
  const ungrouped = tasks.filter((t) => !t.status || !statuses.some((s) => s.id === t.status!.id));
  if (ungrouped.length > 0) grouped['Unassigned'] = ungrouped;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">IT Task Board</h1>
          <p className="text-sm text-slate-500 mt-1">Manage internal IT department tasks and projects.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-cyan-700 hover:bg-cyan-800 text-white">
          <Plus size={16} className="mr-2" /> New Task
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={String(s.id)}>{s.name}</option>
          ))}
        </select>
      </Card>

      {/* New task form */}
      {showForm && (
        <Card className="p-5 border-cyan-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">New IT Task</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Task Name</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                placeholder="What needs to be done?"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Priority</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Description (optional)</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 resize-none"
                placeholder="Additional details…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-cyan-700 hover:bg-cyan-800 text-white">
              {submitting && <Loader2 size={14} className="animate-spin mr-2" />}Create Task
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-cyan-700" /></div>
      ) : tasks.length === 0 && itDeptId ? (
        <Card className="p-12 text-center">
          <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No IT tasks found</p>
          <p className="text-slate-400 text-sm mt-1">Create a task or adjust the filters.</p>
        </Card>
      ) : !itDeptId && !loading ? (
        <Card className="p-12 text-center">
          <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">IT Department not found</p>
          <p className="text-slate-400 text-sm mt-1">Create an &quot;IT&quot; department in HR settings to use this board.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .filter(([, ts]) => ts.length > 0)
            .map(([statusName, statusTasks]) => (
              <div key={statusName}>
                <div className="flex items-center gap-2 mb-3">
                  <ChevronRight size={14} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wide">{statusName}</span>
                  <span className="text-xs text-slate-400">({statusTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {task.priority && (
                              <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'neutral'} className="text-[9px]">
                                {task.priority}
                              </Badge>
                            )}
                            <span className="text-sm font-bold text-slate-900">{task.name}</span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            {task.assignedTo && (
                              <span className="flex items-center gap-1">
                                <User size={11} />{task.assignedTo.firstName} {task.assignedTo.lastName}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />{new Date(task.dueDate).toLocaleDateString('en-PH')}
                              </span>
                            )}
                            {task.subtasks.length > 0 && (
                              <span>{task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} subtasks</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
