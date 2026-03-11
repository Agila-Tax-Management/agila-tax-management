'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, FileQuestion, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  HR_REQUESTS, HRRequest, HRRequestStatus,
} from '@/lib/mock-hr-data';

const STATUS_VARIANT: Record<HRRequestStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  Open: 'warning',
  'In Progress': 'info',
  Resolved: 'success',
  Closed: 'neutral',
};

const PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'neutral'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
};

export function HRRequestsComponent() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRequest, setSelectedRequest] = useState<HRRequest | null>(null);
  const [requests, setRequests] = useState(HR_REQUESTS);

  const filtered = useMemo(() => {
    return requests.filter(req => {
      const matchSearch = req.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        req.subject.toLowerCase().includes(search.toLowerCase()) ||
        req.requestType.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || req.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, requests]);

  const openCount = requests.filter(r => r.status === 'Open').length;
  const inProgressCount = requests.filter(r => r.status === 'In Progress').length;
  const resolvedCount = requests.filter(r => r.status === 'Resolved').length;
  const highPriorityCount = requests.filter(r => r.priority === 'High' && (r.status === 'Open' || r.status === 'In Progress')).length;

  const handleAssign = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'In Progress' as HRRequestStatus, assignedTo: 'Patricia Lim' } : r));
    setSelectedRequest(null);
  };

  const handleResolve = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Resolved' as HRRequestStatus, resolvedDate: new Date().toISOString().split('T')[0] } : r));
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">HR Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Handle employee requests from the HR Application</p>
      </div>

      {/* Notice */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <AlertCircle size={18} className="text-blue-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-blue-800">HR Application Integration Pending</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Requests shown are from mock data. The HR Application module (not yet built) will feed real employee requests here.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open', value: openCount, color: 'text-amber-600 bg-amber-50' },
          { label: 'In Progress', value: inProgressCount, color: 'text-blue-600 bg-blue-50' },
          { label: 'Resolved', value: resolvedCount, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'High Priority', value: highPriorityCount, color: 'text-red-600 bg-red-50' },
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
              placeholder="Search by name, subject, or request type..."
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
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
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
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Subject</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Priority</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${req.priority === 'High' && req.status === 'Open' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{req.employeeName}</p>
                    <p className="text-[11px] text-slate-400">{req.department}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs hidden md:table-cell">{req.requestType}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{req.subject}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <Badge variant={PRIORITY_VARIANT[req.priority]}>{req.priority}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[req.status]}>{req.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" onClick={() => setSelectedRequest(req)}>
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">No HR requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="HR Request Details" size="md">
        {selectedRequest && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-4rem)]">
            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedRequest.employeeName}</h3>
                <p className="text-sm text-slate-500">{selectedRequest.department}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={STATUS_VARIANT[selectedRequest.status]}>{selectedRequest.status}</Badge>
                <Badge variant={PRIORITY_VARIANT[selectedRequest.priority]}>{selectedRequest.priority}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Request Type', value: selectedRequest.requestType },
                { label: 'Submitted', value: selectedRequest.submittedDate },
                { label: 'Assigned To', value: selectedRequest.assignedTo || 'Unassigned' },
                { label: 'Resolved Date', value: selectedRequest.resolvedDate || '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{f.label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Subject</p>
              <p className="text-sm font-bold text-slate-900">{selectedRequest.subject}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Description</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRequest.description}</p>
            </div>

            {(selectedRequest.status === 'Open' || selectedRequest.status === 'In Progress') && (
              <div className="flex gap-3 pt-2">
                {selectedRequest.status === 'Open' && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => handleAssign(selectedRequest.id)}>
                    <UserPlus size={16} /> Assign & Start
                  </Button>
                )}
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => handleResolve(selectedRequest.id)}>
                  <CheckCircle size={16} /> Resolve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
