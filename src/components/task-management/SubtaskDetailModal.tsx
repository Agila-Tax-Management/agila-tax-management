// src/components/task-management/SubtaskDetailModal.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/UI/button';
import {
  X, Calendar, User, Send, Clock, CheckSquare, Square, ChevronDown, Layers,
} from 'lucide-react';
import type { AOTaskSubtask, AOTaskComment, AOTeamMember } from '@/lib/types';

type SourceInfo = { label: string; bg: string; textColor: string };

const CURRENT_USER = { id: 'tl-1', name: 'Team Lead', avatar: 'TL' };

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
}: SubtaskDetailModalProps): React.ReactNode {
  const [editing, setEditing] = useState<AOTaskSubtask>(subtask);
  const [newComment, setNewComment] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Adjust state during render when subtask prop changes
  const [prevSubtask, setPrevSubtask] = useState(subtask);
  if (subtask !== prevSubtask) {
    setPrevSubtask(subtask);
    setEditing(subtask);
    setNewComment('');
    setConfirmDelete(false);
  }

  if (!isOpen) return null;

  const assignee = teamMembers.find(m => m.id === editing.assigneeId);
  const comments = editing.comments ?? [];

  const handleToggleCompleted = () => {
    const updated = { ...editing, completed: !editing.completed };
    setEditing(updated);
    onUpdate(updated);
  };

  const handleNotesChange = (notes: string) => {
    const updated = { ...editing, notes };
    setEditing(updated);
    onUpdate(updated);
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const updated = { ...editing, assigneeId };
    setEditing(updated);
    onUpdate(updated);
    setShowAssigneeDropdown(false);
  };

  const handleDueDateChange = (dueDate: string) => {
    const updated = { ...editing, dueDate: dueDate || undefined };
    setEditing(updated);
    onUpdate(updated);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: AOTaskComment = {
      id: `sc-${Date.now()}`,
      authorId: CURRENT_USER.id,
      authorName: CURRENT_USER.name,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = { ...editing, comments: [...comments, comment] };
    setEditing(updated);
    onUpdate(updated);
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
              onClick={handleToggleCompleted}
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
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Details */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100">

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
                onClick={handleToggleCompleted}
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
                value={editing.notes ?? ''}
                onChange={e => handleNotesChange(e.target.value)}
                rows={4}
                placeholder="Add notes or details for this subtask…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e] resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Assignee */}
            <div className="mb-6 relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignee</p>
              <button
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
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
                onChange={e => handleDueDateChange(e.target.value)}
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
                  <Button variant="ghost" className="text-xs text-rose-600 hover:bg-rose-50 font-bold" onClick={() => { onDelete(editing.id); onClose(); }}>
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
          <div className="w-72 flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-500" />
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">Comments &amp; Notes</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">No comments yet. Add the first note.</p>
              )}
              {comments.map(comment => {
                const author = teamMembers.find(m => m.id === comment.authorId);
                return (
                  <div key={comment.id} className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: accentColor }}
                      >
                        <span className="text-[9px] font-bold text-white">
                          {author?.avatar ?? comment.authorName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{comment.authorName}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-white"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="text-white px-3 shrink-0"
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
