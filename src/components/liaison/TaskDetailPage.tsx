'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { SubtaskDetailsModal } from './SubtaskDetailsModal';
import {
  ChevronLeft, Send, Check, Plus,
} from 'lucide-react';
import { LIAISON_TEAM } from '@/lib/mock-liaison-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTask, AOTaskStatus, AOTaskPriority } from '@/lib/types';

const STATUS_OPTIONS: AOTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const PRIORITY_OPTIONS: AOTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_CONFIG: Record<AOTaskStatus, { variant: 'neutral' | 'info' | 'warning' | 'success'; color: string }> = {
  'To Do': { variant: 'neutral', color: 'bg-slate-500' },
  'In Progress': { variant: 'info', color: 'bg-blue-500' },
  'Review': { variant: 'warning', color: 'bg-amber-500' },
  'Done': { variant: 'success', color: 'bg-emerald-500' },
};

const STATUS_SELECT_COLOR: Record<AOTaskStatus, string> = {
  'To Do': 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Review': 'bg-amber-100 text-amber-700',
  'Done': 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_SELECT_COLOR: Record<AOTaskPriority, string> = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-amber-100 text-amber-700',
  Urgent: 'bg-red-100 text-red-700',
};

const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low: { variant: 'neutral' },
  Medium: { variant: 'info' },
  High: { variant: 'warning' },
  Urgent: { variant: 'danger' },
};

interface TaskDetailPageProps {
  task: AOTask;
  onUpdate: (updated: AOTask) => void;
}

export function TaskDetailPage({ task, onUpdate }: TaskDetailPageProps): React.ReactNode {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<AOTask>(task);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);

  const _getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName ?? 'Unknown';

  const getAssignee = (assigneeId: string) => LIAISON_TEAM.find(m => m.id === assigneeId);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateStr));

  const formattedDueDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(editingTask.dueDate)),
    [editingTask.dueDate]
  );

  const dueBadge = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(editingTask.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { variant: 'danger' as const, text: `Overdue by ${Math.abs(daysRemaining)} days` };
    }

    if (daysRemaining <= 3) {
      return {
        variant: 'warning' as const,
        text: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left - Urgent`,
      };
    }

    return { variant: 'success' as const, text: `${daysRemaining} days left` };
  }, [editingTask.dueDate]);

  const handleAddDiscussion = () => {
    if (!newDiscussion.trim()) return;

    const updated = {
      ...editingTask,
      comments: [
        ...editingTask.comments,
        {
          id: `comment-${crypto.randomUUID()}`,
          authorId: 'lia-1',
          authorName: 'Current User',
          content: newDiscussion.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    setEditingTask(updated);
    onUpdate(updated);
    setNewDiscussion('');
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const updated = {
      ...editingTask,
      subtasks: [
        ...(editingTask.subtasks ?? []),
        {
          id: `sub-${crypto.randomUUID()}`,
          title: newSubtaskTitle.trim(),
          completed: false,
          assigneeId: editingTask.assigneeId,
          dueDate: editingTask.dueDate,
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    setEditingTask(updated);
    onUpdate(updated);
    setNewSubtaskTitle('');
  };

  const handleAssignSubtask = (subtaskId: string, assigneeId: string) => {
    const updated = {
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).map(subtask =>
        subtask.id === subtaskId ? { ...subtask, assigneeId } : subtask
      ),
      updatedAt: new Date().toISOString(),
    };

    setEditingTask(updated);
    onUpdate(updated);
  };

  const handleUpdateSubtaskDueDate = (subtaskId: string, dueDate: string) => {
    const updated = {
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).map(subtask =>
        subtask.id === subtaskId ? { ...subtask, dueDate } : subtask
      ),
      updatedAt: new Date().toISOString(),
    };

    setEditingTask(updated);
    onUpdate(updated);
  };

  const clientDetails = getClientDetails(editingTask.clientId);
  const assignee = getAssignee(editingTask.assigneeId);
  const completedSubtasks = (editingTask.subtasks ?? []).filter(s => s.completed).length;
  const totalSubtasks = (editingTask.subtasks ?? []).length;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <SubtaskDetailsModal
        isOpen={isSubtaskModalOpen}
        onClose={() => setIsSubtaskModalOpen(false)}
        task={editingTask}
        assignee={assignee}
        selectedSubtaskId={selectedSubtaskId}
        onAssignSubtask={handleAssignSubtask}
        onUpdate={onUpdate}
        statusOptions={STATUS_OPTIONS}
        priorityOptions={PRIORITY_OPTIONS}
        statusSelectColor={STATUS_SELECT_COLOR}
        prioritySelectColor={PRIORITY_SELECT_COLOR}
      />

      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ChevronLeft size={16} /> Back
        </Button>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <section>
              <h1 className="mb-2 text-3xl font-black text-slate-800">{editingTask.title}</h1>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_CONFIG[editingTask.status].variant}>{editingTask.status}</Badge>
                <Badge variant={PRIORITY_CONFIG[editingTask.priority].variant}>{editingTask.priority}</Badge>
              </div>

              <p className="text-sm leading-relaxed text-slate-700">{editingTask.description}</p>
            </section>

            <section>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-600">
                    Task Progress
                  </p>
                  <p className="text-xs font-bold text-slate-600">
                    {`${totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0}% Complete`}
                  </p>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-violet-500 to-violet-600 transition-all duration-300"
                    style={{
                      width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Client Details</p>
              {clientDetails ? (
                <div className="space-y-2">
                  <p className="text-base font-bold text-slate-800">{clientDetails.businessName}</p>
                  <p className="text-sm text-slate-500">{clientDetails.companyCode}</p>
                  <p className="text-sm text-slate-700">Authorized Representative: {clientDetails.authorizedRep}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span>{clientDetails.email}</span>
                    <a href={`tel:${clientDetails.phone}`} className="hover:underline">
                      {clientDetails.phone}
                    </a>
                  </div>
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDate = new Date(editingTask.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysRemaining < 0;
                    const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;
                    
                    let badgeVariant: 'neutral' | 'info' | 'success' | 'warning' | 'danger' = 'success';
                    let daysText = `${daysRemaining} days left`;
                    if (isOverdue) {
                      badgeVariant = 'danger';
                      daysText = `Overdue by ${Math.abs(daysRemaining)} days`;
                    } else if (isUrgent) {
                      badgeVariant = 'warning';
                      daysText = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left - Urgent`;
                    }
                    
                    return (
                      <Badge variant={badgeVariant} className="text-xs self-start">
                        {daysText}
                      </Badge>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Client information is unavailable.</p>
              )}
            </section>

            <section>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Schedule</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-500" />
                  <input
                    type="date"
                    value={new Date(editingTask.dueDate).toISOString().split('T')[0]}
                    onChange={e => {
                      const updated = { ...editingTask, dueDate: new Date(e.target.value).toISOString() };
                      setEditingTask(updated);
                      onUpdate(updated);
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <Badge variant={dueBadge.variant} className="text-xs">
                  {dueBadge.text}
                </Badge>

                <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                    <div className={`rounded-lg border border-slate-200 px-2 ${STATUS_SELECT_COLOR[editingTask.status]}`}>
                      <select
                        value={editingTask.status}
                        onChange={e => {
                          const updated = { ...editingTask, status: e.target.value as AOTaskStatus };
                          setEditingTask(updated);
                          onUpdate(updated);
                        }}
                        className="w-full bg-transparent py-2 text-sm font-bold outline-none"
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Priority</p>
                    <div className={`rounded-lg border border-slate-200 px-2 ${PRIORITY_SELECT_COLOR[editingTask.priority]}`}>
                      <select
                        value={editingTask.priority}
                        onChange={e => {
                          const updated = {
                            ...editingTask,
                            priority: e.target.value as AOTaskPriority,
                          };
                          setEditingTask(updated);
                          onUpdate(updated);
                        }}
                        className="w-full bg-transparent py-2 text-sm font-bold outline-none"
                      >
                        {PRIORITY_OPTIONS.map(priority => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Subtask and Assigned</p>
              <div className="w-full space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a new subtask..."
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                    className="text-sm"
                  />
                  <Button onClick={handleAddSubtask}>
                    <Plus size={14} />
                  </Button>
                </div>

                {totalSubtasks === 0 ? (
                  <p className="text-sm text-slate-500">No subtasks yet. Create one then click it to open details.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-600">Subtask</p>
                          </th>
                          <th className="px-4 py-3 text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-600">Due Date</p>
                          </th>
                          <th className="px-4 py-3 text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-600">Status</p>
                          </th>
                          <th className="px-4 py-3 text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-600">Assignee</p>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editingTask.subtasks ?? []).map((subtask, index) => {
                          const subtaskAssignee = subtask.assigneeId
                            ? LIAISON_TEAM.find(m => m.id === subtask.assigneeId)
                            : assignee;
                          const subtaskDueDate = subtask.dueDate ?? editingTask.dueDate;
                          const formattedSubtaskDueDate = new Intl.DateTimeFormat('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(subtaskDueDate));
                          return (
                            <tr
                              key={subtask.id}
                              className="border-b border-slate-100 transition hover:bg-slate-50"
                            >
                              <td className="px-4 py-3">
                                <p
                                  className={`text-sm font-bold cursor-pointer hover:text-violet-600 ${
                                    subtask.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                                  }`}
                                  onClick={() => {
                                    setSelectedSubtaskId(subtask.id);
                                    setIsSubtaskModalOpen(true);
                                  }}
                                >
                                  {subtask.title}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="date"
                                  value={new Date(subtaskDueDate).toISOString().split('T')[0]}
                                  onChange={e => handleUpdateSubtaskDueDate(subtask.id, new Date(e.target.value).toISOString())}
                                  onClick={e => e.stopPropagation()}
                                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={subtask.completed ? 'success' : 'warning'}>
                                  {subtask.completed ? 'Completed' : 'Pending'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-slate-700">{subtaskAssignee?.name ?? 'Unassigned'}</p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalSubtasks > 0 && (
                  <p className="text-xs text-slate-500">
                    {completedSubtasks}/{totalSubtasks} subtasks completed
                  </p>
                )}
              </div>
            </section>
          </div>

          <aside className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Discussion</h3>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-slate-50">
              {editingTask.comments.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">No discussion yet. Start the conversation.</p>
              ) : (
                editingTask.comments.map(comment => {
                  const isCurrentUser = comment.authorName === 'Current User';
                  return (
                    <div
                      key={comment.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-xl p-3 ${
                          isCurrentUser
                            ? 'bg-violet-600 text-white'
                            : 'border border-slate-100 bg-white'
                        }`}
                      >
                        {!isCurrentUser && (
                          <div className="mb-1.5 flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600">
                              <span className="text-[9px] font-bold text-white">
                                {comment.authorName
                                  .split(' ')
                                  .map(name => name[0])
                                  .join('')
                                  .slice(0, 2)}
                              </span>
                            </div>
                            <span className={`text-xs font-bold ${isCurrentUser ? 'text-white' : 'text-slate-800'}`}>
                              {comment.authorName}
                            </span>
                          </div>
                        )}
                        <p className={`text-xs leading-relaxed ${isCurrentUser ? 'text-white' : 'text-slate-600'}`}>
                          {comment.content}
                        </p>
                        <span className={`mt-1 block text-[10px] ${isCurrentUser ? 'text-violet-200' : 'text-slate-400'}`}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add to discussion..."
                  value={newDiscussion}
                  onChange={e => setNewDiscussion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddDiscussion()}
                  className="text-sm"
                />
                <Button onClick={handleAddDiscussion} disabled={!newDiscussion.trim()}>
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
