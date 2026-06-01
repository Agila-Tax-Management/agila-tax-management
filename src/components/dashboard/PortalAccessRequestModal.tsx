// src/components/dashboard/PortalAccessRequestModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Send, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

type RequestedPortal =
  | 'SALES' | 'COMPLIANCE' | 'LIAISON' | 'ACCOUNTING'
  | 'OPERATIONS_MANAGEMENT' | 'HR' | 'TASK_MANAGEMENT'
  | 'CLIENT_RELATIONS' | 'IT_MANAGEMENT';

type RequestedRole = 'VIEWER' | 'USER' | 'ADMIN' | 'SETTINGS';

interface PortalAccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PORTALS: { value: RequestedPortal; label: string }[] = [
  { value: 'SALES',                label: 'Sales Portal' },
  { value: 'COMPLIANCE',           label: 'Compliance Portal' },
  { value: 'LIAISON',              label: 'Liaison Portal' },
  { value: 'ACCOUNTING',           label: 'ACF Portal' },
  { value: 'OPERATIONS_MANAGEMENT',label: 'Operations Management Portal' },
  { value: 'HR',                   label: 'HR Portal' },
  { value: 'TASK_MANAGEMENT',      label: 'Task Management Portal' },
  { value: 'CLIENT_RELATIONS',     label: 'Client Relations Portal' },
  { value: 'IT_MANAGEMENT',        label: 'IT Portal' },
];

const ROLES: { value: RequestedRole; label: string; description: string }[] = [
  { value: 'VIEWER',   label: 'Viewer',   description: 'Read-only access' },
  { value: 'USER',     label: 'User',     description: 'Standard operations (Maker)' },
  { value: 'ADMIN',    label: 'Admin',    description: 'Approvals & deletions (Checker)' },
  { value: 'SETTINGS', label: 'Settings', description: 'Full portal configuration' },
];

interface FormState {
  requestedPortal: RequestedPortal;
  requestedRole: RequestedRole;
  reason: string;
}

const DEFAULT_FORM: FormState = {
  requestedPortal: 'SALES',
  requestedRole: 'VIEWER',
  reason: '',
};

export function PortalAccessRequestModal({ isOpen, onClose }: PortalAccessRequestModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    if (submitting) return;
    setForm(DEFAULT_FORM);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reason.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/it/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit request');
      success('Access request submitted', 'The IT team will review your portal access request.');
      handleClose();
    } catch (err) {
      error('Submission failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <KeyRound size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Request Portal Access</h2>
              <p className="text-xs text-muted-foreground">Submit a request to the IT team</p>
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
          {/* Portal */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Portal <span className="text-red-500">*</span></label>
            <select
              value={form.requestedPortal}
              onChange={(e) => setForm((f) => ({ ...f, requestedPortal: e.target.value as RequestedPortal }))}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {PORTALS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Access Level <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, requestedRole: r.value }))}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                    form.requestedRole === r.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-border hover:border-muted-foreground text-foreground'
                  }`}
                >
                  <span className="text-xs font-semibold">{r.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{r.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Reason / Justification <span className="text-red-500">*</span></label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Explain why you need access to this portal..."
              rows={3}
              required
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
              disabled={submitting || !form.reason.trim()}
              className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Submitting…</>
              ) : (
                <><Send size={14} /> Submit Request</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
