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
  Calendar, GripVertical, Tag, Filter,
} from 'lucide-react';
import { INITIAL_LIAISON_TASKS, LIAISON_TEAM } from '@/lib/mock-liaison-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTask, AOTaskStatus, AOTaskPriority } from '@/lib/types';

const STATUS_ORDER: AOTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const PRIORITY_OPTIONS: AOTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_CONFIG: Record<AOTaskStatus, { variant: 'neutral' | 'info' | 'warning' | 'success'; color: string; bg: string }> = {
  'To Do': { variant: 'neutral', color: 'bg-slate-500', bg: 'bg-slate-50' },
  'In Progress': { variant: 'info', color: 'bg-blue-500', bg: 'bg-blue-50' },
  'Review': { variant: 'warning', color: 'bg-amber-500', bg: 'bg-amber-50' },
  'Done': { variant: 'success', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
};

const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low: { variant: 'neutral' },
  Medium: { variant: 'info' },
  High: { variant: 'warning' },
  Urgent: { variant: 'danger' },
};

type ViewMode = 'list' | 'kanban';

export function LiaisonTaskBoard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<AOTask[]>(INITIAL_LIAISON_TASKS);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AOTaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<AOTaskPriority | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClientId, setNewClientId] = useState(INITIAL_CLIENTS[0]?.id ?? '');
  const [newAssigneeId, setNewAssigneeId] = useState(LIAISON_TEAM[0]?.id ?? '');
  const [newPriority, setNewPriority] = useState<AOTaskPriority>('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTags, setNewTags] = useState('');

  const getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName ?? 'Unknown';

  const getAssignee = (assigneeId: string) =>
    LIAISON_TEAM.find(m => m.id === assigneeId);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = search === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        getClientName(t.clientId).toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, filterStatus, filterPriority]);

  const handleCreateTask = () => {
    if (!newTitle.trim() || !newDueDate) return;
    const task: AOTask = {
      id: `lia-task-${crypto.randomUUID()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      status: 'To Do',
      priority: newPriority,
      clientId: newClientId,
      assigneeId: newAssigneeId,
      dueDate: newDueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    setTasks(prev => [task, ...prev]);
    resetCreateForm();
    setIsCreateModalOpen(false);
  };

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewClientId(INITIAL_CLIENTS[0]?.id ?? '');
    setNewAssigneeId(LIAISON_TEAM[0]?.id ?? '');
    setNewPriority('Medium');
    setNewDueDate('');
    setNewTags('');
  };

  const handleDrop = (targetStatus: AOTaskStatus) => {
    if (!draggedTaskId) return;
    setTasks(prev => prev.map(t =>
      t.id === draggedTaskId ? { ...t, status: targetStatus, updatedAt: new Date().toISOString() } : t
    ));
    setDraggedTaskId(null);
  };

  const isOverdue = (t: AOTask) => t.status !== 'Done' && new Date(t.dueDate) < new Date('2026-03-11');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Task Board</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and track liaison tasks assigned by AO and Compliance.</p>
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
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setIsCreateModalOpen(true)}>
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
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as AOTaskPriority | 'all')}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
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
              const assignee = getAssignee(task.assigneeId);
              const overdue = isOverdue(task);
              return (
                <div
                  key={task.id}
                  onClick={() => router.push(`/portal/liaison/tasks/${task.id}`)}
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
                  <span className="text-xs text-slate-600 font-medium truncate">{getClientName(task.clientId)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-white">{assignee?.avatar ?? '?'}</span>
                    </div>
                    <span className="text-xs text-slate-600 truncate">{assignee?.name.split(' ')[0] ?? 'N/A'}</span>
                  </div>
                  <Badge variant={STATUS_CONFIG[task.status].variant} className="text-[9px] w-fit">
                    {task.status}
                  </Badge>
                  <span className={`text-xs font-bold flex items-center gap-1 ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>
                    <Calendar size={12} /> {formatDate(task.dueDate)}
                  </span>
                  <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[9px] w-fit">
                    {task.priority}
                  </Badge>
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
                onDrop={() => handleDrop(status)}
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
                    const assignee = getAssignee(task.assigneeId);
                    const overdue = isOverdue(task);
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onClick={() => router.push(`/portal/liaison/tasks/${task.id}`)}
                        className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md cursor-pointer transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-bold text-slate-800 line-clamp-2 flex-1">{task.title}</p>
                          <GripVertical size={14} className="text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5 ml-1" />
                        </div>
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
                            <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
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
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}


      {/* Create Task Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreateForm(); }} title="Create New Task" size="lg">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Title *</label>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. BIR Filing Run at RDO 044" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Task description..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Client *</label>
              <select
                value={newClientId}
                onChange={e => setNewClientId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {INITIAL_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assignee *</label>
              <select
                value={newAssigneeId}
                onChange={e => setNewAssigneeId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {LIAISON_TEAM.map(m => <option key={m.id} value={m.id}>{m.name} ({m.department})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Priority</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as AOTaskPriority)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Due Date *</label>
              <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tags (comma separated)</label>
            <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="e.g. BIR, Filing, On-Site" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
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
