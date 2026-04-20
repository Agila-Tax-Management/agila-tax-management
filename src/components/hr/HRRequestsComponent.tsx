// src/components/hr/HRRequestsComponent.tsx
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

type RequestType = 'LEAVE' | 'OVERTIME' | 'COA';
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface LeaveRequest {
  id: string;
  type: 'LEAVE';
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  creditUsed: number;
  reason: string;
  status: RequestStatus;
  attachmentUrl: string | null;
  appliedDate: string;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

interface OvertimeRequest {
  id: string;
  type: 'OVERTIME';
  employeeName: string;
  department: string;
  date: string;
  otType: string;
  hours: number;
  reason: string;
  status: RequestStatus;
  appliedDate: string;
  reviewedBy: string | null;
}

interface CoaRequest {
  id: string;
  type: 'COA';
  employeeName: string;
  department: string;
  dateAffected: string;
  actionType: string;
  timeValue: string;
  reason: string;
  status: RequestStatus;
  appliedDate: string;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

type UnifiedRequest = LeaveRequest | OvertimeRequest | CoaRequest;

// ─── Display maps ─────────────────────────────────────────────────

const STATUS_VARIANT: Record<RequestStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const TYPE_LABEL: Record<RequestType, string> = {
  LEAVE: 'Leave',
  OVERTIME: 'Overtime',
  COA: 'COA',
};

const TYPE_COLOR: Record<RequestType, string> = {
  LEAVE: 'bg-blue-100 text-blue-700',
  OVERTIME: 'bg-amber-100 text-amber-700',
  COA: 'bg-purple-100 text-purple-700',
};

const COA_ACTION_LABEL: Record<string, string> = {
  TIME_IN: 'Time In',
  LUNCH_START: 'Lunch Start',
  LUNCH_END: 'Lunch End',
  TIME_OUT: 'Time Out',
};

// ─── Raw API shapes ───────────────────────────────────────────────

interface ApiLeaveRequest {
  id: string;
  employeeName: string;
  department: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  creditUsed: number;
  reason: string;
  status: RequestStatus;
  attachmentUrl: string | null;
  appliedDate?: string;
  createdAt: string;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}

interface ApiOvertimeRequest {
  id: string;
  employeeName: string;
  department: string | null;
  date: string;
  type: string;
  hours: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  reviewedBy?: string | null;
}

interface ApiCoaRequest {
  id: string;
  employeeName: string;
  department: string | null;
  dateAffected: string;
  actionType: string;
  timeValue: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}

// ─── Component ────────────────────────────────────────────────────

export function HRRequestsComponent() {
  const { success, error } = useToast();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [overtimes, setOvertimes] = useState<OvertimeRequest[]>([]);
  const [coas, setCoas] = useState<CoaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: RequestType } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveRes, otRes, coaRes] = await Promise.all([
        fetch('/api/hr/leave-requests'),
        fetch('/api/hr/overtime-requests'),
        fetch('/api/hr/coa-requests'),
      ]);

      if (leaveRes.ok) {
        const json = (await leaveRes.json()) as { data?: ApiLeaveRequest[] };
        setLeaves(
          (json.data ?? []).map((r) => ({
            id: r.id,
            type: 'LEAVE' as const,
            employeeName: r.employeeName,
            department: r.department ?? '—',
            leaveType: r.leaveType,
            startDate: r.startDate,
            endDate: r.endDate,
            creditUsed: r.creditUsed,
            reason: r.reason,
            status: r.status,
            attachmentUrl: r.attachmentUrl,
            appliedDate: r.appliedDate ?? r.createdAt,
            reviewedBy: r.reviewedBy ?? null,
            rejectionReason: r.rejectionReason ?? null,
          })),
        );
      }

      if (otRes.ok) {
        const json = (await otRes.json()) as { data?: ApiOvertimeRequest[] };
        setOvertimes(
          (json.data ?? []).map((r) => ({
            id: r.id,
            type: 'OVERTIME' as const,
            employeeName: r.employeeName,
            department: r.department ?? '—',
            date: r.date,
            otType: r.type,
            hours: r.hours,
            reason: r.reason,
            status: r.status,
            appliedDate: r.createdAt,
            reviewedBy: r.reviewedBy ?? null,
          })),
        );
      }

      if (coaRes.ok) {
        const json = (await coaRes.json()) as { data?: ApiCoaRequest[] };
        setCoas(
          (json.data ?? []).map((r) => ({
            id: r.id,
            type: 'COA' as const,
            employeeName: r.employeeName,
            department: r.department ?? '—',
            dateAffected: r.dateAffected,
            actionType: r.actionType,
            timeValue: r.timeValue,
            reason: r.reason,
            status: r.status,
            appliedDate: r.createdAt,
            reviewedBy: r.reviewedBy ?? null,
            rejectionReason: r.rejectionReason ?? null,
          })),
        );
      }
    } catch {
      error('Load error', 'Could not fetch HR requests.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const allRequests = useMemo<UnifiedRequest[]>(() => {
    return [...leaves, ...overtimes, ...coas].sort(
      (a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime(),
    );
  }, [leaves, overtimes, coas]);

  const filtered = useMemo(() => {
    return allRequests.filter((r) => {
      const matchType = typeFilter === 'All' || r.type === typeFilter;
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        TYPE_LABEL[r.type].toLowerCase().includes(q);
      return matchType && matchStatus && matchSearch;
    });
  }, [allRequests, typeFilter, statusFilter, search]);

  const pendingCount = allRequests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = allRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = allRequests.filter((r) => r.status === 'REJECTED').length;
  const totalCount = allRequests.length;

  const getEndpoint = (type: RequestType, id: string) => {
    if (type === 'LEAVE') return `/api/hr/leave-requests/${id}`;
    if (type === 'OVERTIME') return `/api/hr/overtime-requests/${id}`;
    return `/api/hr/coa-requests/${id}`;
  };

  const handleApprove = async (req: UnifiedRequest) => {
    setActionLoading(true);
    try {
      const res = await fetch(getEndpoint(req.type, req.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to approve');
      success('Request approved', `${TYPE_LABEL[req.type]} request has been approved.`);
      setSelectedRequest(null);
      void fetchAll();
    } catch (err) {
      error('Approval failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (req: UnifiedRequest) => {
    setRejectTarget({ id: req.id, type: req.type });
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      const body: Record<string, string> = { action: 'REJECT' };
      if (rejectReason.trim()) body.rejectionReason = rejectReason.trim();
      const res = await fetch(getEndpoint(rejectTarget.type, rejectTarget.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to reject');
      success('Request rejected', `${TYPE_LABEL[rejectTarget.type]} request has been rejected.`);
      setRejectModalOpen(false);
      setRejectTarget(null);
      setSelectedRequest(null);
      void fetchAll();
    } catch (err) {
      error('Rejection failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getSummary = (req: UnifiedRequest): string => {
    if (req.type === 'LEAVE') {
      return `${req.leaveType} · ${req.startDate} → ${req.endDate} (${req.creditUsed.toFixed(2)}d)`;
    }
    if (req.type === 'OVERTIME') {
      return `${req.otType} · ${req.date} · ${req.hours}h`;
    }
    return `${COA_ACTION_LABEL[req.actionType] ?? req.actionType} · ${req.dateAffected}`;
  };

  const formatTime = (isoTime: string) => {
    const d = new Date(isoTime);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">HR Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage leave, overtime, and COA requests from employees
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalCount, color: 'text-foreground' },
          { label: 'Pending', value: pendingCount, color: 'text-amber-600' },
          { label: 'Approved', value: approvedCount, color: 'text-emerald-600' },
          { label: 'Rejected', value: rejectedCount, color: 'text-red-600' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by employee or department..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="LEAVE">Leave</option>
              <option value="OVERTIME">Overtime</option>
              <option value="COA">COA</option>
            </select>
          </div>
          <div>
            <select
              className="px-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                  Summary
                </th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                  Submitted
                </th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm">Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No requests found
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr
                    key={`${req.type}-${req.id}`}
                    className="border-b border-border hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{req.employeeName}</p>
                      <p className="text-[11px] text-muted-foreground">{req.department}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-full ${TYPE_COLOR[req.type]}`}
                      >
                        {TYPE_LABEL[req.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[220px] truncate">
                      {getSummary(req)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {req.appliedDate.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[req.status]}>{STATUS_LABEL[req.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {req.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              onClick={() => { void handleApprove(req); }}
                              title="Approve"
                              disabled={actionLoading}
                            >
                              <CheckCircle size={16} className="text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => openRejectModal(req)}
                              title="Reject"
                              disabled={actionLoading}
                            >
                              <XCircle size={16} className="text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedRequest(req)}
                          title="View details"
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Detail Modal */}
      <Modal
        isOpen={!!selectedRequest && !rejectModalOpen}
        onClose={() => setSelectedRequest(null)}
        title="Request Details"
        size="md"
      >
        {selectedRequest && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-6rem)]">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 bg-muted rounded-xl">
              <div>
                <span
                  className={`text-[11px] font-bold px-2 py-1 rounded-full ${TYPE_COLOR[selectedRequest.type]}`}
                >
                  {TYPE_LABEL[selectedRequest.type]}
                </span>
                <h3 className="text-lg font-black text-foreground mt-2">
                  {selectedRequest.employeeName}
                </h3>
                <p className="text-sm text-muted-foreground">{selectedRequest.department}</p>
              </div>
              <Badge variant={STATUS_VARIANT[selectedRequest.status]}>
                {STATUS_LABEL[selectedRequest.status]}
              </Badge>
            </div>

            {/* Leave fields */}
            {selectedRequest.type === 'LEAVE' && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Leave Type', value: selectedRequest.leaveType },
                  { label: 'Days Used', value: `${selectedRequest.creditUsed.toFixed(2)} day(s)` },
                  { label: 'Start Date', value: selectedRequest.startDate },
                  { label: 'End Date', value: selectedRequest.endDate },
                  { label: 'Submitted', value: selectedRequest.appliedDate.slice(0, 10) },
                  { label: 'Reviewed By', value: selectedRequest.reviewedBy ?? '—' },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {f.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Overtime fields */}
            {selectedRequest.type === 'OVERTIME' && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Date', value: selectedRequest.date },
                  { label: 'OT Type', value: selectedRequest.otType },
                  { label: 'Hours', value: `${selectedRequest.hours}h` },
                  { label: 'Submitted', value: selectedRequest.appliedDate.slice(0, 10) },
                  { label: 'Reviewed By', value: selectedRequest.reviewedBy ?? '—' },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {f.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* COA fields */}
            {selectedRequest.type === 'COA' && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Date Affected', value: selectedRequest.dateAffected },
                  {
                    label: 'Action',
                    value:
                      COA_ACTION_LABEL[selectedRequest.actionType] ?? selectedRequest.actionType,
                  },
                  { label: 'Corrected Time', value: formatTime(selectedRequest.timeValue) },
                  { label: 'Submitted', value: selectedRequest.appliedDate.slice(0, 10) },
                  { label: 'Reviewed By', value: selectedRequest.reviewedBy ?? '—' },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {f.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reason */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                Reason
              </p>
              <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                {selectedRequest.reason}
              </p>
            </div>

            {/* Rejection reason */}
            {(selectedRequest.type === 'LEAVE' || selectedRequest.type === 'COA') &&
              selectedRequest.rejectionReason && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

            {/* Pending actions */}
            {selectedRequest.status === 'PENDING' && (
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => { void handleApprove(selectedRequest); }}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                  onClick={() => openRejectModal(selectedRequest)}
                  disabled={actionLoading}
                >
                  <XCircle size={16} /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectTarget(null); }}
        title="Reject Request"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground">
            Provide an optional reason for rejecting this{' '}
            {rejectTarget ? TYPE_LABEL[rejectTarget.type].toLowerCase() : ''} request.
          </p>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
            rows={3}
            placeholder="Rejection reason (optional)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => { setRejectModalOpen(false); setRejectTarget(null); }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
              onClick={() => { void handleReject(); }}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
