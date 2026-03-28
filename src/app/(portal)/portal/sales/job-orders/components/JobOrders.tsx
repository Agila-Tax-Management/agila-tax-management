// src/app/(portal)/portal/sales/job-orders/components/JobOrders.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, ClipboardList, Eye, Pencil, Trash2,
  RefreshCw, CheckCircle2, Clock, AlertCircle, XCircle, FileCheck,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { JobOrderFormModal } from './JobOrderFormModal';
import { JobOrderViewModal } from './JobOrderViewModal';
import { JobOrderDeleteModal } from './JobOrderDeleteModal';

// ─── Types ────────────────────────────────────────────────────────

export type JobOrderStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED';

export interface JobOrderItem {
  id: string;
  itemType: 'SUBSCRIPTION' | 'ONE_TIME';
  serviceName: string;
  rate: string;        // Decimal serialized as string
  discount: string;
  total: string;
  remarks: string | null;
}

export interface JobOrderRecord {
  id: string;
  jobOrderNumber: string;
  date: string;
  status: JobOrderStatus;
  notes: string | null;
  leadId: number;
  lead: {
    id: number;
    firstName: string;
    lastName: string;
    businessName: string | null;
    contactNumber: string | null;
    businessType: string;
  };
  clientId: number | null;
  client: { id: number; businessName: string } | null;
  preparedById: string | null;
  preparedBy: { id: string; name: string } | null;
  datePrepared: string | null;
  accountManagerId: string | null;
  accountManager: { id: string; name: string } | null;
  dateAccountManagerAck: string | null;
  operationsManagerId: string | null;
  operationsManager: { id: string; name: string } | null;
  dateOperationsManagerAck: string | null;
  executiveId: string | null;
  executive: { id: string; name: string } | null;
  dateExecutiveAck: string | null;
  items: JobOrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Status Config ────────────────────────────────────────────────

const STATUS_CONFIG: Record<JobOrderStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: <Clock size={12} />,
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <AlertCircle size={12} />,
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <FileCheck size={12} />,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={12} />,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: <XCircle size={12} />,
  },
};

const STATUS_FILTERS: { value: JobOrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// ─── Component ────────────────────────────────────────────────────

export function JobOrders(): React.ReactNode {
  const { error } = useToast();

  const [jobOrders, setJobOrders] = useState<JobOrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobOrderStatus | 'ALL'>('ALL');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedJO, setSelectedJO] = useState<JobOrderRecord | null>(null);

  // Pagination reset on filter change (adjust during render)
  const [currentPage, setCurrentPage] = useState(1);
  const [prevFilters, setPrevFilters] = useState({ searchTerm, statusFilter });
  if (prevFilters.searchTerm !== searchTerm || prevFilters.statusFilter !== statusFilter) {
    setPrevFilters({ searchTerm, statusFilter });
    setCurrentPage(1);
  }

  const PAGE_SIZE = 10;

  const fetchJobOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sales/job-orders');
      if (!res.ok) throw new Error('Failed to load job orders');
      const json = await res.json() as { data: JobOrderRecord[] };
      setJobOrders(json.data);
    } catch {
      error('Failed to load', 'Could not fetch job orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchJobOrders();
  }, [fetchJobOrders]);

  // ─── Filtered + Paginated ────────────────────────────────────────

  const filtered = jobOrders.filter((jo) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      jo.jobOrderNumber.toLowerCase().includes(q) ||
      jo.lead.firstName.toLowerCase().includes(q) ||
      jo.lead.lastName.toLowerCase().includes(q) ||
      (jo.lead.businessName ?? '').toLowerCase().includes(q) ||
      (jo.client?.businessName ?? '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || jo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ─── Handlers ────────────────────────────────────────────────────

  const handleNew = () => {
    setSelectedJO(null);
    setIsFormOpen(true);
  };

  const handleEdit = (jo: JobOrderRecord) => {
    setSelectedJO(jo);
    setIsFormOpen(true);
  };

  const handleView = (jo: JobOrderRecord) => {
    setSelectedJO(jo);
    setIsViewOpen(true);
  };

  const handleDelete = (jo: JobOrderRecord) => {
    setSelectedJO(jo);
    setIsDeleteOpen(true);
  };

  const handleFormSuccess = (updated: JobOrderRecord) => {
    setJobOrders((prev) => {
      const idx = prev.findIndex((j) => j.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
    // Refresh view modal if open
    if (isViewOpen && selectedJO?.id === updated.id) {
      setSelectedJO(updated);
    }
  };

  const handleDeleteSuccess = (id: string) => {
    setJobOrders((prev) => prev.filter((j) => j.id !== id));
    setIsDeleteOpen(false);
  };

  const handleAcknowledgmentUpdate = (updated: JobOrderRecord) => {
    setJobOrders((prev) =>
      prev.map((j) => (j.id === updated.id ? updated : j)),
    );
    setSelectedJO(updated);
  };

  // ─── Counts per status ────────────────────────────────────────────

  const counts = jobOrders.reduce<Record<string, number>>((acc, jo) => {
    acc[jo.status] = (acc[jo.status] ?? 0) + 1;
    return acc;
  }, {});

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Job Orders
            </h1>
            <p className="text-xs text-slate-500">
              Operations handover documents for onboarding clients
            </p>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
        >
          <Plus size={16} />
          New Job Order
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STATUS_FILTERS.filter((s) => s.value !== 'ALL').map((s) => {
          const cfg = STATUS_CONFIG[s.value as JobOrderStatus];
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value as JobOrderStatus)}
              className={`p-3 rounded-xl border text-left transition-all ${
                statusFilter === s.value
                  ? `${cfg.bg} ${cfg.border} ring-2 ring-offset-1 ring-indigo-400`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`text-xl font-black ${cfg.color}`}>
                {counts[s.value] ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by JO #, lead name, or business…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {/* Status tabs */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value as JobOrderStatus | 'ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
                {s.value !== 'ALL' && counts[s.value] !== undefined && (
                  <span className="ml-1 opacity-75">({counts[s.value]})</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => void fetchJobOrders()}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={24} className="animate-spin" />
            <p className="text-sm">Loading job orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <ClipboardList size={40} className="opacity-30" />
            <p className="text-sm font-medium">No job orders found</p>
            {searchTerm || statusFilter !== 'ALL' ? (
              <p className="text-xs">Try adjusting your search or filters</p>
            ) : (
              <button
                onClick={handleNew}
                className="mt-2 text-xs text-indigo-600 hover:underline font-semibold"
              >
                Create your first job order →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      JO Number
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                      Lead / Client
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Prepared By
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((jo) => {
                    const cfg = STATUS_CONFIG[jo.status];
                    const clientName = jo.client?.businessName;
                    const leadName = `${jo.lead.firstName} ${jo.lead.lastName}`;
                    const displayName = clientName ?? jo.lead.businessName ?? leadName;

                    return (
                      <tr key={jo.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-indigo-700 text-xs">
                            {jo.jobOrderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 text-sm leading-tight">
                            {displayName}
                          </p>
                          {clientName && (
                            <p className="text-xs text-slate-400">{leadName}</p>
                          )}
                          <p className="text-xs text-slate-400">{jo.lead.businessType}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {new Date(jo.date).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {jo.preparedBy?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <AckProgress jo={jo} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleView(jo)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            {jo.status === 'DRAFT' && (
                              <button
                                onClick={() => handleEdit(jo)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {jo.status === 'DRAFT' && (
                              <button
                                onClick={() => handleDelete(jo)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <JobOrderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editData={selectedJO?.status === 'DRAFT' ? selectedJO : null}
        onSuccess={handleFormSuccess}
      />

      {selectedJO && (
        <JobOrderViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          jobOrder={selectedJO}
          onUpdate={handleAcknowledgmentUpdate}
          onEdit={() => {
            setIsViewOpen(false);
            setIsFormOpen(true);
          }}
        />
      )}

      {selectedJO && (
        <JobOrderDeleteModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          jobOrder={selectedJO}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}

// ─── Acknowledgment Progress Dots ────────────────────────────────

function AckProgress({ jo }: { jo: JobOrderRecord }): React.ReactNode {
  const steps = [
    { label: 'OM', done: !!jo.operationsManagerId, name: jo.operationsManager?.name },
    { label: 'AO', done: !!jo.accountManagerId, name: jo.accountManager?.name },
    { label: 'Exec', done: !!jo.executiveId, name: jo.executive?.name },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div
          key={i}
          title={step.done ? `${step.label}: ${step.name ?? 'Acknowledged'}` : `${step.label}: Pending`}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-colors ${
            step.done
              ? 'bg-emerald-500 border-emerald-600 text-white'
              : 'bg-slate-100 border-slate-300 text-slate-400'
          }`}
        >
          {step.label.charAt(0)}
        </div>
      ))}
    </div>
  );
}
