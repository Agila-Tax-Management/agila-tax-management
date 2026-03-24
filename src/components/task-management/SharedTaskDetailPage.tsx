// src/components/task-management/SharedTaskDetailPage.tsx
'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, Tag, Send, Clock,
  ChevronDown, Check, Plus, ChevronRight,
} from 'lucide-react';
import { SubtaskDetailModal } from './SubtaskDetailModal';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTask, AOTaskStatus, AOTaskPriority, AOTaskComment, AOTaskSubtask, AOTeamMember } from '@/lib/types';

export interface SourceInfo {
  label: string;
  bg: string;
  textColor: string;
  color: string;
}

export interface SharedTaskDetailPageProps {
  task: AOTask;
  teamMembers: AOTeamMember[];
  currentUser: { id: string; name: string };
  accentColor: string;
  sourceInfo?: SourceInfo;
  onUpdate?: (updated: AOTask) => void;
}

const STATUS_OPTIONS: AOTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const PRIORITY_OPTIONS: AOTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_CONFIG: Record<AOTaskStatus, { variant: 'neutral' | 'info' | 'warning' | 'success'; color: string }> = {
  'To Do':       { variant: 'neutral', color: 'bg-slate-500'   },
  'In Progress': { variant: 'info',    color: 'bg-blue-500'    },
  'Review':      { variant: 'warning', color: 'bg-amber-500'   },
  'Done':        { variant: 'success', color: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low:    { variant: 'neutral' },
  Medium: { variant: 'info'    },
  High:   { variant: 'warning' },
  Urgent: { variant: 'danger'  },
};

export function SharedTaskDetailPage({
  task: initialTask,
  teamMembers,
  currentUser,
  accentColor,
  sourceInfo,
  onUpdate,
}: SharedTaskDetailPageProps): React.ReactNode {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<AOTask>(initialTask);
  const [newComment, setNewComment] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const clientName = INITIAL_CLIENTS.find(c => c.id === editingTask.clientId)?.businessName ?? 'Unknown';
  const assignee   = teamMembers.find(m => m.id === editingTask.assigneeId);
  const isOverdue  = editingTask.status !== 'Done' && new Date(editingTask.dueDate) < new Date();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const update = (next: AOTask) => { setEditingTask(next); onUpdate?.(next); };

  const handleStatusChange = (status: AOTaskStatus) => {
    update({ ...editingTask, status, updatedAt: new Date().toISOString() });
    setShowStatusDropdown(false);
  };
  const handlePriorityChange = (priority: AOTaskPriority) => {
    update({ ...editingTask, priority, updatedAt: new Date().toISOString() });
    setShowPriorityDropdown(false);
  };
  const handleAssigneeChange = (assigneeId: string) => {
    update({ ...editingTask, assigneeId, updatedAt: new Date().toISOString() });
    setShowAssigneeDropdown(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: AOTaskComment = {
      id: `c-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    update({
      ...editingTask,
      comments: [...editingTask.comments, comment],
      updatedAt: new Date().toISOString(),
    });
    setNewComment('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    update({
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateSubtask = (updated: AOTaskSubtask) => {
    update({
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).map(s => s.id === updated.id ? updated : s),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    update({
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).filter(s => s.id !== subtaskId),
      updatedAt: new Date().toISOString(),
    });
    setIsSubtaskModalOpen(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const subtask: AOTaskSubtask = {
      id: `st-${crypto.randomUUID()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      comments: [],
    };
    update({
      ...editingTask,
      subtasks: [...(editingTask.subtasks ?? []), subtask],
      updatedAt: new Date().toISOString(),
    });
    setNewSubtaskTitle('');
  };

  const selectedSubtask = (editingTask.subtasks ?? []).find(s => s.id === selectedSubtaskId);

  return (
    <>
      <div className="animate-in fade-in duration-500 pb-20">

        {/* Back nav + title */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-6 py-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ArrowLeft size={15} /> Back to Tasks
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_CONFIG[editingTask.status].color}`} />
            <h1 className="text-xl font-black text-slate-900 truncate">{editingTask.title}</h1>
            {sourceInfo && (
              <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${sourceInfo.bg} ${sourceInfo.textColor}`}>
                {sourceInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex gap-6 items-start">

          {/* Left: Details */}
          <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">

            {/* Client */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client</p>
              <p className="text-sm font-bold text-slate-800">{clientName}</p>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {editingTask.description || <span className="italic text-slate-400">No description.</span>}
              </p>
            </div>

            {/* Department badge — only when sourceInfo is provided */}
            {sourceInfo && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Department</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${sourceInfo.bg} ${sourceInfo.textColor}`}>
                  <div className={`w-2 h-2 rounded-full ${sourceInfo.color}`} />
                  {sourceInfo.label}
                </span>
              </div>
            )}

            {/* Status */}
            <div className="relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
              <button
                onClick={() => { setShowStatusDropdown(v => !v); setShowPriorityDropdown(false); setShowAssigneeDropdown(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[editingTask.status].color}`} />
                <span className="text-sm font-bold text-slate-700">{editingTask.status}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showStatusDropdown && (
                <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-44">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition ${s === editingTask.status ? 'font-bold' : 'text-slate-700'}`}
                      style={s === editingTask.status ? { color: accentColor } : undefined}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[s].color}`} />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</p>
              <button
                onClick={() => { setShowPriorityDropdown(v => !v); setShowStatusDropdown(false); setShowAssigneeDropdown(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <Badge variant={PRIORITY_CONFIG[editingTask.priority].variant} className="text-[10px]">{editingTask.priority}</Badge>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showPriorityDropdown && (
                <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-44">
                  {PRIORITY_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => handlePriorityChange(p)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition ${p === editingTask.priority ? 'font-bold' : ''}`}
                    >
                      <Badge variant={PRIORITY_CONFIG[p].variant} className="text-[10px]">{p}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assignee */}
            <div className="relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignee</p>
              <button
                onClick={() => { setShowAssigneeDropdown(v => !v); setShowStatusDropdown(false); setShowPriorityDropdown(false); }}
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
                      onClick={() => handleAssigneeChange(m.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition ${m.id === editingTask.assigneeId ? 'font-bold' : 'text-slate-700'}`}
                      style={m.id === editingTask.assigneeId ? { color: accentColor } : undefined}
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
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</p>
              <div className="flex items-center gap-2">
                <Calendar size={14} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                <span className={`text-sm font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatDate(editingTask.dueDate)}
                  {isOverdue && ' (Overdue)'}
                </span>
              </div>
            </div>

            {/* Tags */}
            {editingTask.tags.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {editingTask.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Subtasks
                {editingTask.subtasks && editingTask.subtasks.length > 0 && (
                  <span className="ml-2 font-semibold text-slate-500 normal-case text-[10px]">
                    {editingTask.subtasks.filter(s => s.completed).length}/{editingTask.subtasks.length}
                  </span>
                )}
              </p>
              {editingTask.subtasks && editingTask.subtasks.length > 0 && (
                <div className="mb-3">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((editingTask.subtasks.filter(s => s.completed).length / editingTask.subtasks.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                {(editingTask.subtasks ?? []).map(subtask => {
                  const subtaskAssignee = teamMembers.find(m => m.id === subtask.assigneeId);
                  return (
                    <button
                      key={subtask.id}
                      onClick={() => { setSelectedSubtaskId(subtask.id); setIsSubtaskModalOpen(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left group"
                    >
                      <div
                        role="checkbox"
                        aria-checked={subtask.completed}
                        onClick={e => { e.stopPropagation(); handleToggleSubtask(subtask.id); }}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition cursor-pointer ${
                          subtask.completed
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        {subtask.completed && <Check size={10} className="text-white" />}
                      </div>
                      <span className={`flex-1 text-xs font-medium ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {subtask.title}
                      </span>
                      {subtaskAssignee && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: accentColor }}
                        >
                          <span className="text-[8px] font-bold text-white">{subtaskAssignee.avatar}</span>
                        </div>
                      )}
                      <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add a subtask…"
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="p-2 text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Timestamps */}
            <div className="pt-4 border-t border-slate-100 flex gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={11} /> {formatDate(editingTask.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Updated</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={11} /> {formatDateTime(editingTask.updatedAt)}
                </p>
              </div>
            </div>

            {/* Delete */}
            <div className="pt-4 border-t border-slate-100">
              {!confirmDelete ? (
                <Button variant="ghost" className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}>
                  Delete Task
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-bold">Are you sure?</span>
                  <Button variant="ghost" className="text-xs text-rose-600 hover:bg-rose-50 font-bold" onClick={() => router.back()}>
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
          <div
            className="w-80 shrink-0 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col sticky top-4"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
          >
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Comments
                {editingTask.comments.length > 0 && (
                  <span className="ml-2 font-semibold text-slate-500 normal-case">({editingTask.comments.length})</span>
                )}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {editingTask.comments.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No comments yet.</p>
              )}
              {editingTask.comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span className="text-[8px] font-bold text-white">
                      {c.authorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-800">{c.authorName}</span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment…"
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="p-2 text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: accentColor }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedSubtask && (
        <SubtaskDetailModal
          subtask={selectedSubtask}
          parentTaskTitle={editingTask.title}
          sourceInfo={sourceInfo}
          teamMembers={teamMembers}
          accentColor={accentColor}
          isOpen={isSubtaskModalOpen}
          onClose={() => { setIsSubtaskModalOpen(false); setSelectedSubtaskId(null); }}
          onUpdate={handleUpdateSubtask}
          onDelete={handleDeleteSubtask}
        />
      )}
    </>
  );
}
