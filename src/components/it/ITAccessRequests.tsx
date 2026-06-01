// src/components/it/ITAccessRequests.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import {
  Plus, Search, ShieldCheck, X, Loader2, User, CheckCircle2, XCircle, Trash2, AlertTriangle, UserCheck,
} from 'lucide-react';

interface Approver {
  id: number;
  user: { id: string; name: string; email: string; role: string };
}

interface AccessRequest {
  id: number;
  requestedPortal: string;
  requestedRole: string;
  status: string;
  reason: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  requestedBy: { id: number; firstName: string; lastName: string; employeeNo: string | null; user: { image: string | null } | null };
  reviewedBy: { id: string; name: string } | null;
}

const PORTALS = [
  'SALES', 'COMPLIANCE', 'LIAISON', 'ACCOUNTING', 'OPERATIONS_MANAGEMENT',
  'HR', 'TASK_MANAGEMENT', 'CLIENT_RELATIONS', 'IT_MANAGEMENT',
];
const ROLES = ['VIEWER', 'USER', 'ADMIN', 'SETTINGS'];

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const EMPTY_FORM = { requestedPortal: 'SALES', requestedRole: 'VIEWER', reason: '' };

export function ITAccessRequests() {
  const { success, error } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Approval confirmation modal state
  const [approveTarget, setApproveTarget] = useState<AccessRequest | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [approversLoading, setApproversLoading] = useState(false);
  const [confirmedByName, setConfirmedByName] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [approveNote, setApproveNote] = useState('');

  const fetchRequests = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    const res = await fetch(`/api/it/access-requests?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    const all: AccessRequest[] = json.data ?? [];
    const filtered = search
      ? all.filter((r) =>
          `${r.requestedBy.firstName} ${r.requestedBy.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          r.requestedPortal.toLowerCase().includes(search.toLowerCase()),
        )
      : all;
    setRequests(filtered);
  }, [filterStatus, search]);

  useEffect(() => {
    setLoading(true);
    void fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  async function handleCreate() {
    if (!form.reason.trim()) { error('Missing reason', 'Please provide a reason for your request.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/it/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const j = await res.json(); error('Failed', j.error ?? 'Error occurred.'); return; }
      success('Request submitted', 'Your access request is pending IT review.');
      setForm(EMPTY_FORM);
      setShowForm(false);
      void fetchRequests();
    } catch { error('Failed', 'Unexpected error.'); }
    finally { setSubmitting(false); }
  }

  async function handleReview(id: number, status: 'APPROVED' | 'REJECTED', note?: string) {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/it/access-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote: note ?? reviewNote }),
      });
      if (!res.ok) { const j = await res.json(); error('Failed', j.error ?? 'Error occurred.'); return; }
      success(`Request ${status.toLowerCase()}`, `Access request has been ${status.toLowerCase()}.`);
      setReviewNote('');
      setApproveTarget(null);
      void fetchRequests();
    } catch { error('Failed', 'Unexpected error.'); }
    finally { setReviewingId(null); }
  }

  function openApproveModal(req: AccessRequest) {
    setApproveTarget(req);
    setConfirmedByName('');
    setAcknowledged(false);
    setApproveNote('');
    setApproversLoading(true);
    fetch('/api/it/settings/approvers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setApprovers(j.data ?? []))
      .catch(() => setApprovers([]))
      .finally(() => setApproversLoading(false));
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/it/access-requests/${id}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json(); error('Failed to delete', j.error ?? 'Error occurred.'); return; }
      success('Request deleted', 'The access request has been removed.');
      setConfirmDeleteId(null);
      void fetchRequests();
    } catch { error('Failed', 'Unexpected error.'); }
    finally { setDeleting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Portal Access Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve employee portal access requests.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-cyan-700 hover:bg-cyan-800 text-white">
          <Plus size={16} className="mr-2" /> New Request
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            placeholder="Search by name or portal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </Card>

      {/* New request form */}
      {showForm && (
        <Card className="p-5 border-cyan-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Request Portal Access</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Portal</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.requestedPortal}
                onChange={(e) => setForm((f) => ({ ...f, requestedPortal: e.target.value }))}
              >
                {PORTALS.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Role</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.requestedRole}
                onChange={(e) => setForm((f) => ({ ...f, requestedRole: e.target.value }))}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Reason</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 resize-none"
              placeholder="Explain why you need this access…"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-cyan-700 hover:bg-cyan-800 text-white">
              {submitting && <Loader2 size={14} className="animate-spin mr-2" />}Submit
            </Button>
          </div>
        </Card>
      )}

      {/* Request list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-cyan-700" /></div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldCheck size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No access requests found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={16} className="text-cyan-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={STATUS_VARIANT[req.status] ?? 'neutral'} className="text-[9px]">{req.status}</Badge>
                    <span className="text-xs font-bold text-slate-700">{req.requestedPortal.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{req.requestedRole}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <User size={11} />
                    <span>{req.requestedBy.firstName} {req.requestedBy.lastName}</span>
                    {req.requestedBy.employeeNo && <span className="text-slate-400">({req.requestedBy.employeeNo})</span>}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{req.reason}</p>
                  {req.reviewNote && (
                    <p className="text-xs text-slate-400 mt-1 italic">Review note: {req.reviewNote}</p>
                  )}
                  {/* Review actions */}
                  {req.status === 'PENDING' && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <input
                        className="flex-1 min-w-32 px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-600"
                        placeholder="Optional review note…"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                        onClick={() => openApproveModal(req)}
                      >
                        <CheckCircle2 size={12} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="text-xs border-red-200 text-red-600 hover:bg-red-50 h-8"
                        disabled={reviewingId === req.id}
                        onClick={() => void handleReview(req.id, 'REJECTED')}
                      >
                        {reviewingId === req.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <XCircle size={12} className="mr-1" />}
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0">{new Date(req.createdAt).toLocaleDateString('en-PH')}</span>
                <button
                  type="button"
                  title="Delete request"
                  onClick={() => setConfirmDeleteId(req.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Approval confirmation modal */}
      {approveTarget !== null && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4" onClick={() => setApproveTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <UserCheck size={18} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Approve Access Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {approveTarget.requestedBy.firstName} {approveTarget.requestedBy.lastName} &middot;{' '}
                  {approveTarget.requestedPortal.replace(/_/g, ' ')} &middot; {approveTarget.requestedRole}
                </p>
              </div>
            </div>

            {/* Default approvers */}
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Contact an Approver First</p>
              {approversLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 size={13} className="animate-spin" /> Loading approvers…
                </div>
              ) : approvers.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">No default approvers configured. Go to IT Settings → Access Control to add approvers.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {approvers.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-cyan-700">{a.user.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{a.user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{a.user.email}</p>
                      </div>
                      <Badge variant="neutral" className="text-[9px] ml-auto shrink-0">{a.user.role.replace(/_/g, ' ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmed by */}
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-600 mb-1 block">Confirmed by <span className="text-red-500">*</span></label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Name of approver who authorized this…"
                value={confirmedByName}
                onChange={(e) => setConfirmedByName(e.target.value)}
              />
            </div>

            {/* Review note */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-600 mb-1 block">Review Note <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Any notes for the requester…"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
              />
            </div>

            {/* Acknowledgment */}
            <label className="flex items-start gap-2.5 cursor-pointer mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-emerald-600 cursor-pointer shrink-0"
              />
              <span className="text-xs text-emerald-800 leading-relaxed">
                I confirm I have contacted the approver, received authorization, and have <strong>manually granted the portal access</strong> before marking this request as approved.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!acknowledged || !confirmedByName.trim() || reviewingId === approveTarget.id}
                onClick={() => {
                  const note = confirmedByName.trim()
                    ? `Confirmed by: ${confirmedByName.trim()}${approveNote.trim() ? ` — ${approveNote.trim()}` : ''}`
                    : approveNote.trim();
                  void handleReview(approveTarget.id, 'APPROVED', note);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewingId === approveTarget.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : <CheckCircle2 size={14} />}
                Approve
              </button>
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
            <h3 className="font-black text-slate-900 mb-1">Delete Access Request</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1">Cancel</Button>
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
