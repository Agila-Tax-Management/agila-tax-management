'use client';

import React from 'react';
import { Badge } from '@/components/UI/Badge';
import { X, Calendar } from 'lucide-react';
import { LIAISON_TEAM } from '@/lib/mock-liaison-data';
import type { AOTask, AOTaskStatus, AOTaskPriority } from '@/lib/types';

const STATUS_OPTIONS: AOTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

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

interface SubtaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: AOTask;
  assignee: (typeof LIAISON_TEAM)[number] | undefined;
  selectedSubtaskId: string | null;
  onAssignSubtask: (subtaskId: string, assigneeId: string) => void;
  onUpdate: (updated: AOTask) => void;
  statusOptions: AOTaskStatus[];
  priorityOptions: AOTaskPriority[];
  statusSelectColor: Record<AOTaskStatus, string>;
  prioritySelectColor: Record<AOTaskPriority, string>;
}

export function SubtaskDetailsModal({
  isOpen,
  onClose,
  task,
  assignee,
  selectedSubtaskId,
  onAssignSubtask,
  onUpdate,
  statusOptions,
  priorityOptions,
  statusSelectColor,
  prioritySelectColor,
}: SubtaskDetailsModalProps): React.ReactNode {
  const selectedSubtask = (task.subtasks ?? []).find(subtask => subtask.id === selectedSubtaskId);

  const selectedAssignee = selectedSubtask?.assigneeId
    ? LIAISON_TEAM.find(member => member.id === selectedSubtask.assigneeId)
    : assignee;

  const formattedDueDate = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(task.dueDate));

  const dueBadge = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
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
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Subtask Details</p>
            <h3 className="text-2xl font-black text-slate-800">
              {selectedSubtask?.title ?? 'Subtask and Assignment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-8">
          <section>
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Details</p>
            {selectedSubtask ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-700">
                  {selectedSubtask.completed ? 'This subtask is completed.' : 'This subtask is pending.'}
                </p>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Select a subtask first.</p>
            )}
          </section>

          <section>
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Assignee</p>
            {selectedSubtask ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600">
                    <span className="text-xs font-bold text-white">{selectedAssignee?.avatar ?? '?'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{selectedAssignee?.name ?? 'Unassigned'}</p>
                    {selectedAssignee && <p className="text-xs text-slate-500">{selectedAssignee.department}</p>}
                    {selectedAssignee && <p className="truncate text-xs text-slate-500">{selectedAssignee.email}</p>}
                  </div>
                </div>

                <select
                  value={selectedSubtask.assigneeId ?? ''}
                  onChange={event => onAssignSubtask(selectedSubtask.id, event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select assignee</option>
                  {LIAISON_TEAM.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.department}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Select a subtask first.</p>
            )}
          </section>

          <section>
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Schedule</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" />
                <input
                  type="date"
                  value={new Date(task.dueDate).toISOString().split('T')[0]}
                  onChange={e => {
                    const updated = { ...task, dueDate: new Date(e.target.value).toISOString() };
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
                  <div className={`rounded-lg border border-slate-200 px-2 ${statusSelectColor[task.status]}`}>
                    <select
                      value={task.status}
                      onChange={e => {
                        const updated = { ...task, status: e.target.value as AOTaskStatus };
                        onUpdate(updated);
                      }}
                      className="w-full bg-transparent py-2 text-sm font-bold outline-none"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Priority</p>
                  <div className={`rounded-lg border border-slate-200 px-2 ${prioritySelectColor[task.priority]}`}>
                    <select
                      value={task.priority}
                      onChange={e => {
                        const updated = {
                          ...task,
                          priority: e.target.value as AOTaskPriority,
                        };
                        onUpdate(updated);
                      }}
                      className="w-full bg-transparent py-2 text-sm font-bold outline-none"
                    >
                      {priorityOptions.map(priority => (
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
        </div>
      </div>
    </div>
  );
}
