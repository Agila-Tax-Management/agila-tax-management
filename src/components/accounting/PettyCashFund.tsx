// src/components/accounting/PettyCashFund.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Eye,
  CheckCircle2,
  Banknote,
  XCircle,
  Ban,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { PettyCashViewModal } from './PettyCashViewModal';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type PettyCashStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'DISBURSED'
  | 'LIQUIDATED'
  | 'REJECTED'
  | 'VOID';

export type PettyCashItemCategory = 'EMPLOYEE_EXPENSE' | 'CLIENT_FUND';

export interface PettyCashItemRecord {
  id: number;
  category: PettyCashItemCategory;
  description: string;
  amount: number;
  remarks: string | null;
}

export interface PettyCashRecord {
  id: string;
  pcfNo: string;
  date: string;
  purpose: string;
  status: PettyCashStatus;
  totalRequestedAmount: number;
  totalEmployeeExpenses: number;
  totalClientFundUsed: number;
  clientFundBalanceSnapshot: number | null;
  rejectionReason: string | null;
  custodianNotes: string | null;
  managerNotes: string | null;
  custodianApprovedAt: string | null;
  accountingManagerApprovedAt: string | null;
  clientId: number;
  client: { id: number; businessName: string; clientNo: string | null };
  requestedById: string;
  requestedBy: { id: string; name: string };
  custodianId: string | null;
  custodian: { id: string; name: string } | null;
  accountingManagerId: string | null;
  accountingManager: { id: string; name: string } | null;
  items: PettyCashItemRecord[];
  createdAt: string;
  updatedAt: string;
}

// â”€â”€ Status badge styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_STYLES: Record<string, string> = {
  DRAFT:      'bg-gray-100   text-gray-600  dark:bg-gray-800       dark:text-gray-400',
  PENDING:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED:   'bg-blue-100   text-blue-700  dark:bg-blue-900/30    dark:text-blue-400',
  DISBURSED:  'bg-green-100  text-green-700 dark:bg-green-900/30   dark:text-green-400',
  LIQUIDATED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  REJECTED:   'bg-red-100    text-red-700   dark:bg-red-900/30     dark:text-red-400',
  VOID:       'bg-gray-100   text-gray-500  dark:bg-gray-800       dark:text-gray-500',
};

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function PettyCashFund(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [search, setSearch]           = useState('');
  const [records, setRecords]         = useState<PettyCashRecord[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [viewRecord, setViewRecord]   = useState<PettyCashRecord | null>(null);

  const [approvingId, setApprovingId]     = useState<string | null>(null);
  const [rejectState, setRejectState]     = useState<{ id: string; reason: string } | null>(null);
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // â”€â”€ Data loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/accounting/petty-cash');
      if (res.ok) {
        const d = await res.json();
        setRecords((d.data as PettyCashRecord[]) ?? []);
      } else {
        toastError('Error', 'Failed to load petty cash records.');
      }
    } catch {
      toastError('Error', 'Failed to load petty cash records.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  // â”€â”€ Filtered records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const filtered = records.filter(
    (r) =>
      r.pcfNo.toLowerCase().includes(search.toLowerCase()) ||
      r.client.businessName.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy.name.toLowerCase().includes(search.toLowerCase()),
  );

  // â”€â”€ Action handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/accounting/petty-cash/${id}/approve`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) {
        toastError('Failed', (d as { error?: string }).error ?? 'Unable to process.');
        return;
      }
      const newStatus = ((d as { data?: { status?: string } }).data?.status ?? '').toLowerCase();
      success('Done', `Request has been ${newStatus}.`);
      void loadRecords();
    } catch {
      toastError('Error', 'An unexpected error occurred.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/accounting/petty-cash/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const d = await res.json();
      if (!res.ok) {
        toastError('Failed', (d as { error?: string }).error ?? 'Unable to reject.');
        return;
      }
      success('Rejected', 'Petty cash request has been rejected.');
      setRejectState(null);
      void loadRecords();
    } catch {
      toastError('Error', 'An unexpected error occurred.');
    }
  };

  const handleVoid = async (id: string) => {
    try {
      const res = await fetch(`/api/accounting/petty-cash/${id}/void`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) {
        toastError('Failed', (d as { error?: string }).error ?? 'Unable to void.');
        return;
      }
      success('Voided', 'Petty cash request has been voided.');
      setVoidConfirmId(null);
      void loadRecords();
    } catch {
      toastError('Error', 'An unexpected error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/accounting/petty-cash/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) {
        toastError('Failed', (d as { error?: string }).error ?? 'Unable to delete.');
        return;
      }
      success('Deleted', 'Petty cash request has been permanently deleted.');
      setDeleteConfirmId(null);
      void loadRecords();
    } catch {
      toastError('Error', 'An unexpected error occurred.');
    }
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Petty Cash Fund</h1>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search PCF No., client, or requestor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">PCF No.</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Requestor</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Client</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Request Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No petty cash records found.
                </td>
              </tr>
            ) : (
              filtered.map((record) => (
                <tr key={record.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{record.pcfNo}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(record.date).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-foreground">{record.requestedBy.name}</td>
                  <td className="px-4 py-3 text-foreground">{record.client.businessName}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">
                    ₱{record.totalRequestedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[record.status]}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">

                    {/* â”€â”€ Reject confirmation â”€â”€ */}
                    {rejectState?.id === record.id ? (
                      <div className="flex flex-col gap-2 min-w-45">
                        <textarea
                          rows={2}
                          placeholder="Reason (optional)"
                          value={rejectState.reason}
                          onChange={(e) =>
                            setRejectState({ id: record.id, reason: e.target.value })
                          }
                          className="w-full text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleReject(record.id, rejectState.reason)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setRejectState(null)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                    ) : voidConfirmId === record.id ? (
                      /* â”€â”€ Void confirmation â”€â”€ */
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Void?</span>
                        <button
                          onClick={() => handleVoid(record.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setVoidConfirmId(null)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition"
                        >
                          No
                        </button>
                      </div>

                    ) : deleteConfirmId === record.id ? (
                      /* â”€â”€ Delete confirmation â”€â”€ */
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Delete?</span>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition"
                        >
                          No
                        </button>
                      </div>

                    ) : (
                      /* â”€â”€ Normal action buttons â”€â”€ */
                      <div className="flex items-center justify-center gap-1 flex-wrap">

                        {/* View */}
                        <button
                          onClick={() => setViewRecord(record)}
                          title="View"
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Approve â€” PENDING only */}
                        {record.status === 'PENDING' && (
                          <button
                            onClick={() => handleApprove(record.id)}
                            disabled={approvingId === record.id}
                            title="Approve"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition disabled:opacity-50"
                          >
                            {approvingId === record.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                          </button>
                        )}

                        {/* Disburse â€” APPROVED only */}
                        {record.status === 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(record.id)}
                            disabled={approvingId === record.id}
                            title="Disburse"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50"
                          >
                            {approvingId === record.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Banknote size={14} />
                            )}
                          </button>
                        )}

                        {/* Reject â€” PENDING or APPROVED */}
                        {['PENDING', 'APPROVED'].includes(record.status) && (
                          <button
                            onClick={() => setRejectState({ id: record.id, reason: '' })}
                            title="Reject"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            <XCircle size={14} />
                          </button>
                        )}

                        {/* Void â€” DRAFT, PENDING, or APPROVED */}
                        {['DRAFT', 'PENDING', 'APPROVED'].includes(record.status) && (
                          <button
                            onClick={() => setVoidConfirmId(record.id)}
                            title="Void"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                          >
                            <Ban size={14} />
                          </button>
                        )}

                        {/* Delete â€” VOID only (void first, then delete) */}
                        {record.status === 'VOID' && (
                          <button
                            onClick={() => setDeleteConfirmId(record.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewRecord && (
        <PettyCashViewModal record={viewRecord} onClose={() => setViewRecord(null)} />
      )}
    </div>
  );
}
