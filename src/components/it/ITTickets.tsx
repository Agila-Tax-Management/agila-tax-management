// src/components/it/ITTickets.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import {
  Plus, Search, Ticket, X, Loader2,
  Clock, CheckCircle2, User, LayoutList, Columns3,
  Pencil, Trash2, AlertTriangle,
} from 'lucide-react';

interface TicketRecord {
  id: number;
  ticketNumber: string;
  type: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reportedBy: { id: string; name: string; image: string | null };
  assignedTo: { id: string; name: string; image: string | null } | null;
}

interface ITUser {
  userId: string | null;
  name: string;
  role: string;
}

const TYPE_LABELS: Record<string, string> = {
  BUG: 'Bug',
  SYSTEM_ISSUE: 'System Issue',
  DOWNTIME: 'Downtime',
  CREATE_USER: 'Create User',
  REVOKE_ACCESS: 'Revoke Access',
  HARDWARE_REQUEST: 'Hardware Request',
  SOFTWARE_REQUEST: 'Software Request',
  OTHER: 'Other',
};

const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  OPEN: 'danger',
  IN_PROGRESS: 'info',
  PENDING_INFO: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const PRIORITY_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = {
  LOW: 'neutral',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

const KANBAN_COLUMNS = [
  { key: 'OPEN',         label: 'Open',         color: '#dc2626' },
  { key: 'IN_PROGRESS',  label: 'In Progress',  color: '#2563eb' },
  { key: 'PENDING_INFO', label: 'Pending Info', color: '#d97706' },
  { key: 'RESOLVED',     label: 'Resolved',     color: '#16a34a' },
  { key: 'CLOSED',       label: 'Closed',       color: '#64748b' },
] as const;

const EMPTY_FORM = { type: 'BUG', priority: 'NORMAL', title: '', description: '' };
const EMPTY_EDIT_FORM = { title: '', description: '', type: 'BUG', priority: 'NORMAL', assignedToId: '' };

export function ITTickets(): React.ReactNode {
  const { success, error } = useToast();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Edit state
  const [editTicket, setEditTicket] = useState<TicketRecord | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // IT users for assignee dropdown
  const [itUsers, setItUsers] = useState<ITUser[]>([]);

  const fetchTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus && viewMode === 'list') params.set('status', filterStatus);
    if (filterType) params.set('type', filterType);
    if (search) params.set('search', search);
    const res = await fetch(`/api/it/tickets?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    setTickets(json.data ?? []);
  }, [filterStatus, filterType, search, viewMode]);

  const fetchITUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/it/settings/team', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setItUsers(json.data ?? []);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void fetchTickets().finally(() => setLoading(false));
  }, [fetchTickets]);

  useEffect(() => {
    void fetchITUsers();
  }, [fetchITUsers]);

  function openEdit(ticket: TicketRecord) {
    setEditTicket(ticket);
    setEditForm({
      title: ticket.title,
      description: ticket.description,
      type: ticket.type,
      priority: ticket.priority,
      assignedToId: ticket.assignedTo?.id ?? '',
    });
  }

  async function handleCreate() {
    if (!form.title.trim() || !form.description.trim()) {
      error('Missing fields', 'Title and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/it/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        error('Failed to create ticket', j.error ?? 'An error occurred.');
        return;
      }
      success('Ticket created', 'Your IT ticket has been submitted.');
      setForm(EMPTY_FORM);
      setShowForm(false);
      void fetchTickets();
    } catch {
      error('Failed to create ticket', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit() {
    if (!editTicket) return;
    if (!editForm.title.trim() || !editForm.description.trim()) {
      error('Missing fields', 'Title and description are required.');
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/it/tickets/${editTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          type: editForm.type,
          priority: editForm.priority,
          assignedToId: editForm.assignedToId || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        error('Failed to update ticket', j.error ?? 'An error occurred.');
        return;
      }
      success('Ticket updated', 'Changes saved successfully.');
      setEditTicket(null);
      setSelectedTicket(null);
      void fetchTickets();
    } catch {
      error('Failed to update ticket', 'An unexpected error occurred.');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(ticketId: number) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/it/tickets/${ticketId}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json();
        error('Failed to delete ticket', j.error ?? 'An error occurred.');
        return;
      }
      success('Ticket deleted', 'The ticket has been removed.');
      setConfirmDeleteId(null);
      setSelectedTicket(null);
      void fetchTickets();
    } catch {
      error('Failed to delete ticket', 'An unexpected error occurred.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(ticketId: number, newStatus: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/it/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const j = await res.json();
        error('Failed to update', j.error ?? 'An error occurred.');
        return;
      }
      success('Ticket updated', `Status changed to ${newStatus.replace('_', ' ')}.`);
      setSelectedTicket(null);
      void fetchTickets();
    } catch {
      error('Failed to update', 'An unexpected error occurred.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Ticketing System</h1>
          <p className="text-sm text-slate-500 mt-1">Report and track IT issues, requests, and service tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <LayoutList size={14} className="inline mr-1" /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <Columns3 size={14} className="inline mr-1" /> Kanban
            </button>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-cyan-700 hover:bg-cyan-800 text-white">
            <Plus size={16} className="mr-2" /> New Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {viewMode === 'list' && (
          <select
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_INFO">Pending Info</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        )}
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-white"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Card>

      {/* New ticket form */}
      {showForm && (
        <Card className="p-5 border-cyan-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">New Ticket</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Priority</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Title</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
              placeholder="Brief summary of the issue"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 resize-none"
              placeholder="Describe the issue in detail…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-cyan-700 hover:bg-cyan-800 text-white">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Submit Ticket
            </Button>
          </div>
        </Card>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-cyan-700" /></div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <Ticket size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tickets found</p>
          <p className="text-slate-400 text-sm mt-1">Adjust filters or submit a new ticket.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Ticket size={16} className="text-cyan-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</span>
                    <Badge variant={STATUS_VARIANT[ticket.status] ?? 'neutral'} className="text-[9px]">{ticket.status.replace('_', ' ')}</Badge>
                    <Badge variant={PRIORITY_VARIANT[ticket.priority] ?? 'neutral'} className="text-[9px]">{ticket.priority}</Badge>
                    <span className="text-xs text-slate-400">{TYPE_LABELS[ticket.type] ?? ticket.type}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{ticket.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><User size={11} />{ticket.reportedBy.name}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{new Date(ticket.createdAt).toLocaleDateString('en-PH')}</span>
                    {ticket.assignedTo && <span className="text-cyan-600 font-medium">→ {ticket.assignedTo.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Edit ticket"
                    onClick={(e) => { e.stopPropagation(); openEdit(ticket); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-700 transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete ticket"
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(ticket.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-cyan-700" /></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
          {KANBAN_COLUMNS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="flex-none w-72"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedTicketId !== null) {
                    const dragged = tickets.find((t) => t.id === draggedTicketId);
                    if (dragged && dragged.status !== col.key) {
                      void handleStatusChange(draggedTicketId, col.key);
                    }
                    setDraggedTicketId(null);
                  }
                }}
              >
                <div
                  style={{ borderTopColor: col.color }}
                  className="bg-slate-50 rounded-2xl border-t-4 p-3 min-h-40"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{col.label}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
                      {colTickets.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {colTickets.length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-6">No tickets</p>
                    )}
                    {colTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); setDraggedTicketId(ticket.id); }}
                        onDragEnd={() => setDraggedTicketId(null)}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md cursor-grab active:cursor-grabbing transition-all ${
                          draggedTicketId === ticket.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono text-slate-400">{ticket.ticketNumber}</span>
                          <Badge variant={PRIORITY_VARIANT[ticket.priority] ?? 'neutral'} className="text-[8px] px-1.5 py-0 shrink-0">{ticket.priority}</Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 mb-1.5">{ticket.title}</p>
                        <p className="text-[11px] text-slate-400 mb-2 truncate">{TYPE_LABELS[ticket.type] ?? ticket.type}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <User size={10} /> {ticket.reportedBy.name.split(' ')[0]}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="Edit"
                              onClick={(e) => { e.stopPropagation(); openEdit(ticket); }}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-cyan-700 transition"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(ticket.id); }}
                              className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                        {ticket.assignedTo && (
                          <p className="text-[10px] text-cyan-600 font-medium mt-1.5 truncate">→ {ticket.assignedTo.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Detail panel */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-mono text-slate-400">{selectedTicket.ticketNumber}</span>
                <h3 className="font-black text-slate-900 mt-0.5 wrap-break-word">{selectedTicket.title}</h3>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <button
                  type="button"
                  title="Edit ticket"
                  onClick={() => openEdit(selectedTicket)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-700 transition"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  title="Delete ticket"
                  onClick={() => setConfirmDeleteId(selectedTicket.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={STATUS_VARIANT[selectedTicket.status] ?? 'neutral'}>{selectedTicket.status.replace('_', ' ')}</Badge>
                <Badge variant={PRIORITY_VARIANT[selectedTicket.priority] ?? 'neutral'}>{selectedTicket.priority}</Badge>
                <Badge variant="neutral">{TYPE_LABELS[selectedTicket.type] ?? selectedTicket.type}</Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{selectedTicket.description}</p>
              </div>
              {selectedTicket.resolution && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Resolution</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{selectedTicket.resolution}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Reported by</p>
                  <p className="font-medium text-slate-700">{selectedTicket.reportedBy.name}</p>
                </div>
                {selectedTicket.assignedTo && (
                  <div>
                    <p className="text-xs text-slate-400">Assigned to</p>
                    <p className="font-medium text-slate-700">{selectedTicket.assignedTo.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">Created</p>
                  <p className="font-medium text-slate-700">{new Date(selectedTicket.createdAt).toLocaleDateString('en-PH')}</p>
                </div>
              </div>
              {/* Status actions */}
              {selectedTicket.status !== 'CLOSED' && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Change Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'RESOLVED', 'CLOSED']
                      .filter((s) => s !== selectedTicket.status)
                      .map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          className="text-xs"
                          disabled={updatingStatus}
                          onClick={() => void handleStatusChange(selectedTicket.id, s)}
                        >
                          {updatingStatus ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                          → {s.replace('_', ' ')}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
              {selectedTicket.status === 'CLOSED' && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 size={16} /> Ticket closed
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTicket && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4" onClick={() => setEditTicket(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">Edit Ticket</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{editTicket.ticketNumber}</p>
              </div>
              <button type="button" onClick={() => setEditTicket(null)}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Title</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 resize-none"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={editForm.type}
                    onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Priority</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={editForm.priority}
                    onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Assign To</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  value={editForm.assignedToId}
                  onChange={(e) => setEditForm((f) => ({ ...f, assignedToId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {itUsers
                    .filter((u) => u.userId !== null)
                    .map((u) => (
                      <option key={u.userId} value={u.userId!}>{u.name}</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTicket(null)}>Cancel</Button>
              <Button
                onClick={handleEditSubmit}
                disabled={editSubmitting}
                className="bg-cyan-700 hover:bg-cyan-800 text-white"
              >
                {editSubmitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <h3 className="font-black text-slate-900 mb-1">Delete Ticket</h3>
            <p className="text-sm text-slate-500 mb-6">
              This action cannot be undone. The ticket will be permanently removed.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => void handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
