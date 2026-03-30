// src/components/liaison/MyTask.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Input } from '@/components/UI/Input';
import {
  Search, LayoutList, Columns3,
  Calendar, GripVertical, Filter, Loader2,
} from 'lucide-react';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';
import { authClient } from '@/lib/auth-client';
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
  priority: AOTaskPriority;
  dueDate: string;
  clientName: string;
  statusId: number;
  statusName: string;
  statusColor: string;
  subtaskCount: number;
  subtasksDone: number;
}

const DB_PRIORITY_MAP: Record<string, AOTaskPriority> = {
  LOW: 'Low', NORMAL: 'Medium', HIGH: 'High', URGENT: 'Urgent',
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

type ViewMode = 'list' | 'kanban';
type SortBy = 'name' | 'dueDate' | 'priority';

function mapApiTask(t: ApiTask): BoardTask {
  return {
    id: String(t.id),
    title: t.name,
    priority: DB_PRIORITY_MAP[t.priority ?? 'NORMAL'] ?? 'Medium',
    dueDate: t.dueDate ?? new Date().toISOString(),
    clientName: t.client?.businessName ?? '—',
    statusId: t.status?.id ?? -1,
    statusName: t.status?.name ?? 'To Do',
    statusColor: t.status?.color ?? '#64748b',
    subtaskCount: t.subtasks.length,
    subtasksDone: t.subtasks.filter(s => s.isCompleted).length,
  };
}

export function MyTask() {
  const router = useRouter();
  const { departments } = useTaskDepartments();
  const { data: sessionData } = authClient.useSession();

  const liaisonDept = useMemo(() => departments.find(d => d.name === 'Liaison') ?? null, [departments]);
  const liaisonStatuses = useMemo(() => {
    if (!liaisonDept) return [];
    return [...liaisonDept.statuses].sort((a, b) => a.statusOrder - b.statusOrder);
  }, [liaisonDept]);

  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<AOTaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Resolve current user -> employee ID
  /* eslint-disable react-hooks/set-state-in-effect -- fetching data from external API */
  useEffect(() => {
    if (!sessionData?.user?.id) return;
    void (async () => {
      const res = await fetch('/api/hr/employees');
      if (!res.ok) return;
      const json = await res.json() as { data?: Array<{ id: number; user?: { id: string } | null }> };
      const emp = json.data?.find(e => e.user?.id === sessionData.user.id);
      if (emp) setCurrentEmployeeId(emp.id);
    })();
  }, [sessionData?.user?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const fetchTasks = useCallback(async () => {
    if (!liaisonDept || !currentEmployeeId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks?departmentId=${liaisonDept.id}&assignedToId=${currentEmployeeId}`);
      if (!res.ok) return;
      const json = await res.json() as { data: ApiTask[] };
      setTasks(json.data.map(mapApiTask));
    } finally {
      setIsLoading(false);
    }
  }, [liaisonDept, currentEmployeeId]);

  /* eslint-disable react-hooks/set-state-in-effect -- fetching data from external API */
  useEffect(() => { void fetchTasks(); }, [fetchTasks]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCardDrop = async (statusId: number, statusName: string) => {
    if (!draggedTaskId) return;
    const numericId = Number(draggedTaskId);
    if (isNaN(numericId)) return;
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Tasks</h2>
          <p className="text-sm text-slate-500 font-medium">Tasks assigned to you in the Liaison department.</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
            <LayoutList size={14} className="inline mr-1" /> List
          </button>
          <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
            <Columns3 size={14} className="inline mr-1" /> Kanban
          </button>
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
          <div className="grid grid-cols-[1fr_140px_100px_100px_80px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Task</span><span>Client</span><span>Status</span><span>Due Date</span><span>Priority</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400 font-medium">No tasks assigned to you.</div>
            )}
            {filteredTasks.map(task => {
              const overdue = isOverdue(task);
              return (
                <div key={task.id} onClick={() => router.push(`/portal/liaison/tasks/${task.id}`)} className="grid grid-cols-[1fr_140px_100px_100px_80px] gap-4 px-6 py-4 items-center hover:bg-slate-50 cursor-pointer transition-colors">
                  <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                  <span className="text-xs text-slate-600 font-medium truncate">{task.clientName}</span>
                  <Badge variant={statusVariant(task.statusName)} className="text-[9px] w-fit">{task.statusName}</Badge>
                  <span className={`text-xs font-bold flex items-center gap-1 ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>
                    <Calendar size={12} /> {formatDate(task.dueDate)}
                  </span>
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
              <div key={status.id} className="flex-none w-68">
                <div style={{ borderTopColor: status.color || '#64748b' }} className="bg-slate-50 rounded-2xl border-t-4 p-3 min-h-40">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{status.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-10" onDragOver={e => e.preventDefault()} onDrop={() => void handleCardDrop(status.id, status.name)}>
                    {columnTasks.length === 0 && (
                      <p className="text-center text-[10px] text-slate-300 font-medium py-4">No tasks</p>
                    )}
                    {columnTasks.map(task => {
                      const overdue = isOverdue(task);
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
                            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                              <Calendar size={10} /> {formatDate(task.dueDate)}
                            </span>
                            <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[8px] px-1.5 py-0">{task.priority}</Badge>
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
    </div>
  );
}
