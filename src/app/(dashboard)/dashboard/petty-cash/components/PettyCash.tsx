// src/app/(dashboard)/dashboard/petty-cash/components/PettyCash.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Pencil, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { authClient } from '@/lib/auth-client';
import RequestFundModal from './RequestFundModal';

// ── Types ─────────────────────────────────────────────────────────────────────

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

export type ModalMode = 'create' | 'view' | 'edit';

// ── Status badge styles ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT:      'bg-gray-100   text-gray-600  dark:bg-gray-800       dark:text-gray-400',
  PENDING:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED:   'bg-blue-100   text-blue-700  dark:bg-blue-900/30    dark:text-blue-400',
  DISBURSED:  'bg-green-100  text-green-700 dark:bg-green-900/30   dark:text-green-400',
  LIQUIDATED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  REJECTED:   'bg-red-100    text-red-700   dark:bg-red-900/30     dark:text-red-400',
  VOID:       'bg-gray-100   text-gray-500  dark:bg-gray-800       dark:text-gray-500',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PettyCash() {
  const { success, error: toastError } = useToast();
  const { data: sessionData } = authClient.useSession();

  const userId = sessionData?.user?.id ?? '';
  const role   = (sessionData?.user as { role?: string } | null | undefined)?.role ?? '';

  const [search, setSearch]         = useState('');
  const [records, setRecords]       = useState<PettyCashRecord[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalMode, setModalMode]   = useState<ModalMode>('create');
  const [selectedRecord, setSelectedRecord] = useState<PettyCashRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectState, setRejectState] = useState<{ id: string; reason: string } | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────────
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

  // ── Filtered records ──────────────────────────────────────────────────────────
  const filtered = records.filter(
    (r) =>
      r.pcfNo.toLowerCase().includes(search.toLowerCase()) ||
      r.client.businessName.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Permission helpers ────────────────────────────────────────────────────────
  const canEdit = (r: PettyCashRecord) =>
    ['DRAFT', 'PENDING'].includes(r.status) &&
    (r.requestedById === userId || role === 'SUPER_ADMIN');

  const canDelete = (r: PettyCashRecord) => canEdit(r);

  const canApprove = (r: PettyCashRecord) =>
    r.status === 'PENDING' && (r.custodianId === userId || role === 'SUPER_ADMIN');

  const canDisburse = (r: PettyCashRecord) =>
    r.status === 'APPROVED' && (r.accountingManagerId === userId || role === 'SUPER_ADMIN');

  const canReject = (r: PettyCashRecord) =>
    ['PENDING', 'APPROVED'].includes(r.status) &&
    (r.custodianId === userId ||
      r.accountingManagerId === userId ||
      role === 'SUPER_ADMIN');

  // ── Action handlers ───────────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/accounting/petty-cash/${id}/approve`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { toastError('Failed', (d as { error?: string }).error ?? 'Unable to approve.'); return; }
      success('Approved', `Request has been ${((d as { data?: { status?: string } }).data?.status ?? 'updated').toLowerCase()}.`);
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
      if (!res.ok) { toastError('Failed', (d as { error?: string }).error ?? 'Unable to reject.'); return; }
      success('Rejected', 'Petty cash request has been rejected.');
      setRejectState(null);
      void loadRecords();
    } catch {
      toastError('Error', 'An unexpected error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/accounting/petty-cash/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) { toastError('Failed', (d as { error?: string }).error ?? 'Unable to delete.'); return; }
      success('Deleted', 'Petty cash request has been removed.');
      setConfirmDeleteId(null);
      void loadRecords();
    } catch {
      toastError('Error', 'An unexpected error occurred.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Petty Cash</h1>
        <button
          onClick={() => { setModalMode('create'); setSelectedRecord(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <Plus size={16} />
          Request Fund
        </button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search PCF No. or client..."
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
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Client</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 size={18} className="inline mr-2 animate-spin" />
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No petty cash records found.
                </td>
              </tr>
            ) : (
              filtered.map((record) => (
                <tr key={record.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{record.pcfNo}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(record.date).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-foreground">{record.client.businessName}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    ₱{record.totalRequestedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[record.status] ?? ''}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rejectState?.id === record.id ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <input
                          type="text"
                          value={rejectState.reason}
                          onChange={(e) => setRejectState({ id: record.id, reason: e.target.value })}
                          placeholder="Reason (optional)"
                          autoFocus
                          className="w-44 px-2 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Reject?</span>
                          <button
                            onClick={() => void handleReject(record.id, rejectState.reason)}
                            className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setRejectState(null)}
                            className="px-2 py-0.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs transition"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : confirmDeleteId === record.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-muted-foreground">Delete?</span>
                        <button
                          onClick={() => void handleDelete(record.id)}
                          className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setModalMode('view'); setSelectedRecord(record); setModalOpen(true); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        {canEdit(record) && (
                          <button
                            onClick={() => { setModalMode('edit'); setSelectedRecord(record); setModalOpen(true); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {canDelete(record) && (
                          <button
                            onClick={() => setConfirmDeleteId(record.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        {(canApprove(record) || canDisburse(record)) && (
                          <button
                            onClick={() => void handleApprove(record.id)}
                            disabled={approvingId === record.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition disabled:opacity-50"
                            title={canDisburse(record) ? 'Disburse' : 'Approve'}
                          >
                            {approvingId === record.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                          </button>
                        )}
                        {canReject(record) && (
                          <button
                            onClick={() => setRejectState({ id: record.id, reason: '' })}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            title="Reject"
                          >
                            <XCircle size={15} />
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

      {/* The key prop resets modal state on every open/mode/record change */}
      <RequestFundModal
        key={`${modalMode}-${selectedRecord?.id ?? 'new'}`}
        isOpen={modalOpen}
        mode={modalMode}
        record={selectedRecord}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); void loadRecords(); }}
      />
    </div>
  );
}

