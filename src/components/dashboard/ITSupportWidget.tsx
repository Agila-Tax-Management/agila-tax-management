// src/components/dashboard/ITSupportWidget.tsx
'use client';

import React, { useState } from 'react';
import { Monitor, X, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

type TicketType = 'BUG' | 'SYSTEM_ISSUE' | 'DOWNTIME' | 'CREATE_USER' | 'REVOKE_ACCESS' | 'HARDWARE_REQUEST' | 'SOFTWARE_REQUEST' | 'OTHER';
type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface FormState {
  type: TicketType;
  priority: TicketPriority;
  title: string;
  description: string;
}

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
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-500' },
  { value: 'HIGH',   label: 'High',   color: 'text-amber-500' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-500' },
];

const DEFAULT_FORM: FormState = {
  type: 'OTHER',
  priority: 'NORMAL',
  title: '',
  description: '',
};

export function ITSupportWidget(): React.ReactNode {
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  function handleOpen() {
    setForm(DEFAULT_FORM);
    setIsOpen(true);
  }

  function handleClose() {
    if (submitting) return;
    setIsOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/it/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { data?: { ticketNumber: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit ticket');
      success('Ticket submitted', `Your IT support ticket ${data.data?.ticketNumber ?? ''} has been created.`);
      setIsOpen(false);
    } catch (err) {
      error('Submission failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Trigger card — same style as EMPLOYEE_SERVICES cards */}
      <button
        type="button"
        onClick={handleOpen}
        className="group flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-cyan-400 hover:shadow-md transition-all text-left w-full"
      >
        <div className="w-10 h-10 rounded-xl bg-cyan-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Monitor size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">IT Support</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Report a bug, request hardware, or get technical help.
          </p>
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-700 flex items-center justify-center">
                  <Monitor size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">IT Support Request</h2>
                  <p className="text-xs text-muted-foreground">Submit a ticket to the IT team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type + Priority row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TicketType }))}
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
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Subject <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Brief summary of the issue"
                  maxLength={120}
                  required
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue, steps to reproduce, or what you need..."
                  rows={4}
                  required
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="text-sm px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim() || !form.description.trim()}
                  className="text-sm px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                  ) : (
                    <><Send size={14} /> Submit Ticket</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
