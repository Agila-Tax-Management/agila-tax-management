'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
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

export function TaskDetailPage({ task, onUpdate }: TaskDetailPageProps) {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<AOTask>(task);
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const _getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName ?? 'Unknown';

  const getClientDetails = (clientId: string) => {
    return INITIAL_CLIENTS.find(c => c.id === clientId);
  };

  const getAssignee = (assigneeId: string) =>
    LIAISON_TEAM.find(m => m.id === assigneeId);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateStr));

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const updated = {
      ...editingTask,
      comments: [
        ...editingTask.comments,
        {
          id: `comment-${crypto.randomUUID()}`,
          authorId: 'lia-1',
          authorName: 'Current User',
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setEditingTask(updated);
    onUpdate(updated);
    setNewComment('');
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
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setEditingTask(updated);
    onUpdate(updated);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updated = {
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      ),
      updatedAt: new Date().toISOString(),
    };
    setEditingTask(updated);
    onUpdate(updated);
  };

  const assignee = getAssignee(editingTask.assigneeId);
  const clientDetails = getClientDetails(editingTask.clientId);

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-4xl px-4">
        {/* Back Button */}
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ChevronLeft size={16} /> Back
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-800 mb-2">{editingTask.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_CONFIG[editingTask.status].variant}>
              {editingTask.status}
            </Badge>
            <Badge variant={PRIORITY_CONFIG[editingTask.priority].variant}>
              {editingTask.priority}
            </Badge>
            {editingTask.tags.length > 0 && (
              <div className="flex gap-1">
                {editingTask.tags.map(tag => (
                  <Badge key={tag} variant="neutral">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="p-6 border-none shadow-sm">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Description</h3>
              <p className="text-slate-700 leading-relaxed">{editingTask.description}</p>
            </Card>

            {/* Subtasks */}
            <Card className="p-6 border-none shadow-sm">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Subtasks</h3>
              <div className="space-y-2 mb-4">
                {(editingTask.subtasks ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No subtasks yet. Add one to break down the task.</p>
                ) : (
                  (editingTask.subtasks ?? []).map(subtask => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleSubtask(subtask.id)}
                        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          subtask.completed
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {subtask.completed && <Check size={14} className="text-white" />}
                      </button>
                      <span
                        className={`flex-1 text-sm font-medium ${
                          subtask.completed ? 'line-through text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))
                )}
              </div>

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
            </Card>

            {/* Comments */}
            <Card className="p-6 border-none shadow-sm">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Comments</h3>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {editingTask.comments.length === 0 ? (
                  <p className="text-sm text-slate-500">No comments yet.</p>
                ) : (
                  editingTask.comments.map(comment => (
                    <div key={comment.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-700">{comment.authorName}</span>
                        <span className="text-xs text-slate-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  className="text-sm"
                />
                <Button onClick={handleAddComment}>
                  <Send size={14} />
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Task Info */}
            <Card className="p-4 border-none shadow-sm space-y-4">
              {/* Enhanced Client Card */}
              {clientDetails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Client</p>
                    <p className="text-sm font-bold text-slate-800">{clientDetails.businessName}</p>
                    <p className="text-xs text-slate-500">{clientDetails.companyCode}</p>
                  </div>
                  <div className="border-t border-blue-100 pt-2">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Authorized Representative</p>
                    <p className="text-sm font-medium text-slate-700">{clientDetails.authorizedRep}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex-1">
                      <p className="text-slate-500 mb-0.5">Email</p>
                      <p className="text-slate-700 font-medium break-all">{clientDetails.email}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-500 mb-0.5">Phone</p>
                      <p className="text-slate-700 font-medium">{clientDetails.phone}</p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Badge variant={clientDetails.status === 'Active' ? 'success' : 'neutral'} className="text-xs">
                      {clientDetails.status}
                    </Badge>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assigned To</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{assignee?.avatar ?? '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{assignee?.name ?? 'Unassigned'}</p>
                    {assignee && <p className="text-xs text-slate-500">{assignee.department}</p>}
                    {assignee && <p className="text-xs text-slate-500 truncate">{assignee.email}</p>}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Schedule</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Due Date:</span>
                    <span className="text-sm font-medium text-slate-700">
                      {new Intl.DateTimeFormat('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(editingTask.dueDate))}
                    </span>
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
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                  <div
                    className={`rounded-lg border border-slate-200 px-2
                    ${STATUS_SELECT_COLOR[editingTask.status]}`}
                  >
                    <select
                      value={editingTask.status}
                      onChange={e => {
                        const updated = { ...editingTask, status: e.target.value as AOTaskStatus };
                        setEditingTask(updated);
                        onUpdate(updated);
                      }}
                      className="w-full bg-transparent py-2 text-sm font-bold outline-none"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Priority
                </p>

                <div
                  className={`rounded-lg border border-slate-200 px-2
                  ${PRIORITY_SELECT_COLOR[editingTask.priority]}`}
                >
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
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Timeline</p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-600">Created:</span>
                    <span className="text-xs text-right text-slate-700 font-medium">{formatDate(editingTask.createdAt)}</span>
                  </div>
                  {editingTask.updatedAt && editingTask.updatedAt !== editingTask.createdAt && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-slate-600">Updated:</span>
                      <span className="text-xs text-right text-slate-700 font-medium">{formatDate(editingTask.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
