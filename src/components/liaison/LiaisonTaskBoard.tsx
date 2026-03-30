// src/components/liaison/LiaisonTaskBoard.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import {
  Search, Plus, LayoutList, Columns3,
  Calendar, GripVertical, Filter, ChevronDown,
  Loader2, X,
} from 'lucide-react';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';
import { useToast } from '@/context/ToastContext';
import type { AOTaskPriority } from '@/lib/types';

interface ApiTask {
  id: number;
  name: string;
  description: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: number; businessName: string } | null;
  department: { id: number; name: string } | null;
  status: { id: number; name: string; color: string } | null;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
  subtasks: Array<{ id: number; name: string; isCompleted: boolean }>;
}

interface BoardTask {
  id: string;
  title: string;
  description: string;
  priority: AOTaskPriority;
  dueDate: string;
  clientId: string;
  clientName: string;
  assigneeId: string;
  assigneeName: string;
  assigneeInitials: string;
  statusId: number;
  statusName: string;
  statusColor: string;
  subtaskCount: number;
  subtasksDone: number;
}

interface BoardEmployee { id: string; name: string; initials: string; department: string; }
interface BoardClient { id: string; name: string; }

const DB_PRIORITY_MAP: Record<string, AOTaskPriority> = {
  LOW: 'Low', NORMAL: 'Medium', HIGH: 'High', URGENT: 'Urgent',
};
const PRIORITY_TO_DB: Record<AOTaskPriority, string> = {
  Low: 'LOW', Medium: 'NORMAL', High: 'HIGH', Urgent: 'URGENT',
};

type BadgeVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger';
function statusVariant(name: string): BadgeVariant {
  const lower = name.toLowerCase();
  if (/done|complet|finish/.test(lower)) return 'success';
  if (/progress|doing|active|ongoing/.test(lower)) return 'info';
  if (/review|pending|wait|hold/.test(lower)) return 'warning';
  if (/cancel|block|reject|fail/.test(lower)) return 'danger';
  return 'neutral';
}

const PRIORITY_OPTIONS: AOTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low: { variant: 'neutral' }, Medium: { variant: 'info' },
  High: { variant: 'warning' }, Urgent: { variant: 'danger' },
};
const PRIORITY_RANK: Record<AOTaskPriority, number> = { Urgent: 1, High: 2, Medium: 3, Low: 4 };

function daysLeftInfo(dueDate: string, statusName: string): { label: string; cls: string } | null {
  if (/done|complet|finish/i.test(statusName)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  const n = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (n > 1) return { label: `${n}d left`, cls: 'text-slate-500 bg-slate-100' };
  if (n === 1) return { label: '1d left', cls: 'text-amber-600 bg-amber-50' };
  if (n === 0) return { label: 'Today', cls: 'text-amber-600 bg-amber-50' };
  return { label: `${Math.abs(n)}d over`, cls: 'text-rose-600 bg-rose-50' };
}

type ViewMode = 'list' | 'kanban';
type SortBy = 'name' | 'dueDate' | 'priority';

function mapApiTask(t: ApiTask): BoardTask {
  const fullName = t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : '';
  const parts = fullName.trim().split(' ');
  const initials = parts.map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
  return {
    id: String(t.id),
    title: t.name,
    description: t.description ?? '',
    priority: DB_PRIORITY_MAP[t.priority ?? 'NORMAL'] ?? 'Medium',
    dueDate: t.dueDate ?? new Date().toISOString(),
    clientId: String(t.client?.id ?? ''),
    clientName: t.client?.businessName ?? '—',
    assigneeId: String(t.assignedTo?.id ?? ''),
    assigneeName: fullName,
    assigneeInitials: initials,
    statusId: t.status?.id ?? -1,
    statusName: t.status?.name ?? 'To Do',
    statusColor: t.status?.color ?? '#64748b',
    subtaskCount: t.subtasks.length,
    subtasksDone: t.subtasks.filter(s => s.isCompleted).length,
  };
}

export function LiaisonTaskBoard() {
  const router = useRouter();
  const { departments } = useTaskDepartments();
  const { success, error: toastError } = useToast();

  const liaisonDept = useMemo(() => departments.find(d => d.name === 'Liaison') ?? null, [departments]);
  const liaisonStatuses = useMemo(() => {
    if (!liaisonDept) return [];
    return [...liaisonDept.statuses].sort((a, b) => a.statusOrder - b.statusOrder);
  }, [liaisonDept]);

  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<AOTaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newPriority, setNewPriority] = useState<AOTaskPriority>('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStatusId, setNewStatusId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [clients, setClients] = useState<BoardClient[]>([]);
  const [employees, setEmployees] = useState<BoardEmployee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!liaisonDept) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks?departmentId=${liaisonDept.id}`);
      if (!res.ok) return;
      const json = await res.json() as { data: ApiTask[] };
      setTasks(json.data.map(mapApiTask));
    } finally {
      setIsLoading(false);
    }
  }, [liaisonDept]);

  /* eslint-disable react-hooks/set-state-in-effect -- fetching data from external API */
  useEffect(() => { void fetchTasks(); }, [fetchTasks]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCreateModal = () => {
    const entry = liaisonStatuses.find(s => s.isEntryStep) ?? liaisonStatuses[0];
    setNewStatusId(entry?.id ?? null);
    setIsCreateModalOpen(true);
    fetch('/api/hr/clients')
      .then(r => r.json())
      .then((d: { data?: Array<{ id: number; businessName: string }> }) => {
        setClients((d.data ?? []).map(c => ({ id: String(c.id), name: c.businessName })));
      })
      .catch(() => { /* non-critical */ });
    fetch('/api/hr/employees')
      .then(r => r.ok ? r.json() : null)
      .then((d: { data?: Array<{ id: number; firstName: string; lastName: string; employment?: { department?: { name: string } | null } | null }> } | null) => {
        if (d?.data) {
          setEmployees(d.data.map(e => ({
            id: String(e.id),
            name: `${e.firstName} ${e.lastName}`,
            initials: `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase(),
            department: e.employment?.department?.name ?? '',
          })));
        }
      })
      .catch(() => { /* non-critical */ });
  };

  const resetCreateForm = () => {
    setNewTitle(''); setNewDescription('');
    setNewClientId(''); setNewAssigneeId('');
    setNewPriority('Medium'); setNewDueDate('');
    const entry = liaisonStatuses.find(s => s.isEntryStep) ?? liaisonStatuses[0];
    setNewStatusId(entry?.id ?? null);
    setClientSearch(''); setClientDropdownOpen(false);
    setAssigneeSearch(''); setAssigneeDropdownOpen(false);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !newDueDate || !liaisonDept) return;
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: PRIORITY_TO_DB[newPriority],
        dueDate: new Date(`${newDueDate}T00:00:00+08:00`).toISOString(),
        departmentId: liaisonDept.id,
        ...(newStatusId ? { statusId: newStatusId } : {}),
        ...(newClientId ? { clientId: parseInt(newClientId, 10) } : {}),
        ...(newAssigneeId ? { assignedToId: parseInt(newAssigneeId, 10) } : {}),
      };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        success('Task created', 'The new task has been added to the board.');
        await fetchTasks();
        resetCreateForm();
        setIsCreateModalOpen(false);
      } else {
        toastError('Failed to create task', 'Please check the form and try again.');
      }
    } catch {
      toastError('Failed to create task', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardDrop = async (statusId: number, statusName: string) => {
    if (!draggedTaskId) return;
    const numericId = Number(draggedTaskId);
    if (isNaN(numericId)) return;
    const targetStatus = liaisonStatuses.find(s => s.id === statusId);
    if (targetStatus?.isExitStep) {
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.subtaskCount > 0 && task.subtasksDone < task.subtaskCount) {
        toastError('Cannot move to Done', 'All subtasks must be completed first.');
        setDraggedTaskId(null);
        return;
      }
    }
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, statusId, statusName } : t));
    setDraggedTaskId(null);
    await fetch(`/api/tasks/${numericId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusId, departmentId: liaisonDept?.id }),
    });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const isOverdue = (t: BoardTask) =>
    !/done|complet|finish/i.test(t.statusName) && new Date(t.dueDate) < new Date();

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchSearch = search === '' ||
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.clientName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || t.statusName === filterStatus;
        const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
        return matchSearch && matchStatus && matchPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, search, filterStatus, filterPriority, sortBy]);

  if (departments.length === 0 || (isLoading && tasks.length === 0)) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-violet-600" />
      </div>
    );
  }

  if (!liaisonDept) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-slate-400 font-medium">Liaison department is not configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Task Board</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and track Liaison department tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
              <LayoutList size={14} className="inline mr-1" /> List
            </button>
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
              <Columns3 size={14} className="inline mr-1" /> Kanban
            </button>
          </div>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={openCreateModal}>
            <Plus size={16} /> New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search tasks or clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500">
              <option value="all">All Status</option>
              {liaisonStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as AOTaskPriority | 'all')} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500">
              <option value="all">All Priority</option>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500">
              <option value="dueDate">Sort: Due Date</option>
              <option value="name">Sort: Name</option>
              <option value="priority">Sort: Priority</option>
            </select>
          </div>
        </div>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_120px_100px_100px_80px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Task</span><span>Client</span><span>Assignee</span><span>Status</span><span>Due Date</span><span>Priority</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400 font-medium">No tasks match your search.</div>
            )}
            {filteredTasks.map(task => {
              const overdue = isOverdue(task);
              const dl = daysLeftInfo(task.dueDate, task.statusName);
              return (
                <div key={task.id} onClick={() => router.push(`/portal/liaison/tasks/${task.id}`)} className="grid grid-cols-[1fr_140px_120px_100px_100px_80px] gap-4 px-6 py-4 items-center hover:bg-slate-50 cursor-pointer transition-colors">
                  <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                  <span className="text-xs text-slate-600 font-medium truncate">{task.clientName}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-white">{task.assigneeInitials}</span>
                    </div>
                    <span className="text-xs text-slate-600 truncate">{task.assigneeName.split(' ')[0] || '—'}</span>
                  </div>
                  <Badge variant={statusVariant(task.statusName)} className="text-[9px] w-fit">{task.statusName}</Badge>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-xs font-bold flex items-center gap-1 ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>
                      <Calendar size={12} /> {formatDate(task.dueDate)}
                    </span>
                    {dl && <span className={`text-[9px] font-bold px-1.5 py-px rounded w-fit ${dl.cls}`}>{dl.label}</span>}
                  </div>
                  <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[9px] w-fit">{task.priority}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
          {liaisonStatuses.map(status => {
            const columnTasks = filteredTasks.filter(t => t.statusId === status.id);
            return (
              <div key={status.id} className="flex-none w-72">
                <div style={{ borderTopColor: status.color || '#64748b' }} className="bg-slate-50 rounded-2xl border-t-4 p-3 min-h-40">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{status.name}</span>
                      {status.isEntryStep && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-700">Entry</span>}
                      {status.isExitStep && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-green-100 text-green-700">Exit</span>}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-10" onDragOver={e => e.preventDefault()} onDrop={() => void handleCardDrop(status.id, status.name)}>
                    {columnTasks.length === 0 && (
                      <p className="text-center text-[10px] text-slate-300 font-medium py-4">Drop here</p>
                    )}
                    {columnTasks.map(task => {
                      const overdue = isOverdue(task);
                      const dl = daysLeftInfo(task.dueDate, task.statusName);
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={e => { e.stopPropagation(); setDraggedTaskId(task.id); }}
                          onDragEnd={() => setDraggedTaskId(null)}
                          onClick={() => router.push(`/portal/liaison/tasks/${task.id}`)}
                          className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-bold text-slate-800 line-clamp-2 flex-1">{task.title}</p>
                            <GripVertical size={14} className="text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5 ml-1" />
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mb-2 truncate">{task.clientName}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white">{task.assigneeInitials}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">{task.assigneeName.split(' ')[0] || '—'}</span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                  <Calendar size={10} /> {formatDate(task.dueDate)}
                                </span>
                                <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[8px] px-1.5 py-0">{task.priority}</Badge>
                              </div>
                              {dl && <span className={`text-[8px] font-bold px-1.5 py-px rounded self-end ${dl.cls}`}>{dl.label}</span>}
                            </div>
                          </div>
                          {task.subtaskCount > 0 && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${Math.round((task.subtasksDone / task.subtaskCount) * 100)}%` }} />
                              </div>
                              <span className="text-[9px] text-slate-400 font-medium shrink-0">{task.subtasksDone}/{task.subtaskCount}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreateForm(); }} title="Create New Task" size="lg">
        <div className="p-6 space-y-4">

          {/* Client */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Client</label>
            <div className="relative">
              <button type="button" onClick={() => setClientDropdownOpen(v => !v)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-slate-300 transition-colors">
                <span className="truncate text-slate-700">{clients.find(c => c.id === newClientId)?.name ?? 'Select a client…'}</span>
                <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {clientDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setClientDropdownOpen(false)} />
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input autoFocus value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients…" className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      <button type="button" onClick={() => { setNewClientId(''); setClientDropdownOpen(false); setClientSearch(''); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors text-slate-400 italic">None</button>
                      {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                        <button key={c.id} type="button" onClick={() => { setNewClientId(c.id); setClientDropdownOpen(false); setClientSearch(''); }} className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${newClientId === c.id ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-700'}`}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Title *</label>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. BIR Filing Run at RDO 044" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Task description..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-20 resize-none" />
          </div>

          {/* Department (locked) */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Department</label>
            <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 flex items-center font-medium cursor-not-allowed">
              {liaisonDept.name}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assignee</label>
            <div className="relative">
              <button type="button" onClick={() => setAssigneeDropdownOpen(v => !v)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-slate-300 transition-colors">
                {newAssigneeId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shrink-0 text-[8px] font-black text-white">
                      {employees.find(m => m.id === newAssigneeId)?.initials ?? '?'}
                    </div>
                    <span className="text-slate-700 truncate">{employees.find(m => m.id === newAssigneeId)?.name ?? 'Unknown'}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Select an assignee…</span>
                )}
                <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${assigneeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {assigneeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAssigneeDropdownOpen(false)} />
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input autoFocus value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)} placeholder="Search employees…" className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {employees.filter(m => m.name.toLowerCase().includes(assigneeSearch.toLowerCase())).map(m => (
                        <button key={m.id} type="button" onClick={() => { setNewAssigneeId(m.id); setAssigneeDropdownOpen(false); setAssigneeSearch(''); }} className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors ${newAssigneeId === m.id ? 'bg-violet-50' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black text-white ${newAssigneeId === m.id ? 'bg-violet-600' : 'bg-slate-400'}`}>{m.initials}</div>
                          <div className="flex-1 text-left min-w-0">
                            <p className={`text-sm font-semibold truncate ${newAssigneeId === m.id ? 'text-violet-700' : 'text-slate-700'}`}>{m.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{m.department}</p>
                          </div>
                        </button>
                      ))}
                      {employees.filter(m => m.name.toLowerCase().includes(assigneeSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">No employees found</p>
                      )}
                    </div>
                    {newAssigneeId && (
                      <div className="border-t border-slate-100 px-3 py-2">
                        <button type="button" onClick={() => { setNewAssigneeId(''); setAssigneeDropdownOpen(false); }} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold transition-colors">
                          <X size={12} /> Clear selection
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
              <select value={newStatusId ?? ''} onChange={e => setNewStatusId(parseInt(e.target.value, 10))} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
                {liaisonStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Priority</label>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value as AOTaskPriority)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Due Date *</label>
            <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}>Cancel</Button>
            <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreateTask} disabled={!newTitle.trim() || !newDueDate || isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="animate-spin mr-1" />}
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}