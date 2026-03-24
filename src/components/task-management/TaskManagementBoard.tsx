// src/components/task-management/TaskManagementBoard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  ALL_TASKS, ALL_TEAM_MEMBERS, SOURCE_CONFIG,
} from '@/lib/mock-task-management-data';
import type { UnifiedTask, TaskSource } from '@/lib/mock-task-management-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTaskPriority } from '@/lib/types';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';

// Map board source keys → API department names
const SOURCE_TO_DEPT_NAME: Record<TaskSource, string> = {
  'om':               'Operations Manager',
  'client-relations': 'Client Relations',
  'liaison':          'Liaison',
  'compliance':       'Compliance',
  'admin':            'Admin',
  'accounting':       'Accounting',
  'hr':               'Human Resources',
};

// Reverse map — API department name → board source key (case-insensitive)
const DEPT_NAME_TO_SOURCE_MAP: Array<{ aliases: string[]; source: TaskSource }> = [
  { aliases: ['operations manager', 'om'],                source: 'om' },
  { aliases: ['client relations', 'client-relations'],    source: 'client-relations' },
  { aliases: ['liaison'],                                 source: 'liaison' },
  { aliases: ['compliance'],                              source: 'compliance' },
  { aliases: ['admin', 'administration', 'administrator'], source: 'admin' },
  { aliases: ['accounting', 'accounts'],                  source: 'accounting' },
  { aliases: ['human resources', 'hr', 'human resource'], source: 'hr' },
];
const _deptSourceLookup = new Map<string, TaskSource>();
for (const { aliases, source } of DEPT_NAME_TO_SOURCE_MAP) {
  for (const alias of aliases) _deptSourceLookup.set(alias, source);
}
function deptNameToSource(name: string): TaskSource | undefined {
  return _deptSourceLookup.get(name.toLowerCase().trim());
}

// Derive a badge variant from a status name for task rows
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
const DEPT_SOURCES_DEFAULT: TaskSource[] = ['om', 'client-relations', 'liaison', 'compliance', 'admin', 'accounting', 'hr'];

interface TaskManagementBoardProps {
  sourceFilter?: TaskSource;
}

interface TemplateItem {
  id: number;
  name: string;
  description: string | null;
  daysDue: number | null;
  departmentRoutes: Array<{ routeOrder: number; department: { name: string } }>;
}

export function TaskManagementBoard({ sourceFilter }: TaskManagementBoardProps) {
  const router = useRouter();
  const { departments } = useTaskDepartments();
  const [tasks, setTasks]             = useState<UnifiedTask[]>(ALL_TASKS);
  const [viewMode, setViewMode]       = useState<ViewMode>('kanban');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus]     = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<AOTaskPriority | 'all'>('all');
  const [filterSource, setFilterSource]     = useState<TaskSource | 'all'>(sourceFilter ?? 'all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Collapsed dept sections (list view)
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  const toggleDept = (src: TaskSource) =>
    setCollapsedDepts(prev => ({ ...prev, [src]: !prev[src] }));

  // Collapsed status sections — keyed `"${src}-${status}"`
  const [collapsedStatuses, setCollapsedStatuses] = useState<Record<string, boolean>>({});
  const toggleStatus = (key: string) =>
    setCollapsedStatuses(prev => ({ ...prev, [key]: !prev[key] }));

  // â”€â”€â”€ Form state â”€â”€â”€
  const [newTitle, setNewTitle]           = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClientId, setNewClientId]     = useState(INITIAL_CLIENTS[0]?.id ?? '');
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>(ALL_TEAM_MEMBERS[0] ? [ALL_TEAM_MEMBERS[0].id] : []);
  const [newPriority, setNewPriority]     = useState<AOTaskPriority>('Medium');
  const [newDueDate, setNewDueDate]       = useState('');
  const [newTags, setNewTags]             = useState('');
  const [newSource, setNewSource]         = useState<TaskSource>(sourceFilter ?? 'client-relations');
  const [newStatus, setNewStatus]         = useState('To Do');
  // Client dropdown
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch]             = useState('');
  const [isNewClient, setIsNewClient]               = useState(false);
  const [newClientNameInput, setNewClientNameInput] = useState('');
  const [localClients, setLocalClients]             = useState<Array<{ id: string; name: string }>>([]);
  // Assignee dropdown
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch]             = useState('');
  // Template dropdown
  const [templateList, setTemplateList]                 = useState<TemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading]         = useState(false);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch]             = useState('');
  const [selectedTemplateId, setSelectedTemplateId]     = useState<number | null>(null);

  // ─── Dynamic statuses from WorkflowSettings (via TaskDepartmentsContext) ───
  const DEFAULT_STATUSES = useMemo(() => [
    { id: -1, name: 'To Do',       color: '#64748b', statusOrder: 1, isEntryStep: true,  isExitStep: false },
    { id: -2, name: 'In Progress', color: '#3b82f6', statusOrder: 2, isEntryStep: false, isExitStep: false },
    { id: -3, name: 'For Review',  color: '#ca8a04', statusOrder: 3, isEntryStep: false, isExitStep: false },
    { id: -4, name: 'Done',        color: '#16a34a', statusOrder: 4, isEntryStep: false, isExitStep: true  },
  ], []);

  const dynamicStatuses = useMemo(() => {
    if (departments.length === 0) return DEFAULT_STATUSES;
    if (sourceFilter) {
      const deptName = SOURCE_TO_DEPT_NAME[sourceFilter];
      const dept = departments.find(d => d.name === deptName);
      const sorted = (dept?.statuses ?? []).slice().sort((a, b) => a.statusOrder - b.statusOrder);
      return sorted.length > 0 ? sorted : DEFAULT_STATUSES;
    }
    // All-tasks view: union of unique status names across all depts (first-seen order)
    const seen = new Set<string>();
    const result: typeof departments[0]['statuses'] = [];
    for (const dept of departments) {
      const statuses = dept.statuses.length > 0
        ? dept.statuses.slice().sort((a, b) => a.statusOrder - b.statusOrder)
        : DEFAULT_STATUSES;
      for (const st of statuses) {
        if (!seen.has(st.name)) { seen.add(st.name); result.push(st); }
      }
    }
    return result.length > 0 ? result : DEFAULT_STATUSES;
  }, [departments, sourceFilter, DEFAULT_STATUSES]);

  const STATUS_ORDER: string[] = useMemo(() => dynamicStatuses.map(s => s.name), [dynamicStatuses]);
  const statusColorMap: Record<string, string> = useMemo(
    () => Object.fromEntries(dynamicStatuses.map(s => [s.name, s.color ?? '#64748b'])),
    [dynamicStatuses]
  );

  // Statuses available for the department currently selected in the Create form
  const selectedDeptStatuses = useMemo(() => {
    const deptName = SOURCE_TO_DEPT_NAME[newSource];
    const dept = departments.find(d => d.name === deptName);
    const sorted = (dept?.statuses ?? []).slice().sort((a, b) => a.statusOrder - b.statusOrder);
    return sorted.length > 0 ? sorted : DEFAULT_STATUSES;
  }, [newSource, departments, DEFAULT_STATUSES]);

  const getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName
    ?? localClients.find(c => c.id === clientId)?.name
    ?? 'Unknown';

  const applyTemplate = (tpl: TemplateItem) => {
    setNewTitle(tpl.name);
    setNewDescription(tpl.description ?? '');
    const sortedRoutes = [...(tpl.departmentRoutes ?? [])].sort((a, b) => a.routeOrder - b.routeOrder);
    const firstDeptName = sortedRoutes[0]?.department?.name;
    if (firstDeptName && !sourceFilter) {
      const src = deptNameToSource(firstDeptName);
      if (src) {
        setNewSource(src);
        // Reset status to the first status of that department
        const deptStatuses = departments
          .find(d => d.name === SOURCE_TO_DEPT_NAME[src])?.statuses
          .slice().sort((a, b) => a.statusOrder - b.statusOrder) ?? [];
        setNewStatus(deptStatuses[0]?.name ?? 'To Do');
      }
    }
    if (tpl.daysDue) {
      const due = new Date();
      due.setDate(due.getDate() + tpl.daysDue);
      setNewDueDate(due.toISOString().split('T')[0]);
    }
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setTemplatesLoading(true);
    fetch('/api/admin/settings/task-workflow/templates')
      .then(r => r.json())
      .then(d => { setTemplateList(Array.isArray(d.data) ? (d.data as TemplateItem[]) : []); setTemplatesLoading(false); })
      .catch(() => setTemplatesLoading(false));
  };
  const getAssignee = (assigneeId: string) =>
    ALL_TEAM_MEMBERS.find(m => m.id === assigneeId);
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const isOverdue = (t: UnifiedTask) =>
    t.status !== 'Done' && new Date(t.dueDate) < new Date('2026-03-23');

  const filteredTasks = useMemo(() => tasks.filter(t => {
    const matchSearch   = search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      getClientName(t.clientId).toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchStatus   = filterStatus   === 'all' || t.status   === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchSource   = filterSource   === 'all' || t.source   === filterSource;
    return matchSearch && matchStatus && matchPriority && matchSource;
  }), [tasks, search, filterStatus, filterPriority, filterSource]);

  // Dept display order — follows WorkflowSettings order (via TaskDepartmentsContext)
  const contextDeptOrder = useMemo<TaskSource[]>(() => {
    if (departments.length === 0) return DEPT_SOURCES_DEFAULT;
    const mapped = departments
      .map(d => deptNameToSource(d.name))
      .filter((s): s is TaskSource => !!s);
    const missing = DEPT_SOURCES_DEFAULT.filter(s => !mapped.includes(s));
    return [...mapped, ...missing];
  }, [departments]);

  const tasksByDept = useMemo(() => {
    return Object.fromEntries(
      contextDeptOrder.map(src => [src, filteredTasks.filter(t => t.source === src)])
    ) as Record<TaskSource, UnifiedTask[]>;
  }, [filteredTasks, contextDeptOrder]);

  // â”€â”€â”€ CRUD â”€â”€â”€

  const handleCreateTask = () => {
    if (!newTitle.trim() || !newDueDate) return;
    if (isNewClient && !newClientNameInput.trim()) return;
    let resolvedClientId = newClientId;
    if (isNewClient && newClientNameInput.trim()) {
      resolvedClientId = `local-${crypto.randomUUID()}`;
      setLocalClients(prev => [...prev, { id: resolvedClientId, name: newClientNameInput.trim() }]);
    }
    const task: UnifiedTask = {
      id: `task-${crypto.randomUUID()}`,
      title: newTitle.trim(), description: newDescription.trim(),
      status: newStatus as UnifiedTask['status'], priority: newPriority,
      clientId: resolvedClientId, assigneeId: newAssigneeIds[0] ?? '',
      dueDate: newDueDate,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      comments: [],
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      source: newSource,
    };
    setTasks(prev => [task, ...prev]);
    resetCreateForm();
    setIsCreateModalOpen(false);
  };
  const resetCreateForm = () => {
    setNewTitle(''); setNewDescription('');
    setNewClientId(INITIAL_CLIENTS[0]?.id ?? '');
    setNewAssigneeIds(ALL_TEAM_MEMBERS[0] ? [ALL_TEAM_MEMBERS[0].id] : []);
    setNewPriority('Medium'); setNewDueDate(''); setNewTags('');
    setNewSource(sourceFilter ?? 'client-relations');
    setNewStatus('To Do');
    setClientSearch(''); setClientDropdownOpen(false);
    setIsNewClient(false); setNewClientNameInput('');
    setAssigneeSearch(''); setAssigneeDropdownOpen(false);
    setTemplateSearch(''); setTemplateDropdownOpen(false); setSelectedTemplateId(null);
  };

  // â”€â”€â”€ Drag & Drop â”€â”€â”€
  /** Change a task's source dept + status (cross-dept horizontal kanban / flat kanban) */
  const handleCardDrop = (targetSrc: TaskSource, targetStatus: string) => {
    if (!draggedTaskId) return;
    setTasks(prev => prev.map(t =>
      t.id === draggedTaskId
        ? { ...t, source: targetSrc, status: targetStatus as UnifiedTask['status'], updatedAt: new Date().toISOString() }
        : t
    ));
    setDraggedTaskId(null);
  };

  const pageTitle    = sourceFilter ? `${SOURCE_CONFIG[sourceFilter].label} Tasks` : 'All Tasks';
  const pageSubtitle = sourceFilter
    ? `Tasks assigned to the ${SOURCE_CONFIG[sourceFilter].label.toLowerCase()} department.`
    : 'All tasks across departments.';

  /* â”€â”€â”€ Row renderer (list view) â”€â”€â”€ */
  const renderTaskRow = (task: UnifiedTask) => {
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

  /* â”€â”€â”€ Kanban card renderer â”€â”€â”€ */
  const renderKanbanCard = (task: UnifiedTask) => {
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

  /* â”€â”€â”€ Flat 4-column kanban (single dept page or OM tab) â”€â”€â”€ */
  const renderFlatKanban = (srcTasks: UnifiedTask[], src: TaskSource) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATUS_ORDER.map(status => {
        const columnTasks = srcTasks.filter(t => t.status === status);
        return (
          <div
            key={status}
            className="bg-slate-50 rounded-2xl p-3 min-h-40"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleCardDrop(src, status)}
          >
            <button
              onClick={() => toggleStatus(`${src}-${status}`)}
              className="w-full flex items-center justify-between mb-3 px-1 hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColorMap[status] ?? '#64748b' }} />
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{status}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                {collapsedStatuses[`${src}-${status}`]
                  ? <ChevronRight size={13} className="text-slate-400" />
                  : <ChevronDown size={13} className="text-slate-400" />}
              </div>
            </button>
            {!collapsedStatuses[`${src}-${status}`] && (
              <div className="space-y-2">
                {columnTasks.length === 0 && (
                  <p className="text-center text-[10px] text-slate-300 font-medium py-4">Drop here</p>
                )}
                {columnTasks.map(renderKanbanCard)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* â”€â”€â”€ Grouped list section renderer â”€â”€â”€ */
  const renderListSection = (src: TaskSource) => {
    const cfg = SOURCE_CONFIG[src];
    const deptTasks = tasksByDept[src] ?? [];
    const isCollapsed = !!collapsedDepts[src];
    const activeDeptTasks = deptTasks.filter(t => t.status !== 'Done').length;
    return (
      <Card key={src} className="border-none shadow-sm overflow-hidden">
        {/* Dept header */}
        <div className={`flex items-center justify-between px-5 py-3.5 ${cfg.bg} transition-all`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
            <span className={`text-sm font-black uppercase tracking-wide ${cfg.textColor}`}>{cfg.label}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 ${cfg.textColor}`}>
              {deptTasks.length} task{deptTasks.length !== 1 ? 's' : ''}
            </span>
            {activeDeptTasks > 0 && <Badge variant="info" className="text-[9px]">{activeDeptTasks} active</Badge>}
          </div>
          <button onClick={() => toggleDept(src)} className="p-1 rounded shrink-0">
            {isCollapsed ? <ChevronRight size={16} className={cfg.textColor} /> : <ChevronDown size={16} className={cfg.textColor} />}
          </button>
        </div>
        {/* Status groups */}
        {!isCollapsed && (
          <div>
            {deptTasks.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400 font-medium">No tasks match your filters.</div>
            ) : (
              STATUS_ORDER.map(status => {
                const statusTasks = deptTasks.filter(t => t.status === status);
                if (statusTasks.length === 0) return null;
                return (
                  <div key={status}>
                    <button
                      onClick={() => toggleStatus(`${src}-${status}`)}
                      className="w-full flex items-center gap-2 px-5 py-2 bg-slate-50 border-y border-slate-100 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColorMap[status] ?? '#64748b' }} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{status}</span>
                      <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full ml-1">
                        {statusTasks.length}
                      </span>
                      <span className="ml-auto">
                        {collapsedStatuses[`${src}-${status}`]
                          ? <ChevronRight size={13} className="text-slate-400" />
                          : <ChevronDown size={13} className="text-slate-400" />}
                      </span>
                    </button>
                    {!collapsedStatuses[`${src}-${status}`] && (
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
            {!sourceFilter && (
              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value as TaskSource | 'all')}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                <option value="all">All Departments</option>
                <option value="client-relations">Client Relations</option>
                <option value="liaison">Liaison</option>
                <option value="compliance">Compliance</option>
              </select>
            )}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0f766e]"
            >
              <option value="all">All Status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
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
          {(sourceFilter ? [sourceFilter] : contextDeptOrder).map(src =>
            renderListSection(src)
          )}
        </div>
      )}


      {/* â•â•â• KANBAN â€” single dept page (flat 4-column) â•â•â• */}
      {viewMode === 'kanban' && !!sourceFilter && (
        renderFlatKanban(filteredTasks, sourceFilter)
      )}

      {/* â•â•â• KANBAN â€” All Departments tab (horizontal, cross-dept drag) â•â•â• */}
      {viewMode === 'kanban' && !sourceFilter && (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
          {contextDeptOrder.map(src => {
            const cfg = SOURCE_CONFIG[src];
            const deptTasks = tasksByDept[src] ?? [];
            return (
              <div key={src} className="flex-none w-72 flex flex-col">
                {/* Dept column header */}
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-3 ${cfg.bg}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.color} shrink-0`} />
                  <span className={`text-sm font-black uppercase tracking-wide flex-1 ${cfg.textColor}`}>{cfg.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 ${cfg.textColor} shrink-0`}>
                    {deptTasks.length}
                  </span>
                </div>

                {/* Status sections stacked vertically inside each dept column */}
                <div className="space-y-2 flex-1">
                  {STATUS_ORDER.map(status => {
                    const statusTasks = deptTasks.filter(t => t.status === status);
                    return (
                      <div
                        key={status}
                        className="bg-slate-50 rounded-xl overflow-hidden"
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => { e.stopPropagation(); handleCardDrop(src, status); }}
                      >
                        <button
                          onClick={() => toggleStatus(`${src}-${status}`)}
                          className="w-full flex items-center justify-between px-3 py-2 border-b border-slate-100 hover:bg-white/60 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColorMap[status] ?? '#64748b' }} />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{status}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
                              {statusTasks.length}
                            </span>
                            {collapsedStatuses[`${src}-${status}`]
                              ? <ChevronRight size={11} className="text-slate-400" />
                              : <ChevronDown size={11} className="text-slate-400" />}
                          </div>
                        </button>
                        {!collapsedStatuses[`${src}-${status}`] && (
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
      )}


      {/* Create Task Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreateForm(); }} title="Create New Task" size="lg">
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
                    {INITIAL_CLIENTS.find(c => c.id === newClientId)?.businessName ?? 'Select a client…'}
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
                        {INITIAL_CLIENTS.filter(c => c.businessName.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setNewClientId(c.id); setClientDropdownOpen(false); setClientSearch(''); }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                              newClientId === c.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700'
                            }`}
                          >
                            {c.businessName}
                          </button>
                        ))}
                        {INITIAL_CLIENTS.filter(c => c.businessName.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-4">No clients found</p>
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

          {/* 5. Department */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Department *</label>
            <select
              value={newSource}
              onChange={e => {
                const src = e.target.value as TaskSource;
                setNewSource(src);
                // Reset status to first status of new department
                const deptName = SOURCE_TO_DEPT_NAME[src];
                const dept = departments.find(d => d.name === deptName);
                const sorted = (dept?.statuses ?? []).slice().sort((a, b) => a.statusOrder - b.statusOrder);
                setNewStatus(sorted[0]?.name ?? 'To Do');
              }}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              disabled={!!sourceFilter}
            >
              <option value="client-relations">Client Relations</option>
              <option value="compliance">Compliance</option>
              <option value="liaison">Liaison</option>
              <option value="om">Operations Manager</option>
              <option value="admin">Admin</option>
              <option value="accounting">Accounting</option>
              <option value="hr">Human Resources</option>
            </select>
          </div>

          {/* 6. Assignee — multi-select searchable dropdown */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assignee *</label>
            <div className="relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setAssigneeDropdownOpen(v => !v)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setAssigneeDropdownOpen(v => !v); }}
                className="w-full min-h-10 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-left flex items-center gap-2 flex-wrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e] hover:border-slate-300 transition-colors"
              >
                {newAssigneeIds.length === 0 ? (
                  <span className="text-slate-400 text-sm">Select assignees…</span>
                ) : (
                  newAssigneeIds.map(id => {
                    const m = ALL_TEAM_MEMBERS.find(x => x.id === id);
                    return m ? (
                      <span key={id} className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <span className="w-4 h-4 bg-teal-700 rounded-full text-[8px] font-black text-white flex items-center justify-center shrink-0">{m.avatar}</span>
                        {m.name.split(' ')[0]}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setNewAssigneeIds(prev => prev.filter(x => x !== id)); }}
                          className="ml-0.5 hover:text-teal-900 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ) : null;
                  })
                )}
                <ChevronDown size={15} className={`ml-auto shrink-0 text-slate-400 transition-transform ${assigneeDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
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
                      {ALL_TEAM_MEMBERS.filter(m =>
                        m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                        m.department.toLowerCase().includes(assigneeSearch.toLowerCase())
                      ).map(m => {
                        const selected = newAssigneeIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setNewAssigneeIds(prev =>
                              selected ? prev.filter(x => x !== m.id) : [...prev, m.id]
                            )}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors ${
                              selected ? 'bg-teal-50' : ''
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black text-white ${
                              selected ? 'bg-teal-700' : 'bg-slate-400'
                            }`}>
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
                      {ALL_TEAM_MEMBERS.filter(m => m.name.toLowerCase().includes(assigneeSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">No members found</p>
                      )}
                    </div>
                    {newAssigneeIds.length > 0 && (
                      <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">{newAssigneeIds.length} selected</span>
                        <button
                          type="button"
                          onClick={() => setNewAssigneeIds([])}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                        >
                          Clear all
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

          {/* 7. Tags */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tags (comma separated)</label>
            <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="e.g. BIR, Filing" />
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
