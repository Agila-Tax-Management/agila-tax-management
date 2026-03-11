'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  LEAVE_REQUESTS, LeaveRequest, LeaveStatus,
} from '@/lib/mock-hr-data';

const STATUS_VARIANT: Record<LeaveStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Cancelled: 'neutral',
};

export function LeaveManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [leaves, setLeaves] = useState(LEAVE_REQUESTS);

  const filtered = useMemo(() => {
    return leaves.filter(leave => {
      const matchSearch = leave.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        leave.leaveType.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || leave.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, leaves]);

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;
  const totalDaysApproved = leaves.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.totalDays, 0);

  const handleApprove = (id: string) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'Approved' as LeaveStatus, reviewedBy: 'Patricia Lim', reviewedDate: new Date().toISOString().split('T')[0] } : l));
    setSelectedLeave(null);
  };

  const handleReject = (id: string) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'Rejected' as LeaveStatus, reviewedBy: 'Patricia Lim', reviewedDate: new Date().toISOString().split('T')[0] } : l));
    setSelectedLeave(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Leave Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage employee leave requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: pendingCount, color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved', value: approvedCount, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Rejected', value: rejectedCount, color: 'text-red-600 bg-red-50' },
          { label: 'Days Approved', value: totalDaysApproved, color: 'text-blue-600 bg-blue-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <p className={`text-2xl font-black ${stat.color.split(' ')[0]}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or leave type..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Dates</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Days</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(leave => (
                <tr key={leave.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{leave.employeeName}</p>
                    <p className="text-[11px] text-slate-400">{leave.department}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{leave.leaveType}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {leave.startDate} → {leave.endDate}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700 hidden sm:table-cell">{leave.totalDays}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[leave.status]}>{leave.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {leave.status === 'Pending' && (
                        <>
                          <Button variant="ghost" onClick={() => handleApprove(leave.id)} title="Approve">
                            <CheckCircle size={16} className="text-emerald-600" />
                          </Button>
                          <Button variant="ghost" onClick={() => handleReject(leave.id)} title="Reject">
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
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">No leave requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedLeave} onClose={() => setSelectedLeave(null)} title="Leave Request Details" size="md">
        {selectedLeave && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-4rem)]">
            <div className="p-4 bg-rose-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedLeave.employeeName}</h3>
                  <p className="text-sm text-slate-500">{selectedLeave.department}</p>
                </div>
                <Badge variant={STATUS_VARIANT[selectedLeave.status]}>{selectedLeave.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Leave Type', value: selectedLeave.leaveType },
                { label: 'Total Days', value: `${selectedLeave.totalDays} day(s)` },
                { label: 'Start Date', value: selectedLeave.startDate },
                { label: 'End Date', value: selectedLeave.endDate },
                { label: 'Applied Date', value: selectedLeave.appliedDate },
                { label: 'Reviewed By', value: selectedLeave.reviewedBy || '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{f.label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Reason</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedLeave.reason}</p>
            </div>

            {selectedLeave.status === 'Pending' && (
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => handleApprove(selectedLeave.id)}>
                  <CheckCircle size={16} /> Approve
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2" onClick={() => handleReject(selectedLeave.id)}>
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
