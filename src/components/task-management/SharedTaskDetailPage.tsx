// src/components/task-management/SharedTaskDetailPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Calendar, Tag, Send, Clock,
  ChevronDown, ChevronLeft, Check, Plus, ChevronRight, History, MessageSquare, Search, X, Link,
  Pencil, Trash2,
} from 'lucide-react';
import {
  SubtaskDetailModal,
  type ActivityEntry,
  type SubtaskDetailModalProps,
} from './SubtaskDetailModal';
import { JobOrderViewModal } from '@/app/(portal)/portal/sales/job-orders/components/JobOrderViewModal';
import type { JobOrderRecord } from '@/app/(portal)/portal/sales/job-orders/components/JobOrders';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import { useToast } from '@/context/ToastContext';
import type { AOTask, AOTaskStatus, AOTaskPriority, AOTaskSubtask, AOTeamMember } from '@/lib/types';

export interface SourceInfo {
  label: string;
  bg: string;
  textColor: string;
  color: string;
}

export interface DeptStatus {
  id: number;
  name: string;
  color: string | null;
  isEntryStep: boolean;
  isExitStep: boolean;
}

export interface DeptWithStatuses {
  id: number;
  name: string;
  statuses: DeptStatus[];
}

export interface ConversationEntry {
  id: number;
  message: string;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
}

export interface TaskHistoryEntry {
  id: string;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: { id: string; name: string };
}

export interface SharedTaskDetailPageProps {
  task: AOTask;
  taskId?: number;
  teamMembers: AOTeamMember[];
  currentUser: { id: string; name: string };
  accentColor: string;
  sourceInfo?: SourceInfo;
  deptStatuses?: DeptStatus[];
  allDeptStatuses?: DeptWithStatuses[];
  initialConversations?: ConversationEntry[];
  initialHistoryLogs?: TaskHistoryEntry[];
  onUpdate?: (updated: AOTask) => void;
  jobOrder?: { id: string; jobOrderNumber: string } | null;
  SubtaskModalComponent?: (props: SubtaskDetailModalProps) => React.ReactNode;
}

const DEFAULT_STATUS_COLORS: Record<string, string> = {
  'to do':       '#64748b',
  'in progress': '#3b82f6',
  'review':      '#f59e0b',
  'done':        '#10b981',
};

const PRIORITY_OPTIONS: AOTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low:    { variant: 'neutral' },
  Medium: { variant: 'info'    },
  High:   { variant: 'warning' },
  Urgent: { variant: 'danger'  },
};

const PRIORITY_TO_DB: Record<AOTaskPriority, string> = {
  Low: 'LOW', Medium: 'NORMAL', High: 'HIGH', Urgent: 'URGENT',
};

function getStatusColor(statusName: string, deptStatuses?: DeptStatus[]): string {
  const dbStatus = deptStatuses?.find(s => s.name === statusName);
  if (dbStatus?.color) return dbStatus.color;
  return DEFAULT_STATUS_COLORS[statusName.toLowerCase()] ?? '#64748b';
}

function formatHistoryChange(entry: TaskHistoryEntry): string {
  switch (entry.changeType) {
    case 'STATUS_CHANGED':      return `Changed status: ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
    case 'PRIORITY_CHANGED':    return `Changed priority: ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
    case 'ASSIGNEE_CHANGED':    return `Changed assignee: ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
    case 'DUE_DATE_CHANGED':    return `Updated due date to ${entry.newValue ?? '—'}`;
    case 'JOB_ORDER_CHANGED':
      if (!entry.oldValue && entry.newValue)  return `Linked job order: ${entry.newValue}`;
      if (entry.oldValue && !entry.newValue)  return `Removed job order: ${entry.oldValue}`;
      if (entry.oldValue && entry.newValue)   return `Changed job order: ${entry.oldValue} → ${entry.newValue}`;
      return 'Updated job order reference';
    case 'DETAILS_UPDATED':
      if (entry.oldValue && entry.newValue) return `Renamed: "${entry.oldValue}" → "${entry.newValue}"`;
      return 'Updated task details';
    case 'CREATED':             return 'Task created';
    default:                    return entry.changeType.replace(/_/g, ' ').toLowerCase();
  }
}

function renderMessageWithLinks(message: string): React.ReactNode {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(message)) !== null) {
    if (match.index > lastIndex) parts.push(message.slice(lastIndex, match.index));
    parts.push(
      <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer"
        className="text-teal-600 underline hover:text-teal-800 transition-colors break-all">
        {match[0]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.length) parts.push(message.slice(lastIndex));
  return parts.length > 1 ? <>{parts}</> : message;
}

export function SharedTaskDetailPage({
  task: initialTask,
  taskId,
  teamMembers,
  currentUser,
  accentColor,
  sourceInfo,
  deptStatuses,
  allDeptStatuses,
  initialConversations = [],
  initialHistoryLogs = [],
  onUpdate,
  jobOrder,
  SubtaskModalComponent = SubtaskDetailModal,
}: SharedTaskDetailPageProps): React.ReactNode {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [editingTask, setEditingTask] = useState<AOTask>(initialTask);
  const [conversations, setConversations] = useState<ConversationEntry[]>(initialConversations);
  const [historyLogs, setHistoryLogs] = useState<TaskHistoryEntry[]>(initialHistoryLogs);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [statusDeptId, setStatusDeptId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isDueDateEditing, setIsDueDateEditing] = useState(false);
  const [isJobOrderModalOpen, setIsJobOrderModalOpen] = useState(false);
  const [jobOrderDetail, setJobOrderDetail] = useState<JobOrderRecord | null>(null);
  const [isLoadingJO, setIsLoadingJO] = useState(false);
  const [currentJobOrder, setCurrentJobOrder] = useState<{ id: string; jobOrderNumber: string } | null>(jobOrder ?? null);
  const [isEditingJobOrder, setIsEditingJobOrder] = useState(false);
  const [joSearchQuery, setJoSearchQuery] = useState('');
  const [joOptions, setJoOptions] = useState<Array<{ id: string; jobOrderNumber: string }>>([]);
  const [isSearchingJO, setIsSearchingJO] = useState(false);
  // Activity logs keyed by subtask ID — persists across modal open/close and parent re-renders
  const [subtaskActivityLogs, setSubtaskActivityLogs] = useState<Record<string, ActivityEntry[]>>({});
  // Inline editing state for description and client
const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState('');
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientId, setEditClientId] = useState('');
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; name: string }>>([]);
  // Comment edit/delete state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentValue, setEditCommentValue] = useState('');
  const [hoveredCommentId, setHoveredCommentId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/hr/clients')
      .then(r => r.ok ? r.json() : null)
      .then((d: { data?: Array<{ id: number; businessName: string }> } | null) => {
        if (!d?.data) return;
        setClientOptions(d.data.map(c => ({ id: String(c.id), name: c.businessName })));
      })
      .catch(() => undefined);
   
  }, []);

  const handleAddSubtaskActivity = (kind: ActivityEntry['kind'], message: string) => {
    if (!selectedSubtaskId) return;
    const entry: ActivityEntry = {
      id: `al-${Date.now()}-${Math.random()}`,
      kind,
      message,
      actorName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    setSubtaskActivityLogs(prev => ({
      ...prev,
      [selectedSubtaskId]: [...(prev[selectedSubtaskId] ?? []), entry],
    }));
  };

  const clientName = clientOptions.find(c => c.id === editingTask.clientId)?.name
    ?? INITIAL_CLIENTS.find(c => c.id === editingTask.clientId)?.businessName
    ?? (editingTask.clientId ? `Client #${editingTask.clientId}` : 'Unknown');
  const assignee   = teamMembers.find(m => m.id === editingTask.assigneeId);
  const isOverdue  = editingTask.status !== 'Done' && new Date(editingTask.dueDate) < new Date();
  const isDone = /done|complet|finish/i.test(editingTask.status);
  const daysLeft = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(editingTask.dueDate); due.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  })();
  const daysLeftText = isDone ? null
    : daysLeft > 1 ? `${daysLeft} days left`
    : daysLeft === 1 ? '1 day left'
    : daysLeft === 0 ? 'Due today'
    : `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`;
  const daysLeftCls = isDone ? ''
    : daysLeft <= 0 ? 'text-rose-600 bg-rose-50'
    : daysLeft === 1 ? 'text-amber-600 bg-amber-50'
    : 'text-slate-600 bg-slate-100';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const update = (next: AOTask) => { setEditingTask(next); onUpdate?.(next); };

  /** PATCH /api/tasks/:id and refresh history logs from the response. */
  const patchTask = async (body: Record<string, unknown>): Promise<boolean> => {
    if (!taskId) return true;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return false;
    const json = await res.json() as { data?: { historyLogs?: TaskHistoryEntry[] } };
    if (json.data?.historyLogs) {
      setHistoryLogs(json.data.historyLogs);
    }
    return true;
  };

  const handleStatusChange = async (status: DeptStatus, deptId: number) => {
    setShowStatusDropdown(false);
    setStatusDeptId(null);
    if (taskId) {
      setIsSaving(true);
      const ok = await patchTask({ statusId: status.id, departmentId: deptId });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update status', 'Please try again.'); return; }
    }
    update({ ...editingTask, status: status.name as AOTaskStatus, updatedAt: new Date().toISOString() });
  };

  const handlePriorityChange = async (priority: AOTaskPriority) => {
    setShowPriorityDropdown(false);
    if (taskId) {
      setIsSaving(true);
      const ok = await patchTask({ priority: PRIORITY_TO_DB[priority] });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update priority', 'Please try again.'); return; }
    }
    update({ ...editingTask, priority, updatedAt: new Date().toISOString() });
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    setShowAssigneeDropdown(false);
    setAssigneeSearchQuery('');
    if (taskId) {
      setIsSaving(true);
      const ok = await patchTask({ assignedToId: Number(assigneeId) });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update assignee', 'Please try again.'); return; }
    }
    update({ ...editingTask, assigneeId, updatedAt: new Date().toISOString() });
  };

  const handleSaveTitle = async () => {
    const newTitle = editTitleValue.trim();
    if (!newTitle || newTitle === editingTask.title) { setIsEditingTitle(false); return; }
    if (taskId) {
      setIsSaving(true);
      const ok = await patchTask({ name: newTitle });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update title', 'Please try again.'); return; }
    }
    update({ ...editingTask, title: newTitle, updatedAt: new Date().toISOString() });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    const desc = editDescValue.trim();
    if (taskId) {
      setIsSaving(true);
      const ok = await patchTask({ description: desc || null });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update description', 'Please try again.'); return; }
    }
    update({ ...editingTask, description: desc, updatedAt: new Date().toISOString() });
    setIsEditingDesc(false);
  };

  const handleSaveClient = async () => {
    if (!editClientId) { setIsEditingClient(false); return; }
    if (taskId) {
      setIsSaving(true);
      const ok = await patchTask({ clientId: Number(editClientId) });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update client', 'Please try again.'); return; }
    }
    update({ ...editingTask, clientId: editClientId, updatedAt: new Date().toISOString() });
    setIsEditingClient(false);
  };

  const handleDueDateChange = async (dateValue: string) => {
    setIsDueDateEditing(false);
    if (!dateValue) return;
    const iso = new Date(dateValue + 'T00:00:00').toISOString();
    if (taskId) {
      setIsSaving(true);
      const ok = await patchTask({ dueDate: iso });
      setIsSaving(false);
      if (!ok) { toastError('Failed to update due date', 'Please try again.'); return; }
    }
    update({ ...editingTask, dueDate: iso, updatedAt: new Date().toISOString() });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (taskId) {
      setIsSaving(true);
      const res = await fetch(`/api/tasks/${taskId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newComment.trim() }),
      });
      setIsSaving(false);
      if (!res.ok) { toastError('Failed to post comment', 'Please try again.'); return; }
      const json = await res.json() as { data?: { id: number; message: string; createdAt: string; author: { id: string; name: string; image: string | null } } };
      if (json.data) {
        setConversations(prev => [...prev, {
          id: json.data!.id,
          message: json.data!.message,
          createdAt: json.data!.createdAt,
          author: json.data!.author,
        }]);
      }
    } else {
      setConversations(prev => [...prev, {
        id: Date.now(),
        message: newComment.trim(),
        createdAt: new Date().toISOString(),
        author: { id: currentUser.id, name: currentUser.name, image: null },
      }]);
    }
    setNewComment('');
  };

  const handleEditComment = (commentId: number, currentMessage: string) => {
    setEditingCommentId(commentId);
    setEditCommentValue(currentMessage);
  };

  const handleSaveEditComment = async () => {
    if (!editCommentValue.trim() || editingCommentId === null) return;
    if (taskId) {
      setIsSaving(true);
      const res = await fetch(`/api/tasks/${taskId}/conversations/${editingCommentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editCommentValue.trim() }),
      });
      setIsSaving(false);
      if (!res.ok) { toastError('Failed to update comment', 'Please try again.'); return; }
      toastSuccess('Comment updated', 'Your comment has been saved successfully.');
    }
    setConversations(prev => prev.map(c =>
      c.id === editingCommentId ? { ...c, message: editCommentValue.trim() } : c
    ));
    setEditingCommentId(null);
    setEditCommentValue('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentValue('');
  };

  const handleDeleteComment = async (commentId: number) => {
    if (taskId) {
      setIsSaving(true);
      const res = await fetch(`/api/tasks/${taskId}/conversations/${commentId}`, { method: 'DELETE' });
      setIsSaving(false);
      if (!res.ok) { toastError('Failed to delete comment', 'Please try again.'); return; }
      toastSuccess('Comment deleted', 'The comment has been removed.');
    }
    setConversations(prev => prev.filter(c => c.id !== commentId));
    setDeletingCommentId(null);
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const sub = (editingTask.subtasks ?? []).find(s => s.id === subtaskId);
    if (!sub) return;
    const newCompleted = !sub.completed;
    if (taskId) {
      setIsSaving(true);
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: newCompleted }),
      });
      setIsSaving(false);
      if (!res.ok) { toastError('Failed to update subtask', 'Please try again.'); return; }
    }
    update({
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).map(s =>
        s.id === subtaskId ? { ...s, completed: newCompleted } : s
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

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (taskId) {
      setIsSaving(true);
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' });
      setIsSaving(false);
      if (!res.ok) { toastError('Failed to delete subtask', 'Please try again.'); return; }
    }
    update({
      ...editingTask,
      subtasks: (editingTask.subtasks ?? []).filter(s => s.id !== subtaskId),
      updatedAt: new Date().toISOString(),
    });
    setIsSubtaskModalOpen(false);
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    if (taskId) {
      const entryStatus = deptStatuses?.find(s => s.isEntryStep);
      setIsAddingSubtask(true);
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubtaskTitle.trim(),
          ...(entryStatus ? { statusId: entryStatus.id } : {}),
        }),
      });
      setIsAddingSubtask(false);
      if (!res.ok) { toastError('Failed to add subtask', 'Please try again.'); return; }
      const json = await res.json() as { data?: { id: number; name: string; createdAt: string } };
      if (json.data) {
        update({
          ...editingTask,
          subtasks: [...(editingTask.subtasks ?? []), {
            id: String(json.data.id),
            title: json.data.name,
            completed: false,
            createdAt: json.data.createdAt,
          }],
          updatedAt: new Date().toISOString(),
        });
        setNewSubtaskTitle('');
        return;
      }
    }
    // Local-only fallback (no taskId)
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

  const handleDeleteTask = async () => {
    if (taskId) {
      setIsSaving(true);
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setIsSaving(false);
      if (!res.ok) { toastError('Failed to delete task', 'Please try again.'); setConfirmDelete(false); return; }
    }
    router.push('/portal/task-management');
  };

  const handleOpenJobOrder = async () => {
    if (!currentJobOrder) return;
    if (jobOrderDetail && jobOrderDetail.id === currentJobOrder.id) { setIsJobOrderModalOpen(true); return; }
    setIsLoadingJO(true);
    try {
      const res = await fetch(`/api/sales/job-orders/${currentJobOrder.id}`);
      if (!res.ok) { toastError('Failed to load job order', 'Please try again.'); return; }
      const json = await res.json() as { data: JobOrderRecord };
      setJobOrderDetail(json.data);
      setIsJobOrderModalOpen(true);
    } catch {
      toastError('Network error', 'Could not load the job order.');
    } finally {
      setIsLoadingJO(false);
    }
  };

  const handleStartEditJobOrder = async () => {
    setIsEditingJobOrder(true);
    setJoSearchQuery('');
    if (joOptions.length > 0) return;
    setIsSearchingJO(true);
    try {
      const res = await fetch('/api/sales/job-orders');
      if (!res.ok) return;
      const json = await res.json() as { data: Array<{ id: string; jobOrderNumber: string }> };
      setJoOptions(json.data.map(jo => ({ id: jo.id, jobOrderNumber: jo.jobOrderNumber })));
    } catch {
      // silently fail — user can still cancel
    } finally {
      setIsSearchingJO(false);
    }
  };

  const handleSaveJobOrder = async (joId: string | null, joNum: string | null) => {
    setIsSaving(true);
    const ok = await patchTask({ jobOrderId: joId });
    setIsSaving(false);
    if (!ok) { toastError('Failed to update job order', 'Please try again.'); return; }
    setCurrentJobOrder(joId && joNum ? { id: joId, jobOrderNumber: joNum } : null);
    setJobOrderDetail(null);
    setIsEditingJobOrder(false);
  };

  // Build unified activity feed sorted chronologically
  type ActivityItem =
    | { kind: 'conversation'; id: number;  createdAt: string; message: string; author: { id: string; name: string; image: string | null } }
    | { kind: 'history';      id: string;  createdAt: string; changeType: string; oldValue: string | null; newValue: string | null; actor: { id: string; name: string } };

  const activityFeed: ActivityItem[] = [
    ...conversations.map(c => ({ kind: 'conversation' as const, id: c.id, createdAt: c.createdAt, message: c.message, author: c.author })),
    ...historyLogs
      .filter(h => h.changeType !== 'COMMENT_ADDED')
      .map(h => ({ kind: 'history' as const, id: h.id, createdAt: h.createdAt, changeType: h.changeType, oldValue: h.oldValue, newValue: h.newValue, actor: h.actor })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const selectedSubtask = (editingTask.subtasks ?? []).find(s => s.id === selectedSubtaskId);
  const joSearchResults = joOptions
    .filter(jo => jo.jobOrderNumber.toLowerCase().includes(joSearchQuery.toLowerCase()))
    .slice(0, 8);
  const dueDateInputValue = editingTask.dueDate
    ? new Date(editingTask.dueDate).toISOString().slice(0, 10)
    : '';

  return (
    <>
      <div className="animate-in fade-in duration-500 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 6rem)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ArrowLeft size={15} /> Back to Tasks
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: getStatusColor(editingTask.status, deptStatuses) }}
            />
            {isEditingTitle ? (
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <input
                  autoFocus
                  value={editTitleValue}
                  onChange={e => setEditTitleValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') void handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="flex-1 text-xl font-black border-b-2 border-[#0f766e] focus:outline-none bg-transparent text-slate-900 min-w-0"
                />
                <div className="flex gap-2">
                <button onClick={() => void handleSaveTitle()} className="text-xs font-bold px-3 py-1.5 bg-[#0f766e] text-white rounded-lg hover:bg-[#0d6560] transition shrink-0">Save</button>
                <button onClick={() => setIsEditingTitle(false)} className="text-xs font-bold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition shrink-0">Cancel</button>
                </div>
                
              </div>
            ) : (
              <h1
                className="text-xl font-black text-slate-900 truncate cursor-pointer hover:bg-slate-50 rounded-lg px-1 -mx-1 transition"
                onDoubleClick={() => { setEditTitleValue(editingTask.title); setIsEditingTitle(true); }}
                title="Double-click to edit title"
              >
                {editingTask.title}
              </h1>
            )}
            {!isEditingTitle && sourceInfo && (
              <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${sourceInfo.bg} ${sourceInfo.textColor}`}>
                {sourceInfo.label}
              </span>
            )}
            {isSaving && (
              <span className="text-[10px] text-slate-400 font-medium animate-pulse ml-2">Saving…</span>
            )}
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left: Details */}
          <div className="w-3/5 p-6 overflow-y-auto border-r border-slate-100 space-y-6">

            {/* Client + Job Order (2-col) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client</p>
                {isEditingClient ? (
                <div className="space-y-2">
                  <select
                    autoFocus
                    value={editClientId}
                    onChange={e => setEditClientId(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-white"
                  >
                    <option value="">— Select a client —</option>
                    {clientOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleSaveClient()}
                      className="text-xs font-bold px-3 py-1.5 bg-[#0f766e] text-white rounded-lg hover:bg-[#0d6560] transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingClient(false)}
                      className="text-xs font-bold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm font-bold text-slate-800 cursor-pointer hover:bg-slate-50 rounded-lg p-1 -m-1 transition"
                  onDoubleClick={() => { setEditClientId(editingTask.clientId); setIsEditingClient(true); }}
                  title="Double-click to edit"
                >
                  {clientName}
                </p>
              )}
              </div>

              {/* Job Order */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Job Order</p>
                {isEditingJobOrder ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        autoFocus
                        type="text"
                        value={joSearchQuery}
                        onChange={e => setJoSearchQuery(e.target.value)}
                        placeholder={isSearchingJO ? 'Loading…' : 'Search by JO number…'}
                        disabled={isSearchingJO}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f766e] disabled:bg-slate-50"
                      />
                      {joSearchQuery && joSearchResults.length > 0 && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                          {joSearchResults.map(jo => (
                            <button
                              key={jo.id}
                              onClick={() => void handleSaveJobOrder(jo.id, jo.jobOrderNumber)}
                              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
                            >
                              {jo.jobOrderNumber}
                            </button>
                          ))}
                        </div>
                      )}
                      {joSearchQuery && !isSearchingJO && joSearchResults.length === 0 && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2">
                          <p className="text-xs text-slate-400 italic">No results found.</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIsEditingJobOrder(false)}
                      className="text-xs font-bold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : currentJobOrder ? (
                  <div className="group flex items-center gap-1.5">
                    <button
                      onClick={() => void handleOpenJobOrder()}
                      className="text-sm font-bold text-blue-600 hover:underline transition"
                      title="Click to view job order"
                    >
                      {isLoadingJO ? 'Loading…' : currentJobOrder.jobOrderNumber}
                    </button>
                    <button
                      onClick={() => void handleSaveJobOrder(null, null)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 rounded p-0.5"
                      title="Remove job order reference"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => void handleStartEditJobOrder()}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#0f766e] transition"
                    title="Assign a job order"
                  >
                    <Link size={13} />
                    <span className="italic">Assign job order</span>
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={editDescValue}
                    onChange={e => setEditDescValue(e.target.value)}
                    rows={4}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e] resize-none"
                    placeholder="Add a description…"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleSaveDescription()}
                      className="text-xs font-bold px-3 py-1.5 bg-[#0f766e] text-white rounded-lg hover:bg-[#0d6560] transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="text-xs font-bold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm text-slate-600 leading-relaxed cursor-pointer hover:bg-slate-50 rounded-lg p-1 -m-1 transition"
                  onDoubleClick={() => { setEditDescValue(editingTask.description); setIsEditingDesc(true); }}
                  title="Double-click to edit"
                >
                  {editingTask.description || <span className="italic text-slate-400">No description — double-click to add.</span>}
                </p>
              )}
            </div>

            {/* Department badge */}
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
                onClick={() => { setShowStatusDropdown(v => !v); setStatusDeptId(null); setShowPriorityDropdown(false); setShowAssigneeDropdown(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getStatusColor(editingTask.status, deptStatuses) }}
                />
                <span className="text-sm font-bold text-slate-700">{editingTask.status}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showStatusDropdown && (
                <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-52">
                  {statusDeptId === null ? (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Department</p>
                      <div className="pb-1">
                        {(allDeptStatuses ?? []).map(dept => (
                          <button
                            key={dept.id}
                            onClick={() => setStatusDeptId(dept.id)}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition text-sm text-slate-700"
                          >
                            <span className="font-medium">{dept.name}</span>
                            <ChevronRight size={13} className="text-slate-400" />
                          </button>
                        ))}
                        {(allDeptStatuses ?? []).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-3 px-3">No departments available</p>
                        )}
                      </div>
                    </div>
                  ) : (() => {
                    const drill = (allDeptStatuses ?? []).find(d => d.id === statusDeptId);
                    return (
                      <div>
                        <button
                          onClick={() => setStatusDeptId(null)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                          <ChevronLeft size={13} />
                          {drill?.name}
                        </button>
                        <div className="py-1">
                          {(drill?.statuses ?? []).map(s => (
                            <button
                              key={s.id}
                              onClick={() => void handleStatusChange(s, statusDeptId)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition ${s.name === editingTask.status ? 'font-bold' : 'text-slate-700'}`}
                              style={s.name === editingTask.status ? { color: accentColor } : undefined}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: s.color ?? '#64748b' }}
                              />
                              {s.name}
                            </button>
                          ))}
                          {(drill?.statuses ?? []).length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-3 px-3">No statuses in this department</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
                      onClick={() => void handlePriorityChange(p)}
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
                <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-64">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        autoFocus
                        value={assigneeSearchQuery}
                        onChange={e => setAssigneeSearchQuery(e.target.value)}
                        placeholder="Search employees…"
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    {teamMembers.filter(m =>
                      m.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()) ||
                      m.department.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
                    ).map(m => (
                      <button
                        key={m.id}
                        onClick={() => void handleAssigneeChange(m.id)}
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
                    {teamMembers.filter(m => m.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-3">No employees found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</p>
              {isDueDateEditing ? (
                <input
                  type="date"
                  defaultValue={dueDateInputValue}
                  autoFocus
                  onBlur={e => void handleDueDateChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') void handleDueDateChange((e.target as HTMLInputElement).value);
                    if (e.key === 'Escape') setIsDueDateEditing(false);
                  }}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                />
              ) : (
                <button
                  onClick={() => setIsDueDateEditing(true)}
                  className="flex items-center gap-2 hover:opacity-70 transition"
                >
                  <Calendar size={14} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                  <span className={`text-sm font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatDate(editingTask.dueDate)}
                    {isOverdue && ' (Overdue)'}
                  </span>
                  {daysLeftText && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysLeftCls}`}>
                      {daysLeftText}
                    </span>
                  )}
                </button>
              )}
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Subtasks
                  {editingTask.subtasks && editingTask.subtasks.length > 0 && (
                    <span className="ml-2 font-semibold text-slate-500 normal-case text-[10px]">
                      {editingTask.subtasks.filter(s => s.completed).length}/{editingTask.subtasks.length} done
                    </span>
                  )}
                </p>
              </div>
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

              {/* Table */}
              {(editingTask.subtasks ?? []).length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-6" />
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtask</th>
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Department</th>
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Due Date</th>
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Assignee</th>
                        <th className="w-6" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(editingTask.subtasks ?? []).map(subtask => {
                        const subtaskAssignee = teamMembers.find(m => m.id === subtask.assigneeId);
                        const isOverdueSubtask = !subtask.completed && !!subtask.dueDate && new Date(subtask.dueDate) < new Date();
                        return (
                          <tr
                            key={subtask.id}
                            className="hover:bg-slate-50 transition cursor-pointer group"
                            onClick={() => {
                              setSelectedSubtaskId(subtask.id);
                              setIsSubtaskModalOpen(true);
                              if (taskId) {
                                void fetch(`/api/tasks/${taskId}/subtasks/${subtask.id}/history`)
                                  .then(r => r.ok ? r.json() : null)
                                  .then((json: { data: Array<{ id: string; kind: string; message: string; createdAt: string; actor: { id: string; name: string } }> } | null) => {
                                    if (json?.data) {
                                      setSubtaskActivityLogs(prev => ({
                                        ...prev,
                                        [subtask.id]: json.data.map(e => ({
                                          id: e.id,
                                          kind: e.kind as ActivityEntry['kind'],
                                          message: e.message,
                                          actorName: e.actor.name,
                                          createdAt: e.createdAt,
                                        })),
                                      }));
                                    }
                                  });
                              }
                            }}
                          >
                            {/* Checkbox */}
                            <td className="px-3 py-2.5">
                              <div
                                role="checkbox"
                                aria-checked={subtask.completed}
                                onClick={e => { e.stopPropagation(); void handleToggleSubtask(subtask.id); }}
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition cursor-pointer ${
                                  subtask.completed
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-slate-300 hover:border-emerald-400'
                                }`}
                              >
                                {subtask.completed && <Check size={10} className="text-white" />}
                              </div>
                            </td>
                            {/* Title */}
                            <td className="px-3 py-2.5">
                              <span className={`font-medium ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {subtask.title}
                              </span>
                            </td>
                            {/* Department */}
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              {subtask.department ? (
                                <span className="inline-flex items-center text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                  {subtask.department.name}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[11px]">—</span>
                              )}
                            </td>
                            {/* Due Date */}
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              {subtask.dueDate ? (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isOverdueSubtask ? 'text-red-500' : 'text-slate-500'}`}>
                                  <Calendar size={11} />
                                  {new Date(subtask.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[11px]">—</span>
                              )}
                            </td>
                            {/* Assignee */}
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              {subtaskAssignee ? (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: accentColor }}
                                  >
                                    <span className="text-[8px] font-bold text-white">{subtaskAssignee.avatar}</span>
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-600 truncate max-w-25">{subtaskAssignee.name}</span>
                                </div>
                              ) : subtask.assigneeName ? (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: accentColor }}
                                  >
                                    <span className="text-[8px] font-bold text-white">
                                      {subtask.assigneeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-600 truncate max-w-25">{subtask.assigneeName}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[11px]">Unassigned</span>
                              )}
                            </td>
                            {/* Chevron */}
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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && void handleAddSubtask()}
                  placeholder="Add a subtask…"
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                />
                <button
                  onClick={() => void handleAddSubtask()}
                  disabled={!newSubtaskTitle.trim() || isAddingSubtask}
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
                  <Button variant="ghost" className="text-xs text-rose-600 hover:bg-rose-50 font-bold" onClick={() => void handleDeleteTask()}>
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
          <div className="w-2/5 shrink-0 flex flex-col bg-slate-50">
            {/* Header with tab counts */}
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-slate-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comments</p>
                </div>
                <div className="flex items-center gap-2">
                  {conversations.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                      <MessageSquare size={9} /> {conversations.length}
                    </span>
                  )}
                  {historyLogs.filter(h => h.changeType !== 'COMMENT_ADDED').length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-600">
                      <History size={9} /> {historyLogs.filter(h => h.changeType !== 'COMMENT_ADDED').length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activityFeed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <MessageSquare size={28} className="text-slate-200" />
                  <p className="text-xs text-slate-400">No comments yet. Be the first!</p>
                </div>
              )}
              {activityFeed.map(item => {
                if (item.kind === 'conversation') {
                  const initials = item.author.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  const isOwnComment = item.author.id === currentUser.id;
                  const isEditing = editingCommentId === item.id;
                  const isDeleting = deletingCommentId === item.id;
                  const isHovered = hoveredCommentId === item.id;
                  return (
                    <div
                      key={`c-${item.id}`}
                      className="flex gap-2.5"
                      onMouseEnter={() => setHoveredCommentId(item.id)}
                      onMouseLeave={() => setHoveredCommentId(null)}
                    >
                      {/* Avatar */}
                      {item.author.image ? (
                        <Image
                          src={item.author.image}
                          alt={item.author.name}
                          width={28}
                          height={28}
                          className="w-7 h-7 rounded-full shrink-0 mt-0.5 shadow-sm border border-slate-200 object-cover"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[9px] font-bold shadow-sm"
                          style={{ backgroundColor: accentColor }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-800">{item.author.name}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</span>
                        </div>
                        <div className="relative group">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editCommentValue}
                                onChange={e => setEditCommentValue(e.target.value)}
                                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white resize-none leading-relaxed"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => void handleSaveEditComment()}
                                  disabled={!editCommentValue.trim() || isSaving}
                                  className="text-[10px] px-2.5 py-1 rounded-lg text-white transition font-medium disabled:opacity-40"
                                  style={{ backgroundColor: accentColor }}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : isDeleting ? (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 shadow-sm">
                              <p className="text-xs text-rose-700 font-medium mb-2">Delete this comment?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setDeletingCommentId(null)}
                                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => void handleDeleteComment(item.id)}
                                  disabled={isSaving}
                                  className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition font-medium disabled:opacity-40"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="bg-white border border-slate-200 rounded-xl rounded-tl-sm px-3 py-2 shadow-sm">
                                <p className="text-xs text-slate-700 leading-relaxed">{renderMessageWithLinks(item.message)}</p>
                              </div>
                              {isOwnComment && isHovered && (
                                <div className="absolute top-1 right-1 flex gap-1">
                                  <button
                                    onClick={() => handleEditComment(item.id, item.message)}
                                    className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition shadow-sm"
                                    title="Edit comment"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingCommentId(item.id)}
                                    className="p-1 rounded-md bg-white border border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition shadow-sm"
                                    title="Delete comment"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                // History entry — compact changelog style
                const _initials = item.actor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={`h-${item.id}`} className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <History size={12} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-[11px] text-slate-500 leading-snug">
                        <span className="font-bold text-slate-700">{item.actor.name}</span>
                        {' '}{formatHistoryChange(item)}
                      </p>
                      <span className="text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void handleAddComment())}
                  placeholder="Write a comment… (Enter to send)"
                  rows={2}
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white resize-none leading-relaxed"
                />
                <button
                  onClick={() => void handleAddComment()}
                  disabled={!newComment.trim() || isSaving}
                  className="p-2.5 text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 mb-0.5"
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
        <SubtaskModalComponent
          subtask={selectedSubtask}
          parentTaskTitle={editingTask.title}
          sourceInfo={sourceInfo}
          teamMembers={teamMembers}
          accentColor={accentColor}
          isOpen={isSubtaskModalOpen}
          onClose={() => { setIsSubtaskModalOpen(false); }}
          onUpdate={handleUpdateSubtask}
          onDelete={handleDeleteSubtask}
          taskId={taskId}
          deptStatuses={deptStatuses}
          currentUser={currentUser}
          activityLog={subtaskActivityLogs[selectedSubtaskId ?? ''] ?? []}
          onAddActivity={handleAddSubtaskActivity}
          departments={(allDeptStatuses ?? []).map(d => ({ id: d.id, name: d.name }))}
          onParentTitleUpdate={newTitle => update({ ...editingTask, title: newTitle, updatedAt: new Date().toISOString() })}
        />
      )}

      {jobOrderDetail && (
        <JobOrderViewModal
          isOpen={isJobOrderModalOpen}
          onClose={() => setIsJobOrderModalOpen(false)}
          jobOrder={jobOrderDetail}
          onUpdate={jo => setJobOrderDetail(jo)}
          onEdit={() => {}}
        />
      )}
    </>
  );
}


