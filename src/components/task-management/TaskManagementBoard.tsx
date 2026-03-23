// src/components/task-management/TaskManagementBoard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { TaskDetailModal } from './TaskDetailModal';
import {
  Search, Plus, LayoutList, Columns3,
  Calendar, GripVertical, Tag, Filter, ChevronDown, ChevronRight,
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
};

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
type DeptSource = TaskSource;

const DEPT_SOURCES_DEFAULT: DeptSource[] = ['om', 'client-relations', 'liaison', 'compliance'];

interface TaskManagementBoardProps {
  sourceFilter?: TaskSource;
}

export function TaskManagementBoard({ sourceFilter }: TaskManagementBoardProps) {
  const { departments } = useTaskDepartments();
  const [tasks, setTasks]             = useState<UnifiedTask[]>(ALL_TASKS);
  const [viewMode, setViewMode]       = useState<ViewMode>('kanban');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus]     = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<AOTaskPriority | 'all'>('all');
  const [filterSource, setFilterSource]     = useState<TaskSource | 'all'>(sourceFilter ?? 'all');
  const [selectedTask, setSelectedTask]     = useState<UnifiedTask | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Dept order — drag-reorderable (all 4 departments including OM)
  const [deptOrder, setDeptOrder] = useState<DeptSource[]>(DEPT_SOURCES_DEFAULT);
  const [draggingDept, setDraggingDept] = useState<DeptSource | null>(null);
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
  const [newAssigneeId, setNewAssigneeId] = useState(ALL_TEAM_MEMBERS[0]?.id ?? '');
  const [newPriority, setNewPriority]     = useState<AOTaskPriority>('Medium');
  const [newDueDate, setNewDueDate]       = useState('');
  const [newTags, setNewTags]             = useState('');
  const [newSource, setNewSource]         = useState<TaskSource>(sourceFilter ?? 'client-relations');

  // ─── Dynamic statuses from WorkflowSettings (via TaskDepartmentsContext) ───
  const dynamicStatuses = useMemo(() => {
    if (departments.length === 0) {
      return [
        { id: -1, name: 'To Do',       color: '#64748b', statusOrder: 1, isEntryStep: true,  isExitStep: false },
        { id: -2, name: 'In Progress', color: '#3b82f6', statusOrder: 2, isEntryStep: false, isExitStep: false },
        { id: -3, name: 'Review',      color: '#ca8a04', statusOrder: 3, isEntryStep: false, isExitStep: false },
        { id: -4, name: 'Done',        color: '#16a34a', statusOrder: 4, isEntryStep: false, isExitStep: true  },
      ];
    }
    if (sourceFilter) {
      const deptName = SOURCE_TO_DEPT_NAME[sourceFilter];
      const dept = departments.find(d => d.name === deptName);
      return (dept?.statuses ?? []).slice().sort((a, b) => a.statusOrder - b.statusOrder);
    }
    // All-tasks view: union of unique status names across all depts (first-seen order)
    const seen = new Set<string>();
    const result: typeof departments[0]['statuses'] = [];
    for (const dept of departments) {
      for (const st of dept.statuses.slice().sort((a, b) => a.statusOrder - b.statusOrder)) {
        if (!seen.has(st.name)) { seen.add(st.name); result.push(st); }
      }
    }
    return result;
  }, [departments, sourceFilter]);

  const STATUS_ORDER: string[] = useMemo(() => dynamicStatuses.map(s => s.name), [dynamicStatuses]);
  const statusColorMap: Record<string, string> = useMemo(
    () => Object.fromEntries(dynamicStatuses.map(s => [s.name, s.color ?? '#64748b'])),
    [dynamicStatuses]
  );

  const getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName ?? 'Unknown';
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

  const tasksByDept = useMemo(() => {
    const srcs: TaskSource[] = [...deptOrder, 'om'];
    return Object.fromEntries(
      srcs.map(src => [src, filteredTasks.filter(t => t.source === src)])
    ) as Record<TaskSource, UnifiedTask[]>;
  }, [filteredTasks, deptOrder]);

  // â”€â”€â”€ CRUD â”€â”€â”€
  const handleUpdateTask = (updated: UnifiedTask) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };
  const handleCreateTask = () => {
    if (!newTitle.trim() || !newDueDate) return;
    const task: UnifiedTask = {
      id: `task-${crypto.randomUUID()}`,
      title: newTitle.trim(), description: newDescription.trim(),
      status: 'To Do', priority: newPriority,
      clientId: newClientId, assigneeId: newAssigneeId,
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
    setNewAssigneeId(ALL_TEAM_MEMBERS[0]?.id ?? '');
    setNewPriority('Medium'); setNewDueDate(''); setNewTags('');
    setNewSource(sourceFilter ?? 'client-relations');
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

  /** Reorder dept columns in the horizontal kanban */
  const handleDeptColumnDrop = (targetSrc: DeptSource) => {
    if (!draggingDept || draggingDept === targetSrc) { setDraggingDept(null); return; }
    setDeptOrder(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggingDept);
      const toIdx   = next.indexOf(targetSrc);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggingDept);
      return next;
    });
    setDraggingDept(null);
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
        onClick={() => setSelectedTask(task)}
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
        onDragStart={e => { e.stopPropagation(); setDraggingDept(null); setDraggedTaskId(task.id); }}
        onDragEnd={() => setDraggedTaskId(null)}
        onClick={() => setSelectedTask(task)}
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
  const renderListSection = (src: TaskSource, allowDrag: boolean) => {
    const cfg = SOURCE_CONFIG[src];
    const deptTasks = tasksByDept[src] ?? [];
    const isCollapsed = !!collapsedDepts[src];
    const activeDeptTasks = deptTasks.filter(t => t.status !== 'Done').length;
    return (
      <Card key={src} className={`border-none shadow-sm overflow-hidden transition-opacity ${draggingDept === src ? 'opacity-40' : ''}`}>
        {/* Dept header */}
        <div
          draggable={allowDrag}
          onDragStart={() => { if (allowDrag) { setDraggingDept(src as DeptSource); setDraggedTaskId(null); } }}
          onDragEnd={() => setDraggingDept(null)}
          onDragOver={e => { if (allowDrag) e.preventDefault(); }}
          onDrop={() => { if (allowDrag && draggingDept) handleDeptColumnDrop(src as DeptSource); }}
          className={`flex items-center justify-between px-5 py-3.5 ${cfg.bg} ${allowDrag ? 'cursor-grab active:cursor-grabbing' : ''} transition-all`}
        >
          <div className="flex items-center gap-3">
            {allowDrag && <GripVertical size={15} className={`${cfg.textColor} opacity-50`} />}
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
          <Button className="bg-[#0f766e] hover:bg-[#0d6560] text-white" onClick={() => setIsCreateModalOpen(true)}>
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
          {(sourceFilter ? [sourceFilter] : deptOrder).map(src =>
            renderListSection(src, !sourceFilter)
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
          {deptOrder.map(src => {
            const cfg = SOURCE_CONFIG[src];
            const deptTasks = tasksByDept[src] ?? [];
            const isDragging = draggingDept === src;
            return (
              <div
                key={src}
                className={`flex-none w-72 flex flex-col transition-opacity duration-150 ${isDragging ? 'opacity-40' : ''}`}
                onDragOver={e => { if (draggingDept) e.preventDefault(); }}
                onDrop={() => { if (draggingDept) handleDeptColumnDrop(src); }}
              >
                {/* Dept column header â€” grab to reorder */}
                <div
                  draggable
                  onDragStart={e => { e.stopPropagation(); setDraggingDept(src); setDraggedTaskId(null); }}
                  onDragEnd={() => setDraggingDept(null)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-3 cursor-grab active:cursor-grabbing select-none ${cfg.bg}`}
                >
                  <GripVertical size={14} className={`${cfg.textColor} opacity-60 shrink-0`} />
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

      {/* â•â•â• KANBAN â€” OM tab (flat 4-column) â•â•â• */}
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreateForm(); }} title="Create New Task" size="lg">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Title *</label>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. BIR 2551Q Filing" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Task description..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f766e] min-h-20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Client *</label>
              <select
                value={newClientId}
                onChange={e => setNewClientId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                {INITIAL_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Department *</label>
              <select
                value={newSource}
                onChange={e => setNewSource(e.target.value as TaskSource)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                disabled={!!sourceFilter}
              >
                <option value="client-relations">Client Relations</option>
                <option value="compliance">Compliance</option>
                <option value="liaison">Liaison</option>
                <option value="om">Operations Manager</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assignee *</label>
              <select
                value={newAssigneeId}
                onChange={e => setNewAssigneeId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                {ALL_TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.department})</option>)}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Due Date *</label>
              <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tags (comma separated)</label>
              <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="e.g. BIR, Filing" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#0f766e] hover:bg-[#0d6560] text-white"
              onClick={handleCreateTask}
              disabled={!newTitle.trim() || !newDueDate}
            >
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
