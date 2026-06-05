// src/components/accounting/PettyCashFund.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Eye,
  CheckCircle2,
  Banknote,
  XCircle,
  Ban,
  Trash2,
  Loader2,
  ArrowDownUp,
  Plus,
  X,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { PettyCashViewModal } from './PettyCashViewModal';
import type { ChequeMonitoringRecord, ChequeStatus } from '@/types/accounting.types';

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
  clientId: number | null;
  client: { id: number; businessName: string; clientNo: string | null } | null;
  clientFundBalanceSnapshot: number | null;
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
  clientId: number | null;
  client: { id: number; businessName: string; clientNo: string | null } | null;
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
  DRAFT:      'bg-gray-100   text-gray-600',
  PENDING:    'bg-yellow-100 text-yellow-700',
  APPROVED:   'bg-blue-100   text-blue-700',
  DISBURSED:  'bg-green-100  text-green-700',
  LIQUIDATED: 'bg-purple-100 text-purple-700',
  REJECTED:   'bg-red-100    text-red-700',
  VOID:       'bg-gray-100   text-gray-500',
};

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ── Client groups ────────────────────────────────────────────────────────────

interface ClientGroup {
  key: string;
  label: string;
  clientNo: string | null;
  records: PettyCashRecord[];
  totalClientFund: number;
}

function buildClientGroups(records: PettyCashRecord[]): ClientGroup[] {
  const groupMap = new Map<string, ClientGroup>();

  for (const record of records) {
    const clientAmounts = new Map<string, { businessName: string; clientNo: string | null; amount: number }>();

    if (record.client) {
      const key = String(record.client.id);
      clientAmounts.set(key, {
        businessName: record.client.businessName,
        clientNo: record.client.clientNo,
        amount: record.totalClientFundUsed,
      });
    }

    for (const item of record.items) {
      if (item.category === 'CLIENT_FUND' && item.client) {
        const key = String(item.client.id);
        const existing = clientAmounts.get(key);
        clientAmounts.set(key, {
          businessName: item.client.businessName,
          clientNo: item.client.clientNo,
          amount: (existing?.amount ?? 0) + item.amount,
        });
      }
    }

    if (clientAmounts.size === 0) {
      if (!groupMap.has('emp')) {
        groupMap.set('emp', { key: 'emp', label: 'Employee Expenses', clientNo: null, records: [], totalClientFund: 0 });
      }
      groupMap.get('emp')!.records.push(record);
    } else {
      for (const [key, info] of clientAmounts) {
        if (!groupMap.has(key)) {
          groupMap.set(key, { key, label: info.businessName, clientNo: info.clientNo, records: [], totalClientFund: 0 });
        }
        const g = groupMap.get(key)!;
        g.records.push(record);
        g.totalClientFund += info.amount;
      }
    }
  }

  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.key === 'emp') return 1;
    if (b.key === 'emp') return -1;
    return a.label.localeCompare(b.label);
  });
}

function getClientAmountForRecord(record: PettyCashRecord, groupKey: string): number {
  if (groupKey === 'emp') return record.totalEmployeeExpenses;
  const clientId = parseInt(groupKey, 10);
  if (record.client?.id === clientId) return record.totalClientFundUsed;
  return record.items
    .filter((it) => it.category === 'CLIENT_FUND' && it.clientId === clientId)
    .reduce((sum, it) => sum + it.amount, 0);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PettyCashFund(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [search, setSearch]           = useState('');
  const [records, setRecords]         = useState<PettyCashRecord[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [viewRecord, setViewRecord]   = useState<PettyCashRecord | null>(null);
  const [activeTab, setActiveTab]     = useState<'pcf' | 'statement' | 'cheque'>('pcf');

  const [approvingId, setApprovingId]     = useState<string | null>(null);
  const [rejectState, setRejectState]     = useState<{ id: string; reason: string } | null>(null);
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortOrder, setSortOrder]             = useState<'desc' | 'asc'>('desc');
  const [bulkAction, setBulkAction]             = useState<{ type: 'approve' | 'disburse' | 'void' | 'delete'; records: PettyCashRecord[] } | null>(null);
  const [bulkStep, setBulkStep]                 = useState(0);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkConfirmed, setBulkConfirmed]       = useState(false);

  // ── Cheque Monitoring state ──────────────────────────────────────────────────
  const [cheques, setCheques]               = useState<ChequeMonitoringRecord[]>([]);
  const [chequeSearch, setChequeSearch]     = useState('');
  const [chequeStatusFilter, setChequeStatusFilter] = useState<ChequeStatus | ''>('');
  const [chequeLoading, setChequeLoading]   = useState(false);
  const [showAddCheque, setShowAddCheque]   = useState(false);
  const [updatingChequeId, setUpdatingChequeId] = useState<string | null>(null);
  const [chequeClients, setChequeClients]   = useState<{ id: number; businessName: string; clientNo: string | null }[]>([]);
  // Add cheque form
  const [chequeForm, setChequeForm] = useState({ chequeNo: '', bankName: '', chequeDate: '', clientId: '', amount: '', invoiceId: '', notes: '' });
  const [isSavingCheque, setIsSavingCheque] = useState(false);
  // Edit cheque
  const [editCheque, setEditCheque] = useState<ChequeMonitoringRecord | null>(null);
  const [editForm, setEditForm] = useState({ chequeNo: '', bankName: '', chequeDate: '', amount: '', invoiceId: '', notes: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  // Delete cheque
  const [deleteCheque, setDeleteCheque] = useState<ChequeMonitoringRecord | null>(null);
  const [isDeletingCheque, setIsDeletingCheque] = useState(false);

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

  // ── Load cheques when tab becomes active ─────────────────────────────────────
  const loadCheques = useCallback(async () => {
    setChequeLoading(true);
    try {
      const params = new URLSearchParams();
      if (chequeStatusFilter) params.set('status', chequeStatusFilter);
      const [chequeRes, clientsRes] = await Promise.all([
        fetch(`/api/accounting/cheque-monitoring?${params.toString()}`),
        chequeClients.length === 0 ? fetch('/api/accounting/payments/clients') : Promise.resolve(null),
      ]);
      if (chequeRes.ok) {
        const d = (await chequeRes.json()) as { data: ChequeMonitoringRecord[] };
        setCheques(d.data);
      }
      if (clientsRes?.ok) {
        const d = (await clientsRes.json()) as { data: { id: number; businessName: string; clientNo: string | null }[] };
        setChequeClients(d.data);
      }
    } finally {
      setChequeLoading(false);
    }
  }, [chequeStatusFilter, chequeClients.length]);

  useEffect(() => {
    if (activeTab === 'cheque') void loadCheques();
  }, [activeTab, loadCheques]);

  // â”€â”€ Filtered records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const filtered = records.filter((r) => {
    const isDisbursed = ['DISBURSED', 'LIQUIDATED'].includes(r.status);
    if (activeTab === 'pcf' && isDisbursed) return false;
    if (activeTab === 'statement' && !isDisbursed) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.pcfNo.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) ||
      (r.client?.businessName.toLowerCase().includes(q) ?? false) ||
      r.items.some((it) => it.category === 'CLIENT_FUND' && it.client?.businessName.toLowerCase().includes(q)) ||
      r.requestedBy.name.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) =>
    sortOrder === 'desc'
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const pendingRecords   = useMemo(() => records.filter(r => r.status === 'PENDING'),                                            [records]);
  const approvedRecords  = useMemo(() => records.filter(r => r.status === 'APPROVED'),                                           [records]);
  const voidableRecords  = useMemo(() => records.filter(r => ['DRAFT', 'PENDING', 'APPROVED'].includes(r.status)),               [records]);
  const deletableRecords = useMemo(() => records.filter(r => r.status === 'VOID'),                                               [records]);
  const pcfCount         = useMemo(() => records.filter(r => !['DISBURSED', 'LIQUIDATED'].includes(r.status)).length, [records]);
  const statementCount   = useMemo(() => records.filter(r =>  ['DISBURSED', 'LIQUIDATED'].includes(r.status)).length, [records]);

  const bulkEmployeeGroups = useMemo(() => {
    if (!bulkAction) return [];
    const map = new Map<string, { id: string; name: string; records: PettyCashRecord[] }>();
    for (const r of bulkAction.records) {
      const key = r.requestedBy.id;
      if (!map.has(key)) map.set(key, { id: key, name: r.requestedBy.name, records: [] });
      map.get(key)!.records.push(r);
    }
    return Array.from(map.values());
  }, [bulkAction]);


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

  const handleBulkStep = async () => {
    if (!bulkAction) return;
    const currentGroup = bulkEmployeeGroups[bulkStep];
    if (!currentGroup) return;
    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount    = 0;
    for (const record of currentGroup.records) {
      try {
        let res: Response;
        if (bulkAction.type === 'void') {
          res = await fetch(`/api/accounting/petty-cash/${record.id}/void`, { method: 'POST' });
        } else if (bulkAction.type === 'delete') {
          res = await fetch(`/api/accounting/petty-cash/${record.id}`, { method: 'DELETE' });
        } else {
          res = await fetch(`/api/accounting/petty-cash/${record.id}/approve`, { method: 'POST' });
        }
        if (res.ok) successCount++; else failCount++;
      } catch {
        failCount++;
      }
    }
    setIsBulkProcessing(false);
    setBulkConfirmed(false);
    const isLast = bulkStep >= bulkEmployeeGroups.length - 1;
    if (isLast) {
      const actionLabel =
        bulkAction.type === 'approve'  ? 'approved'  :
        bulkAction.type === 'disburse' ? 'disbursed' :
        bulkAction.type === 'void'     ? 'voided'    : 'deleted';
      setBulkAction(null);
      setBulkStep(0);
      if (failCount === 0) {
        success('Done', `All requests ${actionLabel} successfully.`);
      } else {
        toastError('Partial', `${successCount} succeeded, ${failCount} failed.`);
      }
    } else {
      if (failCount > 0) {
        toastError('Partial', `${successCount} succeeded, ${failCount} failed for ${currentGroup.name}.`);
      }
      setBulkStep(prev => prev + 1);
    }
    void loadRecords();
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Petty Cash Fund</h1>
          <div className="flex mt-3 border-b border-border">
            <button
              type="button"
              onClick={() => { setActiveTab('pcf'); setSearch(''); setRejectState(null); setVoidConfirmId(null); setDeleteConfirmId(null); }}
              className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors ${
                activeTab === 'pcf'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              PCF
              {pcfCount > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  activeTab === 'pcf' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                }`}>{pcfCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('statement'); setSearch(''); setRejectState(null); setVoidConfirmId(null); setDeleteConfirmId(null); }}
              className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors ${
                activeTab === 'statement'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              PCF Statement
              {statementCount > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  activeTab === 'statement' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                }`}>{statementCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('cheque'); setSearch(''); setRejectState(null); setVoidConfirmId(null); setDeleteConfirmId(null); }}
              className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors ${
                activeTab === 'cheque'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Cheque Monitoring
            </button>
          </div>
        </div>
        {activeTab === 'pcf' && (
          <div className="flex items-center gap-2 flex-wrap">
            {pendingRecords.length > 0 && (
              <button
                onClick={() => { setBulkAction({ type: 'approve', records: pendingRecords }); setBulkStep(0); setBulkConfirmed(false); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
              >
                <CheckCircle2 size={15} />
                Approve All ({pendingRecords.length})
              </button>
            )}
            {approvedRecords.length > 0 && (
              <button
                onClick={() => { setBulkAction({ type: 'disburse', records: approvedRecords }); setBulkStep(0); setBulkConfirmed(false); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <Banknote size={15} />
                Disburse All ({approvedRecords.length})
              </button>
            )}
            {voidableRecords.length > 0 && (
              <button
                onClick={() => { setBulkAction({ type: 'void', records: voidableRecords }); setBulkStep(0); setBulkConfirmed(false); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition"
              >
                <Ban size={15} />
                Void All ({voidableRecords.length})
              </button>
            )}
            {deletableRecords.length > 0 && (
              <button
                onClick={() => { setBulkAction({ type: 'delete', records: deletableRecords }); setBulkStep(0); setBulkConfirmed(false); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
              >
                <Trash2 size={15} />
                Delete All ({deletableRecords.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search bar + sort — PCF/Statement only */}
      {activeTab !== 'cheque' && (
      <>
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === 'statement' ? 'Search PCF No. or requestor...' : 'Search PCF No., client, or requestor...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <button
          type="button"
          onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
          title={sortOrder === 'desc' ? 'Showing latest first — click for oldest first' : 'Showing oldest first — click for latest first'}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground hover:bg-muted transition whitespace-nowrap"
        >
          <ArrowDownUp size={14} />
          {sortOrder === 'desc' ? 'Latest' : 'Oldest'}
        </button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">PCF No.</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Requestor</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {activeTab === 'statement' ? 'No disbursed records found.' : 'No petty cash records found.'}
                </td>
              </tr>
            ) : (
              sorted.map((record) => (
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
                    {activeTab === 'statement' ? (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setViewRecord(record)}
                          title="View"
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    ) : rejectState?.id === record.id ? (
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
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition disabled:opacity-50"
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
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
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
          {activeTab === 'statement' && filtered.length > 0 && (
            <tfoot>
              <tr className="bg-muted/60 border-t-2 border-border">
                <td colSpan={3} className="px-4 py-3 text-right font-bold text-foreground text-sm">Grand Total</td>
                <td className="px-4 py-3 text-right font-bold text-foreground text-sm whitespace-nowrap">
                  ₱{filtered.reduce((s, r) => s + r.totalRequestedAmount, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
                <td colSpan={2} className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      </> )} {/* end activeTab !== 'cheque' */}

      {/* ── Cheque Monitoring Tab Content ── */}
      {activeTab === 'cheque' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search cheques..."
                  value={chequeSearch}
                  onChange={(e) => setChequeSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-56"
                />
              </div>
              <select
                value={chequeStatusFilter}
                onChange={(e) => setChequeStatusFilter(e.target.value as ChequeStatus | '')}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="FOR_CLEARING">For Clearing</option>
                <option value="CLEARED">Cleared</option>
                <option value="BOUNCED">Bounced</option>
              </select>
            </div>
            <button
              onClick={() => { setChequeForm({ chequeNo: '', bankName: '', chequeDate: '', clientId: '', amount: '', invoiceId: '', notes: '' }); setShowAddCheque(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              <Plus size={15} />
              Log Cheque
            </button>
            <button
              onClick={() => void loadCheques()}
              disabled={chequeLoading}
              className="flex items-center gap-2 px-3 py-2 border border-border bg-card text-foreground rounded-xl text-sm font-semibold hover:bg-muted transition disabled:opacity-50"
              title="Refresh cheque list"
            >
              <RefreshCw size={14} className={chequeLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Table */}
          <div className="border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cheque No.</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Bank</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Reference</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chequeLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : cheques.filter((c) => {
                  const q = chequeSearch.toLowerCase();
                  return (
                    c.chequeNo.toLowerCase().includes(q) ||
                    c.bankName.toLowerCase().includes(q) ||
                    c.businessName.toLowerCase().includes(q) ||
                    (c.clientNo ?? '').toLowerCase().includes(q) ||
                    (c.invoice?.invoiceNumber ?? '').toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      {chequeSearch || chequeStatusFilter ? 'No matching cheques.' : 'No cheque records yet.'}
                    </td>
                  </tr>
                ) : (
                  cheques
                    .filter((c) => {
                      const q = chequeSearch.toLowerCase();
                      return (
                        c.chequeNo.toLowerCase().includes(q) ||
                        c.bankName.toLowerCase().includes(q) ||
                        c.businessName.toLowerCase().includes(q) ||
                        (c.clientNo ?? '').toLowerCase().includes(q) ||
                        (c.invoice?.invoiceNumber ?? '').toLowerCase().includes(q)
                      );
                    })
                    .map((c) => (
                      <tr key={c.id} className="bg-card hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{c.chequeNo}</td>
                        <td className="px-4 py-3 text-foreground">{c.bankName}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground text-xs">{c.businessName}</div>
                          {c.clientNo && <div className="font-mono text-xs text-muted-foreground">{c.clientNo}</div>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(c.chequeDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {c.invoice ? (
                            <a href={`/portal/accounting-and-finance/invoices/${c.invoice.id}`} className="text-blue-600 hover:underline">{c.invoice.invoiceNumber}</a>
                          ) : c.payment ? (
                            <a href={`/portal/accounting-and-finance/payments/${c.payment.id}`} className="text-blue-600 hover:underline">{c.payment.paymentNumber}</a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          ₱{c.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            c.status === 'FOR_CLEARING' ? 'bg-amber-100 text-amber-700' :
                            c.status === 'CLEARED'      ? 'bg-green-100 text-green-700' :
                                                          'bg-red-100 text-red-700'
                          }`}>
                            {c.status === 'FOR_CLEARING' ? 'For Clearing' : c.status === 'CLEARED' ? 'Cleared' : 'Bounced'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.status === 'FOR_CLEARING' && (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => void (async () => {
                                  setUpdatingChequeId(c.id);
                                  try {
                                    const res = await fetch(`/api/accounting/cheque-monitoring/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CLEARED' }) });
                                    const json = (await res.json()) as { error?: string };
                                    if (!res.ok) { toastError('Failed', json.error ?? 'Error'); return; }
                                    success('Cheque cleared', 'Cheque cleared and credited to client funds.');
                                    void loadCheques();
                                  } catch { toastError('Error', 'Unexpected error.'); }
                                  finally { setUpdatingChequeId(null); }
                                })()}
                                disabled={updatingChequeId === c.id}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 disabled:opacity-50 transition"
                              >
                                {updatingChequeId === c.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                Cleared
                              </button>
                              <button
                                onClick={() => void (async () => {
                                  setUpdatingChequeId(c.id);
                                  try {
                                    const res = await fetch(`/api/accounting/cheque-monitoring/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'BOUNCED' }) });
                                    const json = (await res.json()) as { error?: string };
                                    if (!res.ok) { toastError('Failed', json.error ?? 'Error'); return; }
                                    success('Cheque bounced', 'Cheque marked as bounced.');
                                    void loadCheques();
                                  } catch { toastError('Error', 'Unexpected error.'); }
                                  finally { setUpdatingChequeId(null); }
                                })()}
                                disabled={updatingChequeId === c.id}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition"
                              >
                                {updatingChequeId === c.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                                Bounced
                              </button>
                            </div>
                          )}
                          {c.status === 'BOUNCED' && (
                            <button
                              onClick={() => void (async () => {
                                setUpdatingChequeId(c.id);
                                try {
                                  const res = await fetch(`/api/accounting/cheque-monitoring/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'FOR_CLEARING' }) });
                                  const json = (await res.json()) as { error?: string };
                                  if (!res.ok) { toastError('Failed', json.error ?? 'Error'); return; }
                                  success('Status updated', 'Cheque reset to for clearing.');
                                  void loadCheques();
                                } catch { toastError('Error', 'Unexpected error.'); }
                                finally { setUpdatingChequeId(null); }
                              })()}
                              disabled={updatingChequeId === c.id}
                              className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 disabled:opacity-50 transition"
                            >
                              {updatingChequeId === c.id ? <Loader2 size={12} className="animate-spin" /> : 'Re-submit'}
                            </button>
                          )}
                          {c.status === 'CLEARED' && (
                            <span className="text-xs text-muted-foreground italic">
                              {c.clearedAt ? new Date(c.clearedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : 'Cleared'}
                            </span>
                          )}
                          {/* Edit / Delete — not for CLEARED */}
                          {c.status !== 'CLEARED' && (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <button
                                onClick={() => {
                                  setEditCheque(c);
                                  setEditForm({
                                    chequeNo: c.chequeNo,
                                    bankName: c.bankName,
                                    chequeDate: c.chequeDate.split('T')[0] ?? '',
                                    amount: String(c.amount),
                                    invoiceId: c.invoiceId ?? '',
                                    notes: c.notes ?? '',
                                  });
                                }}
                                className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition"
                                title="Edit cheque"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteCheque(c)}
                                className="px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition"
                                title="Delete cheque"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Cheque Modal */}
          {showAddCheque && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddCheque(false)} />
              <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Log Cheque Payment</h2>
                  <button onClick={() => setShowAddCheque(false)} className="p-1 rounded-lg hover:bg-muted transition">
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void (async () => {
                      setIsSavingCheque(true);
                      try {
                        const res = await fetch('/api/accounting/cheque-monitoring', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            chequeNo: chequeForm.chequeNo.trim(),
                            bankName: chequeForm.bankName.trim(),
                            chequeDate: chequeForm.chequeDate,
                            clientId: parseInt(chequeForm.clientId, 10),
                            amount: parseFloat(chequeForm.amount),
                            invoiceId: chequeForm.invoiceId.trim() || null,
                            notes: chequeForm.notes.trim() || null,
                          }),
                        });
                        const json = (await res.json()) as { data?: ChequeMonitoringRecord; error?: string };
                        if (!res.ok) { toastError('Failed', json.error ?? 'Error'); return; }
                        success('Cheque logged', `Cheque #${chequeForm.chequeNo} recorded for clearing.`);
                        setCheques((prev) => [json.data!, ...prev]);
                        setShowAddCheque(false);
                      } catch { toastError('Error', 'Unexpected error.'); }
                      finally { setIsSavingCheque(false); }
                    })();
                  }}
                  className="px-6 py-5 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Client <span className="text-red-500">*</span></label>
                    <select
                      value={chequeForm.clientId}
                      onChange={(e) => setChequeForm((f) => ({ ...f, clientId: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select client...</option>
                      {chequeClients.map((c) => (
                        <option key={c.id} value={c.id}>{c.businessName}{c.clientNo ? ` (${c.clientNo})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Cheque No. <span className="text-red-500">*</span></label>
                      <input type="text" value={chequeForm.chequeNo} onChange={(e) => setChequeForm((f) => ({ ...f, chequeNo: e.target.value }))} placeholder="e.g. 001234" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Bank Name <span className="text-red-500">*</span></label>
                      <input type="text" value={chequeForm.bankName} onChange={(e) => setChequeForm((f) => ({ ...f, bankName: e.target.value }))} placeholder="e.g. BDO" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Cheque Date <span className="text-red-500">*</span></label>
                      <input type="date" value={chequeForm.chequeDate} onChange={(e) => setChequeForm((f) => ({ ...f, chequeDate: e.target.value }))} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Amount (₱) <span className="text-red-500">*</span></label>
                      <input type="number" value={chequeForm.amount} onChange={(e) => setChequeForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0.01" step="0.01" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Invoice ID <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
                    <input type="text" value={chequeForm.invoiceId} onChange={(e) => setChequeForm((f) => ({ ...f, invoiceId: e.target.value }))} placeholder="INV-2026-XXXX" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Notes <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
                    <textarea value={chequeForm.notes} onChange={(e) => setChequeForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setShowAddCheque(false)} className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition">Cancel</button>
                    <button type="submit" disabled={isSavingCheque} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
                      {isSavingCheque && <Loader2 size={14} className="animate-spin" />}
                      Log Cheque
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Cheque Modal */}
          {editCheque && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setEditCheque(null)} />
              <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Edit Cheque</h2>
                  <button onClick={() => setEditCheque(null)} className="p-1 rounded-lg hover:bg-muted transition">
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void (async () => {
                      setIsSavingEdit(true);
                      try {
                        const res = await fetch(`/api/accounting/cheque-monitoring/${editCheque.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            chequeNo: editForm.chequeNo.trim(),
                            bankName: editForm.bankName.trim(),
                            chequeDate: editForm.chequeDate,
                            amount: parseFloat(editForm.amount),
                            invoiceId: editForm.invoiceId.trim() || null,
                            notes: editForm.notes.trim() || null,
                          }),
                        });
                        const json = (await res.json()) as { data?: ChequeMonitoringRecord; error?: string };
                        if (!res.ok) { toastError('Failed', json.error ?? 'Error'); return; }
                        success('Cheque updated', `Cheque #${editForm.chequeNo} updated.`);
                        setCheques((prev) => prev.map((c) => c.id === editCheque.id ? json.data! : c));
                        setEditCheque(null);
                      } catch { toastError('Error', 'Unexpected error.'); }
                      finally { setIsSavingEdit(false); }
                    })();
                  }}
                  className="px-6 py-5 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Cheque No. <span className="text-red-500">*</span></label>
                      <input type="text" value={editForm.chequeNo} onChange={(e) => setEditForm((f) => ({ ...f, chequeNo: e.target.value }))} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Bank Name <span className="text-red-500">*</span></label>
                      <input type="text" value={editForm.bankName} onChange={(e) => setEditForm((f) => ({ ...f, bankName: e.target.value }))} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Cheque Date <span className="text-red-500">*</span></label>
                      <input type="date" value={editForm.chequeDate} onChange={(e) => setEditForm((f) => ({ ...f, chequeDate: e.target.value }))} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Amount (₱) <span className="text-red-500">*</span></label>
                      <input type="number" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} min="0.01" step="0.01" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Invoice ID <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
                    <input type="text" value={editForm.invoiceId} onChange={(e) => setEditForm((f) => ({ ...f, invoiceId: e.target.value }))} placeholder="INV-2026-XXXX" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Notes <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
                    <textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setEditCheque(null)} className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition">Cancel</button>
                    <button type="submit" disabled={isSavingEdit} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
                      {isSavingEdit && <Loader2 size={14} className="animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Cheque Confirmation */}
          {deleteCheque && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteCheque(null)} />
              <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
                <h2 className="text-base font-bold text-foreground">Delete Cheque</h2>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete cheque{' '}
                  <span className="font-semibold text-foreground">#{deleteCheque.chequeNo}</span>{' '}
                  from <span className="font-semibold text-foreground">{deleteCheque.businessName}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setDeleteCheque(null)} className="flex-1 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition">Cancel</button>
                  <button
                    disabled={isDeletingCheque}
                    onClick={() => void (async () => {
                      setIsDeletingCheque(true);
                      try {
                        const res = await fetch(`/api/accounting/cheque-monitoring/${deleteCheque.id}`, { method: 'DELETE' });
                        const json = (await res.json()) as { error?: string };
                        if (!res.ok) { toastError('Failed', json.error ?? 'Error'); return; }
                        success('Deleted', `Cheque #${deleteCheque.chequeNo} deleted.`);
                        setCheques((prev) => prev.filter((c) => c.id !== deleteCheque.id));
                        setDeleteCheque(null);
                      } catch { toastError('Error', 'Unexpected error.'); }
                      finally { setIsDeletingCheque(false); }
                    })()}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {isDeletingCheque && <Loader2 size={14} className="animate-spin" />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View modal */}
      {viewRecord && (
        <PettyCashViewModal record={viewRecord} onClose={() => setViewRecord(null)} />
      )}

      {/* Bulk action confirmation modal */}
      {bulkAction && (() => {
        const currentGroup = bulkEmployeeGroups[bulkStep];
        if (!currentGroup) return null;
        const totalSteps  = bulkEmployeeGroups.length;
        const isLast      = bulkStep >= totalSteps - 1;
        const groupTotal  = currentGroup.records.reduce((s, r) => s + r.totalRequestedAmount, 0);
        const titleMap = {
          approve:  'Approve All Pending Requests',
          disburse: 'Disburse All Approved Requests',
          void:     'Void All Requests',
          delete:   'Delete All Voided Records',
        } as const;
        const actionNounMap = {
          approve:  'approval',
          disburse: 'disbursement',
          void:     'void action',
          delete:   'deletion',
        } as const;
        const btnLabelMap = {
          approve:  'Approve',
          disburse: 'Disburse',
          void:     'Void',
          delete:   'Delete',
        } as const;
        const btnColorMap = {
          approve:  'bg-green-600 hover:bg-green-700',
          disburse: 'bg-blue-600  hover:bg-blue-700',
          void:     'bg-amber-500 hover:bg-amber-600',
          delete:   'bg-red-600   hover:bg-red-700',
        } as const;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-border">

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-foreground">{titleMap[bulkAction.type]}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Reviewing:{' '}
                      <span className="font-medium text-foreground">{currentGroup.name}</span>
                      {' — '}
                      {currentGroup.records.length}{' '}
                      {currentGroup.records.length === 1 ? 'request' : 'requests'}
                    </p>
                  </div>
                  {totalSteps > 1 && (
                    <span className="shrink-0 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full whitespace-nowrap">
                      {bulkStep + 1} / {totalSteps}
                    </span>
                  )}
                </div>
                {/* Step progress dots */}
                {totalSteps > 1 && (
                  <div className="flex items-center gap-1.5 mt-3">
                    {bulkEmployeeGroups.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i < bulkStep
                            ? 'w-4 bg-green-500'
                            : i === bulkStep
                              ? 'w-6 bg-blue-500'
                              : 'w-4 bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Records - one card per request, replicating RequestFundModal item layout */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {currentGroup.records.map(r => (
                  <div key={r.id}>
                    {/* Request sub-header */}
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{r.pcfNo}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="mb-2 text-sm">
                      <span className="font-semibold text-foreground">Purpose: </span>
                      <span className="text-foreground">{r.purpose}</span>
                    </div>
                    {/* Items table */}
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-[22%]">Category</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-[22%]">Client</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Description</th>
                            <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground w-[18%]">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {r.items.map(item => (
                            <tr key={item.id} className="bg-card">
                              <td className="px-3 py-2 text-foreground">
                                {item.category === 'EMPLOYEE_EXPENSE' ? 'Employee Expense' : 'Client Fund'}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {item.client?.businessName ?? <span className="text-muted-foreground/50">-</span>}
                              </td>
                              <td className="px-3 py-2 text-foreground">{item.description}</td>
                              <td className="px-3 py-2 text-right text-foreground whitespace-nowrap">
                                {'₱'}{item.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/40 border-t-2 border-border">
                            <td colSpan={3} className="px-3 py-2.5 text-right font-bold text-foreground">Total</td>
                            <td className="px-3 py-2.5 text-right font-bold text-foreground whitespace-nowrap">
                              {'₱'}{r.totalRequestedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
                {/* Employee subtotal when multiple records */}
                {currentGroup.records.length > 1 && (
                  <div className="flex justify-between items-center border-t-2 border-border pt-3">
                    <span className="text-sm font-bold text-foreground">Employee Total</span>
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">
                      {'₱'}{groupTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmation checkbox + footer */}
              <div className="px-6 pb-6 pt-4 border-t border-border shrink-0 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={bulkConfirmed}
                    onChange={e => setBulkConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-blue-600"
                  />
                  <span className="text-sm text-foreground leading-snug">
                    I have reviewed the requests above and confirm this {actionNounMap[bulkAction.type]}.
                  </span>
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setBulkAction(null); setBulkStep(0); setBulkConfirmed(false); }}
                    disabled={isBulkProcessing}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-muted transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleBulkStep()}
                    disabled={!bulkConfirmed || isBulkProcessing}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${btnColorMap[bulkAction.type]}`}
                  >
                    {isBulkProcessing && <Loader2 size={14} className="animate-spin" />}
                    {isBulkProcessing
                      ? 'Processing...'
                      : isLast
                        ? `${btnLabelMap[bulkAction.type]} (${currentGroup.records.length}) & Finish`
                        : `${btnLabelMap[bulkAction.type]} (${currentGroup.records.length}) & Continue →`
                    }
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
