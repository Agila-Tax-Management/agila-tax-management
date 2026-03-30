'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';
import {
  Search, Plus, LayoutList, Columns3,
  Calendar, GripVertical, Tag, Filter, Loader2, X, ChevronDown,
} from 'lucide-react';
import type { AOTaskStatus, AOTaskPriority } from '@/lib/types';

const STATUS_ORDER: AOTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const PRIORITY_OPTIONS: AOTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_CONFIG: Record<AOTaskStatus, { variant: 'neutral' | 'info' | 'warning' | 'success'; color: string }> = {
  'To Do': { variant: 'neutral', color: 'bg-slate-500' },
  'In Progress': { variant: 'info', color: 'bg-blue-500' },
  'Review': { variant: 'warning', color: 'bg-amber-500' },
  'Done': { variant: 'success', color: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low: { variant: 'neutral' },
  Medium: { variant: 'info' },
  High: { variant: 'warning' },
  Urgent: { variant: 'danger' },
};

const DB_PRIORITY_MAP: Record<string, AOTaskPriority> = {
  LOW: 'Low', NORMAL: 'Medium', HIGH: 'High', URGENT: 'Urgent',
};
const PRIORITY_TO_DB: Record<AOTaskPriority, string> = {
  Low: 'LOW', Medium: 'NORMAL', High: 'HIGH', Urgent: 'URGENT',
};

type ViewMode = 'list' | 'kanban';

interface ApiTask {
  id: number;
  name: string;
  description: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: number; businessName: string } | null;
  status: { id: number; name: string; color: string | null } | null;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
}

interface LocalTask {
  id: string;
  numericId: number;
  title: string;
  description: string;
  status: AOTaskStatus;
  statusId: number;
  priority: AOTaskPriority;
  clientId: string;
  clientName: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  dueDate: string;
  tags: string[];
}

interface LocalClient { id: string; name: string; }
interface LocalEmployee { id: string; name: string; avatar: string; department: string; }
interface TemplateItem { id: number; name: string; description: string | null; }

function mapStatus(name: string | null | undefined): AOTaskStatus {
  if (!name) return 'To Do';
  const n = name.toLowerCase();
  if (n.includes('progress')) return 'In Progress';
  if (n.includes('review')) return 'Review';
  if (n.includes('done') || n.includes('complet') || n.includes('finish')) return 'Done';
  return 'To Do';
}

function mapApiToLocal(t: ApiTask): LocalTask {
  return {
    id: String(t.id),
    numericId: t.id,
    title: t.name,
    description: t.description ?? '',
    status: mapStatus(t.status?.name),
    statusId: t.status?.id ?? 0,
    priority: DB_PRIORITY_MAP[t.priority ?? 'NORMAL'] ?? 'Medium',
    clientId: String(t.client?.id ?? ''),
    clientName: t.client?.businessName ?? 'Unknown',
    assigneeId: String(t.assignedTo?.id ?? ''),
    assigneeName: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned',
    assigneeAvatar: t.assignedTo
      ? `${t.assignedTo.firstName[0] ?? ''}${t.assignedTo.lastName[0] ?? ''}`.toUpperCase()
      : '?',
    dueDate: t.dueDate ?? new Date().toISOString(),
    tags: [],
  };
}

export function TaskBoard() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { departments } = useTaskDepartments();

  // Data
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AOTaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<AOTaskPriority | 'all'>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Create modal form
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newPriority, setNewPriority] = useState<AOTaskPriority>('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientNameInput, setNewClientNameInput] = useState('');

  // Create modal data
  const [localClients, setLocalClients] = useState<LocalClient[]>([]);
  const [boardEmployees, setBoardEmployees] = useState<LocalEmployee[]>([]);
  const [templateList, setTemplateList] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);

  // Find Account Officer department from context
  const aoDept = useMemo(
    () =>
      departments.find(d => /account.?officer/i.test(d.name)) ??
      departments.find(d => /client.?relation/i.test(d.name)) ??
      null,
    [departments],
  );
  const aoDeptStatuses = aoDept?.statuses ?? [];

  /* â”€â”€â”€ Fetch tasks â”€â”€â”€ */
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (aoDept?.id) params.set('departmentId', String(aoDept.id));
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json() as { data: ApiTask[] };
      setTasks((json.data ?? []).map(mapApiToLocal));
    } finally {
      setIsLoading(false);
    }
  }, [aoDept?.id]);

  /* eslint-disable react-hooks/set-state-in-effect -- fetching tasks from API on mount */
  useEffect(() => {
    if (departments.length > 0) void fetchTasks();
  }, [fetchTasks, departments.length]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* â”€â”€â”€ Helpers â”€â”€â”€ */
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

  const isOverdue = (t: LocalTask) =>
    t.status !== 'Done' && new Date(t.dueDate) < new Date();

  const daysLeftInfo = (dueDate: string, status: string): { label: string; cls: string } | null => {
    if (/done|complet|finish/i.test(status)) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
    const n = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (n > 1) return { label: `${n}d left`, cls: 'text-slate-500 bg-slate-100' };
    if (n === 1) return { label: '1d left', cls: 'text-amber-600 bg-amber-50' };
    if (n === 0) return { label: 'Today', cls: 'text-amber-600 bg-amber-50' };
    return { label: `${Math.abs(n)}d over`, cls: 'text-rose-600 bg-rose-50' };
  };

  const filteredTasks = useMemo(() => tasks.filter(t => {
    const matchSearch = search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.clientName.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchStatus   = filterStatus   === 'all' || t.status   === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  }), [tasks, search, filterStatus, filterPriority]);

  /* â”€â”€â”€ Create modal â”€â”€â”€ */
  const openCreateModal = () => {
    setNewStatus(aoDeptStatuses[0]?.name ?? 'To Do');
    setIsCreateModalOpen(true);
    setTemplatesLoading(true);
    void fetch('/api/admin/settings/task-workflow/templates')
      .then(r => r.json())
      .then((d: { data?: TemplateItem[] }) => { setTemplateList(d.data ?? []); setTemplatesLoading(false); })
      .catch(() => setTemplatesLoading(false));
    void fetch('/api/hr/clients')
      .then(r => r.json())
      .then((d: { data?: Array<{ id: number; businessName: string }> }) => {
        setLocalClients((d.data ?? []).map(c => ({ id: String(c.id), name: c.businessName })));
      })
      .catch(() => { /* non-critical */ });
    void fetch('/api/hr/employees')
      .then(r => r.ok ? r.json() : null)
      .then((d: { data?: Array<{ id: number; firstName: string; lastName: string; employment?: { department?: { name: string } | null } | null }> } | null) => {
        if (d?.data) {
          setBoardEmployees(d.data.map(e => ({
            id: String(e.id),
            name: `${e.firstName} ${e.lastName}`,
            avatar: `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase(),
            department: e.employment?.department?.name ?? '',
          })));
        }
      })
      .catch(() => { /* non-critical */ });
  };

  const applyTemplate = (t: TemplateItem) => {
    setNewTitle(t.name);
    if (t.description) setNewDescription(t.description);
  };

  const resetCreateForm = () => {
    setNewTitle(''); setNewDescription('');
    setNewClientId(''); setNewAssigneeId('');
    setNewPriority('Medium'); setNewDueDate('');
    setNewStatus(aoDeptStatuses[0]?.name ?? 'To Do');
    setClientSearch(''); setClientDropdownOpen(false);
    setIsNewClient(false); setNewClientNameInput('');
    setAssigneeSearch(''); setAssigneeDropdownOpen(false);
    setTemplateSearch(''); setTemplateDropdownOpen(false);
    setSelectedTemplateId(null);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !newDueDate) return;
    if (isNewClient && !newClientNameInput.trim()) return;
    setIsCreating(true);
    try {
      const statusEntry = aoDeptStatuses.find(s => s.name === newStatus);
      const body: Record<string, unknown> = {
        name: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: PRIORITY_TO_DB[newPriority],
        dueDate: new Date(`${newDueDate}T00:00:00+08:00`).toISOString(),
        ...(aoDept ? { departmentId: aoDept.id } : {}),
        ...(statusEntry && statusEntry.id > 0 ? { statusId: statusEntry.id } : {}),
        ...(newClientId ? { clientId: parseInt(newClientId, 10) } : {}),
        ...(selectedTemplateId !== null ? { templateId: selectedTemplateId } : {}),
        ...(newAssigneeId ? { assignedToId: parseInt(newAssigneeId, 10) } : {}),
      };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toastSuccess('Task created', 'The new task has been added successfully.');
        await fetchTasks();
        resetCreateForm();
        setIsCreateModalOpen(false);
      } else {
        toastError('Failed to create task', 'Please check the form and try again.');
      }
    } catch {
      toastError('Failed to create task', 'An unexpected error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  /* â”€â”€â”€ Drag & Drop â”€â”€â”€ */
  const handleDrop = async (targetStatus: AOTaskStatus) => {
    if (!draggedTaskId) return;
    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) return;
    const statusEntry = aoDeptStatuses.find(s => s.name === targetStatus);
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t));
    setDraggedTaskId(null);
    if (statusEntry?.id) {
      await fetch(`/api/tasks/${task.numericId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: statusEntry.id }),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#25238e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Task Board</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and track all client tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <LayoutList size={14} className="inline mr-1" /> List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <Columns3 size={14} className="inline mr-1" /> Kanban
            </button>
          </div>
          <Button className="bg-[#25238e] hover:bg-[#1a1868] text-white" onClick={openCreateModal}>
            <Plus size={16} /> New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search tasks, clients, tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as AOTaskStatus | 'all')}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#25238e]"
            >
              <option value="all">All Status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as AOTaskPriority | 'all')}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#25238e]"
            >
              <option value="all">All Priority</option>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_100px_100px_120px_80px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Task</span>
            <span>Client</span>
            <span>Assignee</span>
            <span>Status</span>
            <span>Due Date</span>
            <span>Priority</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400 font-medium">No tasks match your search.</div>
            )}
            {filteredTasks.map(task => {
              const overdue = isOverdue(task);
              const dl = daysLeftInfo(task.dueDate, task.status);
              return (
                <div
                  key={task.id}
                  onClick={() => router.push(`/portal/account-officer/tasks/${task.numericId}`)}
                  className="grid grid-cols-[1fr_140px_100px_100px_120px_80px] gap-4 px-6 py-4 items-center hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                    {task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                        {task.tags.length > 2 && <span className="text-[9px] text-slate-400">+{task.tags.length - 2}</span>}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 font-medium truncate">{task.clientName}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-[#25238e] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-white">{task.assigneeAvatar}</span>
                    </div>
                    <span className="text-xs text-slate-600 truncate">{task.assigneeName.split(' ')[0]}</span>
                  </div>
                  <Badge variant={STATUS_CONFIG[task.status].variant} className="text-[9px] w-fit">{task.status}</Badge>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_ORDER.map(status => {
            const columnTasks = filteredTasks.filter(t => t.status === status);
            return (
              <div
                key={status}
                className="bg-slate-50 rounded-2xl p-3 min-h-100"
                onDragOver={e => e.preventDefault()}
                onDrop={() => void handleDrop(status)}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[status].color}`} />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{status}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map(task => {
                    const overdue = isOverdue(task);
                    const dl = daysLeftInfo(task.dueDate, task.status);
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onClick={() => router.push(`/portal/account-officer/tasks/${task.numericId}`)}
                        className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md cursor-pointer transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-bold text-slate-800 line-clamp-2 flex-1">{task.title}</p>
                          <GripVertical size={14} className="text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5 ml-1" />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mb-2 truncate">{task.clientName}</p>
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Tag size={8} /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-[#25238e] rounded-full flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">{task.assigneeAvatar}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{task.assigneeName.split(' ')[0]}</span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                <Calendar size={10} /> {formatDate(task.dueDate)}
                              </span>
                              <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[8px] px-1.5 py-0">
                                {task.priority}
                              </Badge>
                            </div>
                            {dl && <span className={`text-[8px] font-bold px-1.5 py-px rounded self-end ${dl.cls}`}>{dl.label}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
        title="Create New Task"
        size="lg"
      >
        <div className="p-6 space-y-4">

          {/* Client */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Client</label>
            {isNewClient ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newClientNameInput}
                  onChange={e => setNewClientNameInput(e.target.value)}
                  placeholder="Enter new client nameâ€¦"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => { setIsNewClient(false); setNewClientNameInput(''); }}
                  className="p-2.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg transition-colors"
                  title="Back to client list"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setClientDropdownOpen(v => !v)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#25238e] hover:border-slate-300 transition-colors"
                >
                  <span className="truncate text-slate-700">
                    {localClients.find(c => c.id === newClientId)?.name ?? 'Select a client'}
                  </span>
                  <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {clientDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setClientDropdownOpen(false)} />
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            autoFocus
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                            placeholder="Search clients"
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25238e]"
                          />
                        </div>
                      </div>
                      <div className="max-h-44 overflow-y-auto">
                        {localClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setNewClientId(c.id); setClientDropdownOpen(false); setClientSearch(''); }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${newClientId === c.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'}`}
                          >
                            {c.name}
                          </button>
                        ))}
                        {localClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-4">No clients found.</p>
                        )}
                      </div>
                      <div className="border-t border-slate-100 p-2">
                        <button
                          type="button"
                          onClick={() => { setIsNewClient(true); setClientDropdownOpen(false); setClientSearch(''); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Plus size={14} /> New Client
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Template */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Use Template</label>
              {selectedTemplateId !== null && (
                <button
                  type="button"
                  onClick={() => { setSelectedTemplateId(null); setNewTitle(''); setNewDescription(''); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={11} /> Clear
                </button>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setTemplateDropdownOpen(v => !v)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#25238e] hover:border-slate-300 transition-colors"
              >
                <span className={`truncate ${selectedTemplateId === null ? 'text-slate-400' : 'text-slate-700'}`}>
                  {selectedTemplateId !== null
                    ? (templateList.find(t => t.id === selectedTemplateId)?.name ?? 'Template selected')
                    : 'Select a template to auto-fill the form'}
                </span>
                {templatesLoading
                  ? <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />
                  : <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${templateDropdownOpen ? 'rotate-180' : ''}`} />}
              </button>
              {templateDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setTemplateDropdownOpen(false)} />
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          autoFocus
                          value={templateSearch}
                          onChange={e => setTemplateSearch(e.target.value)}
                          placeholder="Search templates…"
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25238e]"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {templatesLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 size={18} className="animate-spin text-indigo-600" />
                        </div>
                      ) : templateList.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase())).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No templates found</p>
                      ) : (
                        templateList.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase())).map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => { applyTemplate(t); setSelectedTemplateId(t.id); setTemplateDropdownOpen(false); setTemplateSearch(''); }}
                            className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors ${selectedTemplateId === t.id ? 'bg-indigo-50' : ''}`}
                          >
                            <p className={`text-sm font-semibold ${selectedTemplateId === t.id ? 'text-indigo-700' : 'text-slate-700'}`}>{t.name}</p>
                            {t.description && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{t.description}</p>}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-1" />

          {/* Title */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Title *</label>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. BIR 2551Q Filing" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Task descriptionâ€¦"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25238e] min-h-20 resize-none"
            />
          </div>

          {/* Department â€” locked to Account Officer */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Department</label>
            <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 flex items-center">
              {aoDept?.name ?? 'Account Officer'}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assignee</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAssigneeDropdownOpen(v => !v)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#25238e] hover:border-slate-300 transition-colors"
              >
                {newAssigneeId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[#25238e] rounded-full flex items-center justify-center shrink-0 text-[8px] font-black text-white">
                      {boardEmployees.find(m => m.id === newAssigneeId)?.avatar ?? '?'}
                    </div>
                    <span className="text-slate-700 truncate">{boardEmployees.find(m => m.id === newAssigneeId)?.name ?? 'Unknown'}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Select an assignee...</span>
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
                        <input
                          autoFocus
                          value={assigneeSearch}
                          onChange={e => setAssigneeSearch(e.target.value)}
                          placeholder="Search members..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25238e]"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {boardEmployees
                        .filter(m =>
                          m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                          m.department.toLowerCase().includes(assigneeSearch.toLowerCase())
                        )
                        .map(m => {
                          const selected = newAssigneeId === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { setNewAssigneeId(m.id); setAssigneeDropdownOpen(false); setAssigneeSearch(''); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors ${selected ? 'bg-indigo-50' : ''}`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black text-white ${selected ? 'bg-[#25238e]' : 'bg-slate-400'}`}>
                                {m.avatar}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className={`text-sm font-semibold truncate ${selected ? 'text-indigo-700' : 'text-slate-700'}`}>{m.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{m.department}</p>
                              </div>
                              {selected && (
                                <div className="w-4 h-4 bg-[#25238e] rounded-full flex items-center justify-center shrink-0">
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      {boardEmployees.filter(m => m.name.toLowerCase().includes(assigneeSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">No members found</p>
                      )}
                    </div>
                    {newAssigneeId && (
                      <div className="border-t border-slate-100 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => { setNewAssigneeId(''); setAssigneeDropdownOpen(false); }}
                          className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition-colors"
                        >
                          Clear selection
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
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#25238e]"
              >
                {aoDeptStatuses.length > 0
                  ? aoDeptStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                  : STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Priority</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as AOTaskPriority)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#25238e]"
              >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Due Date *</label>
            <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#25238e] hover:bg-[#1a1868] text-white"
              onClick={() => void handleCreateTask()}
              disabled={!newTitle.trim() || !newDueDate || isCreating || (isNewClient && !newClientNameInput.trim())}
            >
              {isCreating ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Creating</> : 'Create Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

