'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  X, Calendar, Tag, Send, Clock,
  ChevronDown, Check, Plus, ChevronRight, MessageSquare,
} from 'lucide-react';
import { SubtaskDetailModal, type ActivityEntry } from '@/components/task-management/SubtaskDetailModal';
import { AO_TEAM_MEMBERS, CURRENT_AO } from '@/lib/mock-ao-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTask, AOTaskStatus, AOTaskPriority, AOTaskComment, AOTaskSubtask } from '@/lib/types';

const STATUS_OPTIONS: AOTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const PRIORITY_OPTIONS: AOTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_CONFIG: Record<AOTaskStatus, { variant: 'neutral' | 'info' | 'warning' | 'success'; color: string }> = {
  'To Do': { variant: 'neutral', color: 'bg-slate-500' },
  'In Progress': { variant: 'info', color: 'bg-blue-500' },
  'Review': { variant: 'warning', color: 'bg-amber-500' },
  'Done': { variant: 'success', color: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low: { variant: 'neutral' },
  Medium: { variant: 'info' },
  High: { variant: 'warning' },
  Urgent: { variant: 'danger' },
};

interface TaskDetailsModalProps {
  task: AOTask;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: AOTask) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailsModal({ task, isOpen, onClose, onUpdate, onDelete }: TaskDetailsModalProps) {
  const [editingTask, setEditingTask] = useState<AOTask>(task);
  const [newComment, setNewComment] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  // Activity logs keyed by subtask ID — persists across modal open/close
  const [subtaskActivityLogs, setSubtaskActivityLogs] = useState<Record<string, ActivityEntry[]>>({});

  React.useEffect(() => {
    setEditingTask(task);
    setNewComment('');
    setConfirmDelete(false);
    setSelectedSubtaskId(null);
    setIsSubtaskModalOpen(false);
    setNewSubtaskTitle('');
  }, [task]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const clientName = INITIAL_CLIENTS.find(c => c.id === editingTask.clientId)?.businessName ?? 'Unknown';
  const assignee = AO_TEAM_MEMBERS.find(m => m.id === editingTask.assigneeId);

  const handleStatusChange = (status: AOTaskStatus) => {
    const updated = { ...editingTask, status, updatedAt: new Date().toISOString() };
    setEditingTask(updated);
    onUpdate(updated);
    setShowStatusDropdown(false);
  };

  const handlePriorityChange = (priority: AOTaskPriority) => {
    const updated = { ...editingTask, priority, updatedAt: new Date().toISOString() };
    setEditingTask(updated);
    onUpdate(updated);
    setShowPriorityDropdown(false);
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const updated = { ...editingTask, assigneeId, updatedAt: new Date().toISOString() };
    setEditingTask(updated);
    onUpdate(updated);
    setShowAssigneeDropdown(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: AOTaskComment = {
      id: `c-${Date.now()}`,
      authorId: CURRENT_AO.id,
      authorName: CURRENT_AO.name,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...editingTask,
      comments: [...editingTask.comments, comment],
      updatedAt: new Date().toISOString(),
    };
    setEditingTask(updated);
    onUpdate(updated);
    setNewComment('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const isOverdue = editingTask.status !== 'Done' && new Date(editingTask.dueDate) < new Date('2026-03-11');

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

  const handleUpdateSubtask = (updatedSubtask: AOTaskSubtask) => {
    const updated = {
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).map(s =>
        s.id === updatedSubtask.id ? updatedSubtask : s
      ),
      updatedAt: new Date().toISOString(),
    };
    setEditingTask(updated);
    onUpdate(updated);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = {
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).filter(s => s.id !== subtaskId),
      updatedAt: new Date().toISOString(),
    };
    setEditingTask(updated);
    onUpdate(updated);
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
    const updated = {
      ...editingTask,
      subtasks: [...(editingTask.subtasks ?? []), subtask],
      updatedAt: new Date().toISOString(),
    };
    setEditingTask(updated);
    onUpdate(updated);
    setNewSubtaskTitle('');
  };

  const handleAddSubtaskActivity = (kind: ActivityEntry['kind'], message: string) => {
    if (!selectedSubtaskId) return;
    const entry: ActivityEntry = {
      id: `al-${Date.now()}-${Math.random()}`,
      kind,
      message,
      actorName: CURRENT_AO.name,
      createdAt: new Date().toISOString(),
    };
    setSubtaskActivityLogs(prev => ({
      ...prev,
      [selectedSubtaskId]: [...(prev[selectedSubtaskId] ?? []), entry],
    }));
  };

  const selectedSubtask = (editingTask.subtasks ?? []).find(s => s.id === selectedSubtaskId);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_CONFIG[editingTask.status].color}`} />
            <h2 className="text-lg font-bold text-slate-900 truncate">{editingTask.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body - Two columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Details */}
          <div className="w-3/5 p-6 overflow-y-auto border-r border-slate-100">
            {/* Client */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client</p>
              <p className="text-sm font-bold text-slate-800">{clientName}</p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed">{editingTask.description}</p>
            </div>

            {/* Status */}
            <div className="mb-6 relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
              <button
                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowPriorityDropdown(false); setShowAssigneeDropdown(false); }}
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
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition ${s === editingTask.status ? 'font-bold text-[#25238e]' : 'text-slate-700'}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[s].color}`} />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="mb-6 relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</p>
              <button
                onClick={() => { setShowPriorityDropdown(!showPriorityDropdown); setShowStatusDropdown(false); setShowAssigneeDropdown(false); }}
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
            <div className="mb-6 relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignee</p>
              <button
                onClick={() => { setShowAssigneeDropdown(!showAssigneeDropdown); setShowStatusDropdown(false); setShowPriorityDropdown(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <div className="w-6 h-6 bg-[#25238e] rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{assignee?.avatar ?? '?'}</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{assignee?.name ?? 'Unassigned'}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showAssigneeDropdown && (
                <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-56">
                  {AO_TEAM_MEMBERS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleAssigneeChange(m.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition ${m.id === editingTask.assigneeId ? 'font-bold text-[#25238e]' : 'text-slate-700'}`}
                    >
                      <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
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
              <div className="mb-6">
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
            <div className="mb-6">
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
              {editingTask.subtasks && editingTask.subtasks.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-6" />
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtask</th>
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                        <th className="w-6" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(editingTask.subtasks ?? []).map(subtask => {
                        const subtaskAssignee = AO_TEAM_MEMBERS.find(m => m.id === subtask.assigneeId);
                        const subtaskOverdue = !subtask.completed && !!subtask.dueDate && new Date(subtask.dueDate) < new Date();
                        return (
                          <tr
                            key={subtask.id}
                            onClick={() => { setSelectedSubtaskId(subtask.id); setIsSubtaskModalOpen(true); }}
                            className="hover:bg-slate-50 transition cursor-pointer group"
                          >
                            <td className="px-3 py-2.5">
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
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`font-medium ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {subtask.title}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {subtask.dueDate ? (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${subtaskOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                                  <Calendar size={11} />
                                  {new Date(subtask.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {subtaskAssignee ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 bg-[#25238e] rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-[8px] font-bold text-white">{subtaskAssignee.avatar}</span>
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-600 truncate max-w-25">{subtaskAssignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[11px]">Unassigned</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add a subtask…"
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#25238e] bg-white"
                />
                <Button
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-2.5 bg-[#25238e] text-white hover:bg-[#1a1868] shrink-0"
                >
                  <Plus size={12} />
                </Button>
              </div>
            </div>

            {/* Meta */}
            <div className="pt-4 border-t border-slate-100 space-y-1">
              <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> Created {formatDateTime(editingTask.createdAt)}</p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> Updated {formatDateTime(editingTask.updatedAt)}</p>
            </div>

            {/* Delete */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              {!confirmDelete ? (
                <Button variant="ghost" className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}>
                  Delete Task
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-bold">Are you sure?</span>
                  <Button variant="ghost" className="text-xs text-rose-600 hover:bg-rose-50 font-bold" onClick={() => { onDelete(editingTask.id); onClose(); }}>
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
                {editingTask.comments.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    <MessageSquare size={9} /> {editingTask.comments.length}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {editingTask.comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <MessageSquare size={28} className="text-slate-200" />
                  <p className="text-xs text-slate-400">No comments yet. Be the first!</p>
                </div>
              )}
              {editingTask.comments.map(comment => {
                const initials = comment.authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={comment.id} className="flex gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[9px] font-bold shadow-sm"
                      style={{ backgroundColor: '#25238e' }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800">{comment.authorName}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-xl rounded-tl-sm px-3 py-2">
                        <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>
                      </div>
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
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddComment())}
                  placeholder="Write a comment… (Enter to send)"
                  rows={2}
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25238e] bg-white resize-none leading-relaxed"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="text-white px-3 shrink-0 mb-0.5"
                  style={{ backgroundColor: '#25238e' }}
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {isSubtaskModalOpen && selectedSubtask && (
      <SubtaskDetailModal
        subtask={selectedSubtask}
        parentTaskTitle={editingTask.title}
        teamMembers={AO_TEAM_MEMBERS}
        accentColor="#25238e"
        isOpen={isSubtaskModalOpen}
        onClose={() => setIsSubtaskModalOpen(false)}
        onUpdate={handleUpdateSubtask}
        onDelete={subtaskId => { handleDeleteSubtask(subtaskId); setIsSubtaskModalOpen(false); }}
        currentUser={{ id: CURRENT_AO.id, name: CURRENT_AO.name }}
        activityLog={subtaskActivityLogs[selectedSubtask.id] ?? []}
        onAddActivity={handleAddSubtaskActivity}
      />
    )}
    </>
  );
}
