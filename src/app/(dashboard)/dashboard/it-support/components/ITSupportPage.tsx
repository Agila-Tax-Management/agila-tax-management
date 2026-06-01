// src/app/(dashboard)/dashboard/it-support/components/ITSupportPage.tsx
'use client';

import React, { useState } from 'react';
import { Monitor, KeyRound, Send, Loader2, Ticket } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

/* ─────────────────────────────────────────────────────────────── types ── */

type Tab = 'ticket' | 'access';

type TicketType =
  | 'BUG' | 'SYSTEM_ISSUE' | 'DOWNTIME' | 'CREATE_USER'
  | 'REVOKE_ACCESS' | 'HARDWARE_REQUEST' | 'SOFTWARE_REQUEST' | 'OTHER';

type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

type RequestedPortal =
  | 'SALES' | 'COMPLIANCE' | 'LIAISON' | 'ACCOUNTING'
  | 'OPERATIONS_MANAGEMENT' | 'HR' | 'TASK_MANAGEMENT'
  | 'CLIENT_RELATIONS' | 'IT_MANAGEMENT';

type RequestedRole = 'VIEWER' | 'USER' | 'ADMIN' | 'SETTINGS';

/* ────────────────────────────────────────────────────────── constants ── */

const TICKET_TYPES: { value: TicketType; label: string }[] = [
  { value: 'BUG',              label: 'Bug / Error' },
  { value: 'SYSTEM_ISSUE',     label: 'System Issue' },
  { value: 'DOWNTIME',         label: 'Downtime / Outage' },
  { value: 'HARDWARE_REQUEST', label: 'Hardware Request' },
  { value: 'SOFTWARE_REQUEST', label: 'Software Request' },
  { value: 'CREATE_USER',      label: 'Create User Account' },
  { value: 'REVOKE_ACCESS',    label: 'Revoke Access' },
  { value: 'OTHER',            label: 'Other' },
];

const PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'LOW',    label: 'Low',    color: 'text-slate-500' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-500'  },
  { value: 'HIGH',   label: 'High',   color: 'text-amber-500' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-500'   },
];

const PORTALS: { value: RequestedPortal; label: string }[] = [
  { value: 'SALES',                 label: 'Sales Portal' },
  { value: 'COMPLIANCE',            label: 'Compliance Portal' },
  { value: 'LIAISON',               label: 'Liaison Portal' },
  { value: 'ACCOUNTING',            label: 'ACF Portal' },
  { value: 'OPERATIONS_MANAGEMENT', label: 'Operations Management Portal' },
  { value: 'HR',                    label: 'HR Portal' },
  { value: 'TASK_MANAGEMENT',       label: 'Task Management Portal' },
  { value: 'CLIENT_RELATIONS',      label: 'Client Relations Portal' },
  { value: 'IT_MANAGEMENT',         label: 'IT Portal' },
];

const ROLES: { value: RequestedRole; label: string; description: string }[] = [
  { value: 'VIEWER',   label: 'Viewer',   description: 'Read-only access' },
  { value: 'USER',     label: 'User',     description: 'Standard operations (Maker)' },
  { value: 'ADMIN',    label: 'Admin',    description: 'Approvals & deletions (Checker)' },
  { value: 'SETTINGS', label: 'Settings', description: 'Full portal configuration' },
];

/* ──────────────────────────────────────────────────── default form states */

const DEFAULT_TICKET = { type: 'OTHER' as TicketType, priority: 'NORMAL' as TicketPriority, title: '', description: '' };
const DEFAULT_ACCESS  = { requestedPortal: 'SALES' as RequestedPortal, requestedRole: 'VIEWER' as RequestedRole, reason: '' };

/* ═══════════════════════════════════════════════════════════════ Page ═══ */

export function ITSupportPage(): React.ReactNode {
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>('ticket');

  /* ticket form */
  const [ticket, setTicket]       = useState(DEFAULT_TICKET);
  const [ticketBusy, setTicketBusy] = useState(false);

  /* access form */
  const [access, setAccess]       = useState(DEFAULT_ACCESS);
  const [accessBusy, setAccessBusy] = useState(false);

  /* ── handlers ─────────────────────────────────────────────────────── */

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket.title.trim() || !ticket.description.trim()) return;
    setTicketBusy(true);
    try {
      const res  = await fetch('/api/it/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      });
      const data = await res.json() as { data?: { ticketNumber: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit ticket');
      success('Ticket submitted', `Your IT support ticket ${data.data?.ticketNumber ?? ''} has been created.`);
      setTicket(DEFAULT_TICKET);
    } catch (err) {
      error('Submission failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setTicketBusy(false);
    }
  }

  async function submitAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!access.reason.trim()) return;
    setAccessBusy(true);
    try {
      const res  = await fetch('/api/it/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(access),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit request');
      success('Access request submitted', 'The IT team will review your portal access request.');
      setAccess(DEFAULT_ACCESS);
    } catch (err) {
      error('Submission failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setAccessBusy(false);
    }
  }

  /* ── render ────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-cyan-700 flex items-center justify-center shrink-0">
          <Monitor size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">IT Support</h1>
          <p className="text-sm text-muted-foreground">Submit a ticket or request access to a portal</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('ticket')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'ticket'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Ticket size={14} />
          Submit Ticket
        </button>
        <button
          type="button"
          onClick={() => setTab('access')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'access'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <KeyRound size={14} />
          Request Portal Access
        </button>
      </div>

      {/* ── Submit Ticket ─────────────────────────────────────────────── */}
      {tab === 'ticket' && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3 pb-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-700 flex items-center justify-center shrink-0">
              <Ticket size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Submit a Support Ticket</p>
              <p className="text-xs text-muted-foreground">Report a bug, request hardware, or get technical help</p>
            </div>
          </div>

          <form onSubmit={submitTicket} className="space-y-4">
            {/* Type + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select
                  value={ticket.type}
                  onChange={(e) => setTicket((f) => ({ ...f, type: e.target.value as TicketType }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => setTicket((f) => ({ ...f, priority: e.target.value as TicketPriority }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ticket.title}
                onChange={(e) => setTicket((f) => ({ ...f, title: e.target.value }))}
                placeholder="Brief summary of the issue"
                maxLength={120}
                required
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={ticket.description}
                onChange={(e) => setTicket((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue, steps to reproduce, or what you need…"
                rows={5}
                required
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={ticketBusy || !ticket.title.trim() || !ticket.description.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ticketBusy
                  ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                  : <><Send size={14} /> Submit Ticket</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Request Portal Access ──────────────────────────────────────── */}
      {tab === 'access' && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3 pb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <KeyRound size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Request Portal Access</p>
              <p className="text-xs text-muted-foreground">Request access to a portal — the IT team will review</p>
            </div>
          </div>

          <form onSubmit={submitAccess} className="space-y-4">
            {/* Portal */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Portal</label>
              <select
                value={access.requestedPortal}
                onChange={(e) => setAccess((f) => ({ ...f, requestedPortal: e.target.value as RequestedPortal }))}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {PORTALS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Access level */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Access Level</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAccess((f) => ({ ...f, requestedRole: r.value }))}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      access.requestedRole === r.value
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-border text-muted-foreground hover:border-indigo-400 hover:text-foreground'
                    }`}
                  >
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-[11px] mt-0.5 leading-snug">{r.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={access.reason}
                onChange={(e) => setAccess((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Explain why you need access to this portal…"
                rows={4}
                required
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={accessBusy || !access.reason.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accessBusy
                  ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                  : <><Send size={14} /> Submit Request</>}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
