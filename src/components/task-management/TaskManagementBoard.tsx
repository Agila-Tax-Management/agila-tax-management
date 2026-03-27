// src/components/task-management/TaskManagementBoard.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import {
  Search, Plus, LayoutList, Columns3,
  Calendar, Tag, Filter, ChevronDown, ChevronRight,
  Loader2, X,
} from 'lucide-react';
import { ALL_TEAM_MEMBERS } from '@/lib/mock-task-management-data';
import type { UnifiedTask } from '@/lib/mock-task-management-data';
import type { AOTaskPriority } from '@/lib/types';
import { useTaskDepartments, type TaskApiDepartment, type TaskApiStatus } from '@/context/TaskDepartmentsContext';
import { useToast } from '@/context/ToastContext';

// ── API task shape returned by GET /api/tasks ──────────────────────
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
  subtasks: Array<{
    id: number;
    name: string;
    dueDate: string | null;
    assignedTo: { id: number; firstName: string; lastName: string } | null;
    isCompleted: boolean;
  }>;
}

const DB_PRIORITY_MAP: Record<string, AOTaskPriority> = {
  LOW: 'Low', NORMAL: 'Medium', HIGH: 'High', URGENT: 'Urgent',
};
const PRIORITY_TO_DB: Record<AOTaskPriority, string> = {
  Low: 'LOW', Medium: 'NORMAL', High: 'HIGH', Urgent: 'URGENT',
};

// Locally extended task with DB-sourced dept + status IDs
type BoardTask = UnifiedTask & { deptId: number | null; statusId: number | null };

function mapApiTask(t: ApiTask): BoardTask {
  return {
    id: String(t.id),
    title: t.name,
    description: t.description ?? '',
    status: (t.status?.name ?? 'To Do') as UnifiedTask['status'],
    priority: DB_PRIORITY_MAP[t.priority ?? 'NORMAL'] ?? 'Medium',
    source: 'om', // dummy — kept only for UnifiedTask type compatibility
    clientId: String(t.client?.id ?? ''),
    assigneeId: String(t.assignedTo?.id ?? ''),
    dueDate: t.dueDate ?? new Date().toISOString(),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    comments: [],
    tags: [],
    subtasks: t.subtasks.map(s => ({
      id: String(s.id),
      title: s.name,
      completed: s.isCompleted,
      dueDate: s.dueDate ?? undefined,
      assigneeId: s.assignedTo ? String(s.assignedTo.id) : undefined,
      createdAt: new Date().toISOString(),
    })),
    deptId: t.department?.id ?? null,
    statusId: t.status?.id ?? null,
  };
}

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
  Low:    { variant: 'neutral' },
  Medium: { variant: 'info'    },
  High:   { variant: 'warning' },
  Urgent: { variant: 'danger'  },
};

type ViewMode = 'list' | 'kanban';

interface TemplateItem {
  id: number;
  name: string;
  description: string | null;
  daysDue: number | null;
  departmentRoutes: Array<{ routeOrder: number; department: { id: number; name: string } }>;
}

interface BoardEmployee {
  id: string;
  name: string;
  avatar: string;
  department: string;
}

const DEFAULT_STATUSES: TaskApiStatus[] = [
  { id: -1, name: 'To Do',       color: '#64748b', statusOrder: 1, isEntryStep: true,  isExitStep: false },
  { id: -2, name: 'In Progress', color: '#3b82f6', statusOrder: 2, isEntryStep: false, isExitStep: false },
  { id: -3, name: 'For Review',  color: '#ca8a04', statusOrder: 3, isEntryStep: false, isExitStep: false },
  { id: -4, name: 'Done',        color: '#16a34a', statusOrder: 4, isEntryStep: false, isExitStep: true  },
];

function getDeptStatuses(dept: TaskApiDepartment | undefined | null): TaskApiStatus[] {
  if (!dept) return DEFAULT_STATUSES;
  const sorted = [...dept.statuses].sort((a, b) => a.statusOrder - b.statusOrder);
  return sorted.length > 0 ? sorted : DEFAULT_STATUSES;
}

// ─────────────────────────────────────────────────────────────────
// Inner component (needs useSearchParams — must be inside Suspense)
// ─────────────────────────────────────────────────────────────────
function TaskManagementBoardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deptIdParam = searchParams.get('dept');
  const activeDeptId: number | null = deptIdParam ? parseInt(deptIdParam, 10) : null;
  const { departments } = useTaskDepartments();
  const { error: toastError } = useToast();

  const activeDept = useMemo(
    () => (activeDeptId != null ? (departments.find(d => d.id === activeDeptId) ?? null) : null),
    [activeDeptId, departments],
  );

  const [tasks, setTasks]             = useState<BoardTask[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [clientNameMap, setClientNameMap] = useState<Map<string, string>>(new Map());
  const [assigneeNameMap, setAssigneeNameMap] = useState<Map<string, string>>(new Map());
  const [viewMode, setViewMode]       = useState<ViewMode>('kanban');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus]     = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<AOTaskPriority | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Collapsed dept sections (list view) — keyed by deptId
  const [collapsedDepts, setCollapsedDepts] = useState<Record<number, boolean>>({});
  const toggleDept = (deptId: number) =>
    setCollapsedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));

  // Collapsed status sections — keyed `"${deptId}-${statusId}"`
  const [collapsedStatuses, setCollapsedStatuses] = useState<Record<string, boolean>>({});
  const toggleStatus = (key: string) =>
    setCollapsedStatuses(prev => ({ ...prev, [key]: !prev[key] }));

  // ─── Form state ───
  const [newTitle, setNewTitle]           = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClientId, setNewClientId]     = useState('');
  const [newAssigneeId, setNewAssigneeId]                 = useState<string>('');
  const [newPriority, setNewPriority]     = useState<AOTaskPriority>('Medium');
  const [newDueDate, setNewDueDate]       = useState('');
  const [newDeptId, setNewDeptId]         = useState<number | null>(null);
  const [newStatus, setNewStatus]         = useState('');
  // Client dropdown
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch]             = useState('');
  const [isNewClient, setIsNewClient]               = useState(false);
  const [newClientNameInput, setNewClientNameInput] = useState('');
  const [localClients, setLocalClients]             = useState<Array<{ id: string; name: string }>>([]);
  // Assignee dropdown
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch]             = useState('');
  const [boardEmployees, setBoardEmployees]             = useState<BoardEmployee[]>([]);
  // Template dropdown
  const [templateList, setTemplateList]                 = useState<TemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading]         = useState(false);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch]             = useState('');
  const [selectedTemplateId, setSelectedTemplateId]     = useState<number | null>(null);

  // Reset default dept when URL param or departments change (adjust-during-render pattern)
  const [prevActiveDeptId, setPrevActiveDeptId] = useState<number | null | undefined>(undefined);
  if (prevActiveDeptId !== activeDeptId) {
    setPrevActiveDeptId(activeDeptId);
    setNewDeptId(activeDeptId ?? departments[0]?.id ?? null);
  }

  // ── Dynamic status options for filter bar ──────────────────────
  const filterStatusOptions = useMemo(() => {
    if (activeDept) return getDeptStatuses(activeDept);
    const seen = new Set<string>();
    const result: TaskApiStatus[] = [];
    for (const d of departments) {
      for (const s of getDeptStatuses(d)) {
        if (!seen.has(s.name)) { seen.add(s.name); result.push(s); }
      }
    }
    return result.length > 0 ? result : DEFAULT_STATUSES;
  }, [activeDept, departments]);

  // Statuses for the dept selected in the create form
  const selectedDeptStatuses = useMemo(
    () => getDeptStatuses(departments.find(d => d.id === newDeptId)),
    [newDeptId, departments],
  );

  // ── Fetch tasks from API ──────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = activeDeptId != null ? `/api/tasks?departmentId=${activeDeptId}` : '/api/tasks';
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json() as { data: ApiTask[] };
      const mapped = json.data.map(mapApiTask);
      setTasks(mapped);
      const cMap = new Map<string, string>();
      const aMap = new Map<string, string>();
      for (const t of json.data) {
        if (t.client) cMap.set(String(t.client.id), t.client.businessName);
        if (t.assignedTo) aMap.set(String(t.assignedTo.id), `${t.assignedTo.firstName} ${t.assignedTo.lastName}`);
      }
      setClientNameMap(cMap);
      setAssigneeNameMap(aMap);
    } finally {
      setIsLoading(false);
    }
  }, [activeDeptId]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const getClientName = (clientId: string) =>
    clientNameMap.get(clientId)
    ?? localClients.find(c => c.id === clientId)?.name
    ?? (clientId ? `Client #${clientId}` : '—');

  const applyTemplate = (tpl: TemplateItem) => {
    setNewTitle(tpl.name);
    setNewDescription(tpl.description ?? '');
    const sortedRoutes = [...(tpl.departmentRoutes ?? [])].sort((a, b) => a.routeOrder - b.routeOrder);
    const firstDept = sortedRoutes[0]?.department;
    if (firstDept && activeDeptId == null) {
      const matchingDept = departments.find(d => d.id === firstDept.id);
      if (matchingDept) {
        setNewDeptId(matchingDept.id);
        const statuses = getDeptStatuses(matchingDept);
        setNewStatus(statuses[0]?.name ?? '');
      }
    }
    if (tpl.daysDue) {
      const due = new Date();
      due.setDate(due.getDate() + tpl.daysDue);
      setNewDueDate(due.toISOString().split('T')[0]);
    }
  };

  const openCreateModal = () => {
    const defaultDeptId = activeDeptId ?? departments[0]?.id ?? null;
    const defaultDept = departments.find(d => d.id === defaultDeptId);
    const defaultStatuses = getDeptStatuses(defaultDept);
    setNewDeptId(defaultDeptId);
    setNewStatus(defaultStatuses[0]?.name ?? '');
    setIsCreateModalOpen(true);
    setTemplatesLoading(true);
    fetch('/api/admin/settings/task-workflow/templates')
      .then(r => r.json())
      .then(d => { setTemplateList(Array.isArray(d.data) ? (d.data as TemplateItem[]) : []); setTemplatesLoading(false); })
      .catch(() => setTemplatesLoading(false));
    fetch('/api/hr/clients')
      .then(r => r.json())
      .then((d: { data?: Array<{ id: number; businessName: string }> }) => {
        setLocalClients((d.data ?? []).map(c => ({ id: String(c.id), name: c.businessName })));
      })
      .catch(() => { /* non-critical */ });
    fetch('/api/hr/employees')
      .then(r => r.ok ? r.json() : null)
      .then((d: { data?: Array<{ id: number; firstName: string; lastName: string; department?: { name: string } }> } | null) => {
        if (d?.data) {
          setBoardEmployees(d.data.map(e => ({
            id: String(e.id),
            name: `${e.firstName} ${e.lastName}`,
            avatar: `${e.firstName[0]}${e.lastName[0]}`.toUpperCase(),
            department: e.department?.name ?? '',
          })));
        }
      })
      .catch(() => { /* non-critical */ });
  };

  const resetCreateForm = () => {
    setNewTitle(''); setNewDescription('');
    setNewClientId('');
    setNewAssigneeId('');
    setNewPriority('Medium'); setNewDueDate('');
    const defaultDeptId = activeDeptId ?? departments[0]?.id ?? null;
    setNewDeptId(defaultDeptId);
    const defaultDept = departments.find(d => d.id === defaultDeptId);
    setNewStatus(getDeptStatuses(defaultDept)[0]?.name ?? '');
    setClientSearch(''); setClientDropdownOpen(false);
    setIsNewClient(false); setNewClientNameInput('');
    setAssigneeSearch(''); setAssigneeDropdownOpen(false);
    setTemplateSearch(''); setTemplateDropdownOpen(false); setSelectedTemplateId(null);
  };

  const getAssignee = (assigneeId: string) => {
    const fromMock = ALL_TEAM_MEMBERS.find(m => m.id === assigneeId);
    if (fromMock) return fromMock;
    const name = assigneeNameMap.get(assigneeId);
    if (name) {
      const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
      return { id: assigneeId, name, email: '', avatar: initials, department: '' };
    }
    return undefined;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const isOverdue = (t: BoardTask) =>
    t.status !== 'Done' && new Date(t.dueDate) < new Date();

  const filteredTasks = useMemo(() => tasks.filter(t => {
    const matchSearch   = search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      getClientName(t.clientId).toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchStatus   = filterStatus   === 'all' || t.status   === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [tasks, search, filterStatus, filterPriority]);

  // Group tasks by deptId (numeric key)
  const tasksByDeptId = useMemo(() => {
    const map = new Map<number, BoardTask[]>();
    for (const dept of departments) map.set(dept.id, []);
    for (const task of filteredTasks) {
      if (task.deptId != null) {
        const arr = map.get(task.deptId) ?? [];
        arr.push(task);
        map.set(task.deptId, arr);
      }
    }
    return map;
  }, [filteredTasks, departments]);

  // ─── CRUD ───
  const handleCreateTask = async () => {
    if (!newTitle.trim() || !newDueDate) return;
    if (isNewClient && !newClientNameInput.trim()) return;

    const dept = departments.find(d => d.id === newDeptId);
    const statusEntry = selectedDeptStatuses.find(s => s.name === newStatus);
    const body: Record<string, unknown> = {
      name: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: PRIORITY_TO_DB[newPriority],
      dueDate: new Date(`${newDueDate}T00:00:00+08:00`).toISOString(),
      ...(dept ? { departmentId: dept.id } : {}),
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
      await fetchTasks();
      resetCreateForm();
      setIsCreateModalOpen(false);
    }
  };

  // ─── Drag & Drop ───
  const handleCardDrop = (deptId: number, statusId: number, statusName: string) => {
    if (!draggedTaskId) return;

    // Check exit step — all subtasks must be complete
    const dept = departments.find(d => d.id === deptId);
    const targetStatusObj = dept?.statuses.find(s => s.id === statusId);
    if (targetStatusObj?.isExitStep) {
      const task = tasks.find(t => t.id === draggedTaskId);
      const subs = task?.subtasks ?? [];
      if (subs.length > 0 && !subs.every(s => s.completed)) {
        toastError('Cannot move to Done', 'All subtasks must be completed before marking this task as done.');
        setDraggedTaskId(null);
        return;
      }
    }
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === draggedTaskId
        ? { ...t, deptId, statusId, status: statusName as UnifiedTask['status'], updatedAt: new Date().toISOString() }
        : t
    ));
    // Persist to API
    const numericId = Number(draggedTaskId);
    if (!isNaN(numericId) && statusId > 0) {
      void fetch(`/api/tasks/${numericId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: statusId, departmentId: deptId }),
      });
    }
    setDraggedTaskId(null);
  };

  const pageTitle    = activeDept ? `${activeDept.name} Tasks` : 'All Tasks';
  const pageSubtitle = activeDept
    ? `Tasks assigned to the ${activeDept.name} department.`
    : 'All tasks across departments.';

  /* ─── Row renderer (list view) ─── */
  const renderTaskRow = (task: BoardTask) => {
    const assignee = getAssignee(task.assigneeId);
    const overdue  = isOverdue(task);
    return (
      <div
        key={task.id}
        onClick={() => router.push(`/portal/task-management/tasks/${task.id}`)}
        className="grid grid-cols-[1fr_130px_100px_90px_100px_80px] gap-4 px-6 py-3.5 items-center hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
          {task.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {task.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Tag size={8} /> {tag}
                </span>
              ))}
              {task.tags.length > 2 && <span className="text-[9px] text-slate-400">+{task.tags.length - 2}</span>}
            </div>
          )}
        </div>
        <span className="text-xs text-slate-600 font-medium truncate">{getClientName(task.clientId)}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-[#0f766e] rounded-full flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-white">{assignee?.avatar ?? '?'}</span>
          </div>
          <span className="text-xs text-slate-600 truncate">{assignee?.name.split(' ')[0] ?? 'N/A'}</span>
        </div>
        <Badge variant={statusVariant(task.status)} className="text-[9px] w-fit">{task.status}</Badge>
        <span className={`text-xs font-bold flex items-center gap-1 ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>
          <Calendar size={12} /> {formatDate(task.dueDate)}
        </span>
        <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[9px] w-fit">{task.priority}</Badge>
      </div>
    );
  };

  /* ─── Kanban card renderer ─── */
  const renderKanbanCard = (task: BoardTask) => {
    const assignee = getAssignee(task.assigneeId);
    const overdue  = isOverdue(task);
    return (
      <div
        key={task.id}
        draggable
        onDragStart={e => { e.stopPropagation(); setDraggedTaskId(task.id); }}
        onDragEnd={() => setDraggedTaskId(null)}
        onClick={() => router.push(`/portal/task-management/tasks/${task.id}`)}
        className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
      >
        <p className="text-sm font-bold text-slate-800 line-clamp-2 mb-1">{task.title}</p>
        <p className="text-[10px] text-slate-500 font-medium mb-2 truncate">{getClientName(task.clientId)}</p>
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
            <div className="w-5 h-5 bg-[#0f766e] rounded-full flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{assignee?.avatar ?? '?'}</span>
            </div>
            <span className="text-[10px] text-slate-500">{assignee?.name.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
              <Calendar size={10} /> {formatDate(task.dueDate)}
            </span>
            <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[8px] px-1.5 py-0">
              {task.priority}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Single-dept kanban: columns = that dept's statuses ─── */
  const renderDeptKanban = (dept: TaskApiDepartment) => {
    const deptTasks = tasksByDeptId.get(dept.id) ?? filteredTasks.filter(t => t.deptId === dept.id);
    const statuses = getDeptStatuses(dept);
    return (
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
        {statuses.map(status => {
          const columnTasks = deptTasks.filter(t => t.status === status.name);
          const colKey = `${dept.id}-${status.id}`;
          return (
            <div key={status.id} className="flex-none w-72">
              <div
                style={{ borderTopColor: status.color || '#64748b' }}
                className="bg-slate-50 rounded-2xl border-t-4 p-3 min-h-40"
              >
                <button
                  onClick={() => toggleStatus(colKey)}
                  className="w-full flex items-center justify-between mb-3 px-1 hover:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{status.name}</span>
                    {status.isEntryStep && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-700">Entry</span>
                    )}
                    {status.isExitStep && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-green-100 text-green-700">Exit</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                    {collapsedStatuses[colKey]
                      ? <ChevronRight size={13} className="text-slate-400" />
                      : <ChevronDown size={13} className="text-slate-400" />}
                  </div>
                </button>
                <div
                  className="space-y-2 min-h-10"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleCardDrop(dept.id, status.id, status.name)}
                >
                  {!collapsedStatuses[colKey] && columnTasks.length === 0 && (
                    <p className="text-center text-[10px] text-slate-300 font-medium py-4">Drop here</p>
                  )}
                  {!collapsedStatuses[colKey] && columnTasks.map(renderKanbanCard)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ─── All-depts kanban: columns = departments, inside each = that dept's statuses ─── */
  const renderAllDeptsKanban = () => (
    <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
      {departments.map(dept => {
        const deptTasks = tasksByDeptId.get(dept.id) ?? [];
        const statuses = getDeptStatuses(dept);
        return (
          <div key={dept.id} className="flex-none w-72 flex flex-col">
            {/* Dept column header */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-3 bg-slate-100">
              <span className="text-sm font-black text-slate-700 uppercase tracking-wide flex-1">{dept.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-slate-600 shrink-0">
                {deptTasks.length}
              </span>
            </div>

            {/* Status sections stacked vertically inside each dept column */}
            <div className="space-y-2 flex-1">
              {statuses.map(status => {
                const statusTasks = deptTasks.filter(t => t.status === status.name);
                const colKey = `${dept.id}-${status.id}`;
                return (
                  <div
                    key={status.id}
                    className="bg-slate-50 rounded-xl overflow-hidden"
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={e => { e.stopPropagation(); handleCardDrop(dept.id, status.id, status.name); }}
                  >
                    <button
                      onClick={() => toggleStatus(colKey)}
                      className="w-full flex items-center justify-between px-3 py-2 border-b border-slate-100 hover:bg-white/60 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color || '#64748b' }} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{status.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
                          {statusTasks.length}
                        </span>
                        {collapsedStatuses[colKey]
                          ? <ChevronRight size={11} className="text-slate-400" />
                          : <ChevronDown size={11} className="text-slate-400" />}
                      </div>
                    </button>
                    {!collapsedStatuses[colKey] && (
                      <div className="p-2 space-y-2 min-h-14">
                        {statusTasks.length === 0 && (
                          <p className="text-center text-[10px] text-slate-300 font-medium py-3">Drop here</p>
                        )}
                        {statusTasks.map(renderKanbanCard)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ─── Grouped list section renderer (per dept) ─── */
  const renderListSection = (dept: TaskApiDepartment) => {
    const deptTasks = tasksByDeptId.get(dept.id) ?? [];
    const isCollapsed = !!collapsedDepts[dept.id];
    const statuses = getDeptStatuses(dept);
    const activeDeptTasks = deptTasks.filter(t => !statuses.find(s => s.name === t.status)?.isExitStep).length;
    return (
      <Card key={dept.id} className="border-none shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black uppercase tracking-wide text-slate-700">{dept.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-slate-600">
              {deptTasks.length} task{deptTasks.length !== 1 ? 's' : ''}
            </span>
            {activeDeptTasks > 0 && <Badge variant="info" className="text-[9px]">{activeDeptTasks} active</Badge>}
          </div>
          <button onClick={() => toggleDept(dept.id)} className="p-1 rounded shrink-0">
            {isCollapsed
              ? <ChevronRight size={16} className="text-slate-500" />
              : <ChevronDown size={16} className="text-slate-500" />}
          </button>
        </div>
        {!isCollapsed && (
          <div>
            {deptTasks.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400 font-medium">No tasks match your filters.</div>
            ) : (
              statuses.map(status => {
                const statusTasks = deptTasks.filter(t => t.status === status.name);
                if (statusTasks.length === 0) return null;
                const colKey = `${dept.id}-${status.id}`;
                return (
                  <div key={status.id}>
                    <button
                      onClick={() => toggleStatus(colKey)}
                      className="w-full flex items-center gap-2 px-5 py-2 bg-slate-50 border-y border-slate-100 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color || '#64748b' }} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{status.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full ml-1">
                        {statusTasks.length}
                      </span>
                      <span className="ml-auto">
                        {collapsedStatuses[colKey]
                          ? <ChevronRight size={13} className="text-slate-400" />
                          : <ChevronDown size={13} className="text-slate-400" />}
                      </span>
                    </button>
                    {!collapsedStatuses[colKey] && (
                      <>
                        <div className="grid grid-cols-[1fr_130px_100px_90px_100px_80px] gap-4 px-6 py-2 bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Task</span><span>Client</span><span>Assignee</span><span>Status</span><span>Due Date</span><span>Priority</span>
                        </div>
                        {statusTasks.map(renderTaskRow)}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#0f766e]" />
      </div>
    );
  }

  const displayDepts = activeDept ? [activeDept] : departments;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{pageTitle}</h2>
          <p className="text-sm text-slate-500 font-medium">{pageSubtitle}</p>
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
          <Button className="bg-[#0f766e] hover:bg-[#0d6560] text-white" onClick={openCreateModal}>
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
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0f766e]"
            >
              <option value="all">All Status</option>
              {filterStatusOptions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as AOTaskPriority | 'all')}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0f766e]"
            >
              <option value="all">All Priority</option>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {displayDepts.map(dept => renderListSection(dept))}
        </div>
      )}

      {/* KANBAN — single dept view (per-dept statuses as columns) */}
      {viewMode === 'kanban' && activeDept != null && renderDeptKanban(activeDept)}

      {/* KANBAN — all depts view (departments as columns, dept statuses inside each) */}
      {viewMode === 'kanban' && activeDept == null && renderAllDeptsKanban()}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
        title="Create New Task"
        size="lg"
      >
        <div className="p-6 space-y-4">

          {/* 1. Client */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Client *</label>
            {isNewClient ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newClientNameInput}
                  onChange={e => setNewClientNameInput(e.target.value)}
                  placeholder="Enter new client name…"
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
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#0f766e] hover:border-slate-300 transition-colors"
                >
                  <span className="truncate text-slate-700">
                    {localClients.find(c => c.id === newClientId)?.name ?? 'Select a client…'}
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
                            placeholder="Search clients…"
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                          />
                        </div>
                      </div>
                      <div className="max-h-44 overflow-y-auto">
                        {localClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setNewClientId(c.id); setClientDropdownOpen(false); setClientSearch(''); }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                              newClientId === c.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700'
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                        {localClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-4">No clients found. Use &quot;New Client&quot; to add one.</p>
                        )}
                      </div>
                      <div className="border-t border-slate-100 p-2">
                        <button
                          type="button"
                          onClick={() => { setIsNewClient(true); setClientDropdownOpen(false); setClientSearch(''); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
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

          {/* 2. Use Template */}
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
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#0f766e] hover:border-slate-300 transition-colors"
              >
                <span className={`truncate ${selectedTemplateId === null ? 'text-slate-400' : 'text-slate-700'}`}>
                  {selectedTemplateId !== null
                    ? (templateList.find(t => t.id === selectedTemplateId)?.name ?? 'Template selected')
                    : 'Select a template to auto-fill…'}
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
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {templatesLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 size={18} className="animate-spin text-teal-600" />
                        </div>
                      ) : templateList.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase())).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No templates found</p>
                      ) : (
                        templateList
                          .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()))
                          .map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => { applyTemplate(t); setSelectedTemplateId(t.id); setTemplateDropdownOpen(false); setTemplateSearch(''); }}
                              className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors ${
                                selectedTemplateId === t.id ? 'bg-teal-50' : ''
                              }`}
                            >
                              <p className={`text-sm font-semibold ${selectedTemplateId === t.id ? 'text-teal-700' : 'text-slate-700'}`}>{t.name}</p>
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

          {/* 3. Title */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Title *</label>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. BIR 2551Q Filing" />
          </div>

          {/* 4. Description */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Task description…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f766e] min-h-20 resize-none"
            />
          </div>

          {/* 5. Department — dynamic from DB */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Department *</label>
            <select
              value={newDeptId ?? ''}
              onChange={e => {
                const deptId = parseInt(e.target.value, 10);
                setNewDeptId(isNaN(deptId) ? null : deptId);
                const dept = departments.find(d => d.id === deptId);
                const statuses = getDeptStatuses(dept);
                setNewStatus(statuses[0]?.name ?? '');
              }}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              disabled={activeDeptId != null}
            >
              <option value="">Select department…</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* 6. Assignee — single searchable dropdown */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assignee *</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAssigneeDropdownOpen(v => !v)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#0f766e] hover:border-slate-300 transition-colors"
              >
                {newAssigneeId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-teal-700 rounded-full flex items-center justify-center shrink-0 text-[8px] font-black text-white">
                      {boardEmployees.find(m => m.id === newAssigneeId)?.avatar ?? '?'}
                    </div>
                    <span className="text-slate-700 truncate">
                      {boardEmployees.find(m => m.id === newAssigneeId)?.name ?? 'Unknown'}
                    </span>
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
                        <input
                          autoFocus
                          value={assigneeSearch}
                          onChange={e => setAssigneeSearch(e.target.value)}
                          placeholder="Search members…"
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {boardEmployees.filter(m =>
                        m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                        m.department.toLowerCase().includes(assigneeSearch.toLowerCase())
                      ).map(m => {
                        const selected = newAssigneeId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setNewAssigneeId(m.id); setAssigneeDropdownOpen(false); setAssigneeSearch(''); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors ${selected ? 'bg-teal-50' : ''}`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black text-white ${selected ? 'bg-teal-700' : 'bg-slate-400'}`}>
                              {m.avatar}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className={`text-sm font-semibold truncate ${selected ? 'text-teal-700' : 'text-slate-700'}`}>{m.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{m.department}</p>
                            </div>
                            {selected && (
                              <div className="w-4 h-4 bg-teal-700 rounded-full flex items-center justify-center shrink-0">
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

          {/* 7. Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                {selectedDeptStatuses.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Priority</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as AOTaskPriority)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* 8. Due Date */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Due Date *</label>
            <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#0f766e] hover:bg-[#0d6560] text-white"
              onClick={handleCreateTask}
              disabled={!newTitle.trim() || !newDueDate || (isNewClient && !newClientNameInput.trim())}
            >
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Public export — wraps inner component in Suspense (required for useSearchParams)
// ─────────────────────────────────────────────────────────────────
export function TaskManagementBoard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#0f766e]" />
        </div>
      }
    >
      <TaskManagementBoardInner />
    </Suspense>
  );
}
