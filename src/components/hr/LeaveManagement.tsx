// src/components/hr/LeaveManagement.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface LeaveRecord {
  id: string;
  employeeId: number;
  employeeName: string;
  department: string;
  leaveTypeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  creditUsed: number;
  reason: string;
  status: LeaveStatus;
  attachmentUrl: string | null;
  appliedDate: string;
  reviewedBy: string | null;
  reviewedDate: string | null;
  rejectionReason: string | null;
}

const STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const STATUS_VARIANT: Record<LeaveStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export function LeaveManagement() {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/hr/leave-requests?${params.toString()}`);
      const json = await res.json() as { data?: LeaveRecord[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load');
      setLeaves(json.data ?? []);
    } catch {
      error('Failed to load', 'Could not fetch leave requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, error]);

  useEffect(() => {
    void fetchLeaves();
  }, [fetchLeaves]);

  const filtered = useMemo(() => leaves, [leaves]);

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;
  const totalDaysApproved = leaves
    .filter(l => l.status === 'APPROVED')
    .reduce((sum, l) => sum + l.creditUsed, 0);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/hr/leave-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to update');
      success(
        action === 'APPROVE' ? 'Leave approved' : 'Leave rejected',
        `The leave request has been ${action === 'APPROVE' ? 'approved' : 'rejected'}.`,
      );
      setSelectedLeave(null);
      void fetchLeaves();
    } catch (err) {
      error('Action failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Leave Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage employee leave requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: pendingCount, color: 'text-amber-600' },
          { label: 'Approved', value: approvedCount, color: 'text-emerald-600' },
          { label: 'Rejected', value: rejectedCount, color: 'text-red-600' },
          { label: 'Days Approved', value: totalDaysApproved.toFixed(1), color: 'text-blue-600' },
        ].map(stat => (
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
              placeholder="Search by name or leave type..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
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
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Dates</th>
                <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Days</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                filtered.map(leave => (
                  <tr key={leave.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{leave.employeeName}</p>
                      <p className="text-[11px] text-muted-foreground">{leave.department}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{leave.leaveType}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {leave.startDate} → {leave.endDate}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-foreground hidden sm:table-cell">
                      {leave.creditUsed.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[leave.status]}>
                        {STATUS_LABEL[leave.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {leave.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              onClick={() => handleAction(leave.id, 'APPROVE')}
                              title="Approve"
                              disabled={actionLoading}
                            >
                              <CheckCircle size={16} className="text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleAction(leave.id, 'REJECT')}
                              title="Reject"
                              disabled={actionLoading}
                            >
                              <XCircle size={16} className="text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" onClick={() => setSelectedLeave(leave)}>
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        title="Leave Request Details"
        size="md"
      >
        {selectedLeave && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-4rem)]">
            <div className="p-4 bg-rose-500/10 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground">{selectedLeave.employeeName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedLeave.department}</p>
                </div>
                <Badge variant={STATUS_VARIANT[selectedLeave.status]}>
                  {STATUS_LABEL[selectedLeave.status]}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Leave Type', value: selectedLeave.leaveType },
                { label: 'Days Used', value: `${selectedLeave.creditUsed.toFixed(2)} day(s)` },
                { label: 'Start Date', value: selectedLeave.startDate },
                { label: 'End Date', value: selectedLeave.endDate },
                { label: 'Applied Date', value: selectedLeave.appliedDate },
                { label: 'Reviewed By', value: selectedLeave.reviewedBy ?? '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{f.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Reason</p>
              <p className="text-sm text-foreground bg-muted p-3 rounded-lg">{selectedLeave.reason}</p>
            </div>

            {selectedLeave.rejectionReason && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Rejection Reason
                </p>
                <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                  {selectedLeave.rejectionReason}
                </p>
              </div>
            )}

            {selectedLeave.status === 'PENDING' && (
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => handleAction(selectedLeave.id, 'APPROVE')}
                  disabled={actionLoading}
                >
                  <CheckCircle size={16} /> Approve
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                  onClick={() => handleAction(selectedLeave.id, 'REJECT')}
                  disabled={actionLoading}
                >
                  <XCircle size={16} /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
