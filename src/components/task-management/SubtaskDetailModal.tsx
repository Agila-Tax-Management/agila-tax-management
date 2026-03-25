// src/components/task-management/SubtaskDetailModal.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/UI/button';
import {
  X, Calendar, User, Send, Clock, CheckSquare, Square, ChevronDown, Layers, MessageSquare, History,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { AOTaskSubtask, AOTeamMember } from '@/lib/types';

export type ActivityEntry = {
  id: string;
  kind: 'comment' | 'change';
  message: string;
  actorName: string;
  createdAt: string;
};

type SourceInfo = { label: string; bg: string; textColor: string };

interface DeptStatus {
  id: number;
  name: string;
  isEntryStep: boolean;
  isExitStep: boolean;
}

interface SubtaskDetailModalProps {
  subtask: AOTaskSubtask;
  parentTaskTitle: string;
  sourceInfo?: SourceInfo;
  teamMembers: AOTeamMember[];
  accentColor?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: AOTaskSubtask) => void;
  onDelete: (subtaskId: string) => void;
  /** Numeric parent-task ID — enables real API calls */
  taskId?: number;
  /** Dept statuses for resolving entry/exit step IDs on toggle */
  deptStatuses?: DeptStatus[];
  currentUser?: { id: string; name: string };
  /** Activity log entries — owned by the parent so they survive modal close/reopen */
  activityLog: ActivityEntry[];
  onAddActivity: (kind: ActivityEntry['kind'], message: string) => void;
}

export function SubtaskDetailModal({
  subtask,
  parentTaskTitle,
  sourceInfo,
  teamMembers,
  accentColor = '#0f766e',
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  taskId,
  deptStatuses,
  currentUser = { id: '', name: 'You' },
  activityLog,
  onAddActivity,
}: SubtaskDetailModalProps): React.ReactNode {
  const { error: toastError } = useToast();
  const [editing, setEditing] = useState<AOTaskSubtask>(subtask);
  const [newComment, setNewComment] = useState('');
  const [pendingNotes, setPendingNotes] = useState(subtask.notes ?? '');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset editing state when a *different* subtask is opened (id changes).
  // activityLog lives in the parent — not reset here.
  const [prevSubtaskId, setPrevSubtaskId] = useState(subtask.id);
  if (subtask.id !== prevSubtaskId) {
    setPrevSubtaskId(subtask.id);
    setEditing(subtask);
    setPendingNotes(subtask.notes ?? '');
    setNewComment('');
    setConfirmDelete(false);
  }

  if (!isOpen) return null;

  const assignee = teamMembers.find(m => m.id === editing.assigneeId);

  /** PATCH /api/tasks/:taskId/subtasks/:subtaskId */
  const patchSubtask = async (body: Record<string, unknown>): Promise<boolean> => {
    if (!taskId) return true;
    const res = await fetch(`/api/tasks/${taskId}/subtasks/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  };

  const handleToggleCompleted = async () => {
    const newCompleted = !editing.completed;
    if (taskId) {
      const exitStatus  = deptStatuses?.find(s => s.isExitStep);
      const entryStatus = deptStatuses?.find(s => s.isEntryStep);
      const statusId = newCompleted ? exitStatus?.id : entryStatus?.id;
      if (statusId !== undefined) {
        setIsSaving(true);
        const ok = await patchSubtask({ statusId });
        setIsSaving(false);
        if (!ok) { toastError('Failed to update subtask', 'Please try again.'); return; }
      }
    }
    onAddActivity('change', newCompleted ? 'Marked subtask as completed' : 'Marked subtask as to do');
    const updated = { ...editing, completed: newCompleted };
    setEditing(updated);
    onUpdate(updated);
  };

  const handleNotesSave = async (notes: string) => {
    if (notes === (editing.notes ?? '')) return;
    const updated = { ...editing, notes };
    setEditing(updated);
    onUpdate(updated);
    if (taskId) {
      setIsSaving(true);
      const ok = await patchSubtask({ description: notes });
      setIsSaving(false);
      if (!ok) { toastError('Failed to save notes', 'Please try again.'); return; }
    }
    onAddActivity('change', 'Updated notes');
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    setShowAssigneeDropdown(false);
    if (taskId) {
      setIsSaving(true);
      const ok = await patchSubtask({ assignedToId: Number(assigneeId) });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update assignee', 'Please try again.'); return; }
    }
    const newAssignee = teamMembers.find(m => m.id === assigneeId);
    const oldAssignee = teamMembers.find(m => m.id === editing.assigneeId);
    onAddActivity('change',
      `Changed assignee: ${oldAssignee?.name ?? 'Unassigned'} → ${newAssignee?.name ?? 'Unassigned'}`);
    const updated = { ...editing, assigneeId };
    setEditing(updated);
    onUpdate(updated);
  };

  const handleDueDateChange = async (dateValue: string) => {
    const iso = dateValue ? new Date(dateValue + 'T00:00:00').toISOString() : undefined;
    if (taskId) {
      setIsSaving(true);
      const ok = await patchSubtask({ dueDate: iso ?? null });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update due date', 'Please try again.'); return; }
    }
    const oldDate = editing.dueDate
      ? new Date(editing.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'none';
    const newDate = iso
      ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'none';
    onAddActivity('change', `Changed due date: ${oldDate} → ${newDate}`);
    const updated = { ...editing, dueDate: iso };
    setEditing(updated);
    onUpdate(updated);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const trimmed = newComment.trim();
    const message = `[${editing.title}] ${trimmed}`;
    if (taskId) {
      setIsSaving(true);
      // Post to parent task timeline
      const [convRes, histRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        }),
        // Persist comment to subtask history so it survives page refresh
        fetch(`/api/tasks/${taskId}/subtasks/${editing.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, kind: 'comment' }),
        }),
      ]);
      setIsSaving(false);
      if (!convRes.ok || !histRes.ok) { toastError('Failed to post comment', 'Please try again.'); return; }
    }
    onAddActivity('comment', newComment.trim());
    setNewComment('');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const isOverdue = !editing.completed && !!editing.dueDate && new Date(editing.dueDate) < new Date();

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => void handleToggleCompleted()}
              className="shrink-0 text-slate-400 hover:text-emerald-600 transition"
              aria-label={editing.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {editing.completed
                ? <CheckSquare size={20} className="text-emerald-500" />
                : <Square size={20} />}
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtask</p>
              <h2 className={`text-base font-bold truncate ${editing.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                {editing.title}
              </h2>
            </div>
            {sourceInfo && (
              <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${sourceInfo.bg} ${sourceInfo.textColor}`}>
                {sourceInfo.label}
              </span>
            )}
            {isSaving && (
              <span className="text-[10px] text-slate-400 font-medium animate-pulse ml-1">Saving…</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Details */}
          <div className="w-3/5 p-6 overflow-y-auto border-r border-slate-100">

            {/* Parent Task */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Parent Task</p>
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-slate-400 shrink-0" />
                <p className="text-sm font-bold text-slate-700">{parentTaskTitle}</p>
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
              <button
                onClick={() => void handleToggleCompleted()}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  editing.completed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {editing.completed
                  ? <CheckSquare size={13} className="text-emerald-500" />
                  : <Square size={13} />}
                {editing.completed ? 'Completed' : 'To Do'}
              </button>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</p>
              <textarea
                value={pendingNotes}
                onChange={e => setPendingNotes(e.target.value)}
                onBlur={e => void handleNotesSave(e.target.value)}
                rows={4}
                placeholder="Add notes or details for this subtask…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e] resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Assignee */}
            <div className="mb-6 relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignee</p>
              <button
                onClick={() => setShowAssigneeDropdown(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  <span className="text-[9px] font-bold text-white">{assignee?.avatar ?? '?'}</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{assignee?.name ?? 'Unassigned'}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showAssigneeDropdown && (
                <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-56">
                  {teamMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => void handleAssigneeChange(m.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition ${m.id === editing.assigneeId ? 'font-bold' : 'text-slate-700'}`}
                      style={m.id === editing.assigneeId ? { color: accentColor } : undefined}
                    >
                      <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-white">{m.avatar}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.department}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</p>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                {editing.dueDate ? (
                  <span className={`text-sm font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatDate(editing.dueDate)}
                    {isOverdue && ' (Overdue)'}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">No due date set</span>
                )}
              </div>
              <input
                type="date"
                value={editing.dueDate ? new Date(editing.dueDate).toISOString().split('T')[0] : ''}
                onChange={e => void handleDueDateChange(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              />
            </div>

            {/* Meta */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock size={10} /> Created {formatDateTime(editing.createdAt)}
              </p>
            </div>

            {/* Delete */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              {!confirmDelete ? (
                <Button variant="ghost" className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}>
                  Delete Subtask
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-bold">Are you sure?</span>
                  <Button variant="ghost" className="text-xs text-rose-600 hover:bg-rose-50 font-bold" onClick={() => { onDelete(editing.id); }}>
                    Yes, Delete
                  </Button>
                  <Button variant="ghost" className="text-xs" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Comments */}
          <div className="w-2/5 flex flex-col bg-slate-50">
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-slate-500" />
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">Comments</h3>
                </div>
                <div className="flex items-center gap-2">
                  {activityLog.filter(e => e.kind === 'comment').length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                      <MessageSquare size={9} /> {activityLog.filter(e => e.kind === 'comment').length}
                    </span>
                  )}
                  {activityLog.filter(e => e.kind === 'change').length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-600">
                      <History size={9} /> {activityLog.filter(e => e.kind === 'change').length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activityLog.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <MessageSquare size={28} className="text-slate-200" />
                  <p className="text-xs text-slate-400">No comments yet. Be the first!</p>
                </div>
              )}
              {activityLog.map(entry => {
                const initials = entry.actorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                if (entry.kind === 'comment') {
                  return (
                    <div key={entry.id} className="flex gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[9px] font-bold shadow-sm"
                        style={{ backgroundColor: accentColor }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-800">{entry.actorName}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-xl rounded-tl-sm px-3 py-2">
                          <p className="text-xs text-slate-700 leading-relaxed">{entry.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                // Change entry — compact changelog style
                return (
                  <div key={entry.id} className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <History size={12} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-[11px] text-slate-500 leading-snug">
                        <span className="font-bold text-slate-700">{entry.actorName}</span>
                        {' '}{entry.message}
                      </p>
                      <span className="text-[10px] text-slate-400">{formatDateTime(entry.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void handleAddComment())}
                  placeholder="Write a comment… (Enter to send)"
                  rows={2}
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-white resize-none leading-relaxed"
                />
                <Button
                  onClick={() => void handleAddComment()}
                  disabled={!newComment.trim() || isSaving}
                  className="text-white px-3 shrink-0 mb-0.5"
                  style={{ backgroundColor: accentColor }}
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
