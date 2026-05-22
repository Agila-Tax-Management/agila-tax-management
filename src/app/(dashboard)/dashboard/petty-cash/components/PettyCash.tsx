// src/app/(dashboard)/dashboard/petty-cash/components/PettyCash.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Eye, Pencil, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
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
  // For CLIENT_FUND items — which client's fund this draws from
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
  // Legacy: snapshot from when PCF had a single header-level client. Null on new records.
  clientFundBalanceSnapshot: number | null;
  rejectionReason: string | null;
  custodianNotes: string | null;
  managerNotes: string | null;
  custodianApprovedAt: string | null;
  accountingManagerApprovedAt: string | null;
  // Legacy: header-level client. Null on new records — client is now on each item.
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

export type ModalMode = 'create' | 'view' | 'edit';

// ── Status badge styles ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT:      'bg-gray-100   text-gray-600',
  PENDING:    'bg-yellow-100 text-yellow-700',
  APPROVED:   'bg-blue-100   text-blue-700',
  DISBURSED:  'bg-green-100  text-green-700',
  LIQUIDATED: 'bg-purple-100 text-purple-700',
  REJECTED:   'bg-red-100    text-red-700',
  VOID:       'bg-gray-100   text-gray-500',
};

// ── Client group structure ───────────────────────────────────────────────────

interface ClientGroup {
  key: string;
  label: string;
  clientNo: string | null;
  records: PettyCashRecord[];
  totalClientFund: number;
}

// ── Build accordion groups from records ──────────────────────────────────────

function buildClientGroups(records: PettyCashRecord[]): ClientGroup[] {
  const groupMap = new Map<string, ClientGroup>();

  for (const record of records) {
    const clientAmounts = new Map<string, { businessName: string; clientNo: string | null; amount: number }>();

    // Legacy: header-level client
    if (record.client) {
      const key = String(record.client.id);
      clientAmounts.set(key, {
        businessName: record.client.businessName,
        clientNo: record.client.clientNo,
        amount: record.totalClientFundUsed,
      });
    }

    // New: item-level clients
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

// ── Get the amount relevant to a specific group for one record ────────────────

function getClientAmountForRecord(record: PettyCashRecord, groupKey: string): number {
  if (groupKey === 'emp') return record.totalEmployeeExpenses;
  const clientId = parseInt(groupKey, 10);
  if (record.client?.id === clientId) return record.totalClientFundUsed;
  return record.items
    .filter((it) => it.category === 'CLIENT_FUND' && it.clientId === clientId)
    .reduce((sum, it) => sum + it.amount, 0);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PettyCash() {
  const { success, error: toastError } = useToast();
  const { data: sessionData } = authClient.useSession();

  const userId = sessionData?.user?.id ?? '';
  const role   = (sessionData?.user as { role?: string } | null | undefined)?.role ?? '';

  const [search, setSearch]               = useState('');
  const [records, setRecords]             = useState<PettyCashRecord[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [modalOpen, setModalOpen]         = useState(false);
  const [modalMode, setModalMode]         = useState<ModalMode>('create');
  const [selectedRecord, setSelectedRecord]   = useState<PettyCashRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Keys in this set are collapsed; absent = expanded (all start expanded)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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
  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.pcfNo.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) ||
      (r.client?.businessName.toLowerCase().includes(q) ?? false) ||
      r.items.some((it) => it.category === 'CLIENT_FUND' && it.client?.businessName.toLowerCase().includes(q))
    );
  });

  // ── Client groups (derived from filtered) ────────────────────────────────────
  const clientGroups = useMemo(() => buildClientGroups(filtered), [filtered]);

  // ── Group toggle ─────────────────────────────────────────────────────────────
  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ── Permission helpers ────────────────────────────────────────────────────────
  const canEdit = (r: PettyCashRecord) =>
    ['DRAFT', 'PENDING'].includes(r.status) &&
    (r.requestedById === userId || role === 'SUPER_ADMIN');

  const canDelete = (r: PettyCashRecord) => canEdit(r);

  // ── Action handlers ───────────────────────────────────────────────────────────
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
          placeholder="Search PCF No., purpose, or client..."
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
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Purpose</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Actions</th>
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
              clientGroups.map((group) => {
                const collapsed = collapsedGroups.has(group.key);
                return (
                  <React.Fragment key={group.key}>
                    {/* Group header row */}
                    <tr
                      onClick={() => toggleGroup(group.key)}
                      className="bg-muted/40 hover:bg-muted/60 cursor-pointer select-none border-t border-border"
                    >
                      <td colSpan={6} className="px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {collapsed
                              ? <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                              : <ChevronDown  size={14} className="text-muted-foreground shrink-0" />
                            }
                            <span className="font-semibold text-foreground text-xs">{group.label}</span>
                            {group.clientNo && (
                              <span className="text-xs text-muted-foreground font-mono">{group.clientNo}</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {group.records.length} {group.records.length === 1 ? 'request' : 'requests'}
                            </span>
                          </div>
                          {group.key !== 'emp' && (
                            <span className="text-xs font-semibold text-foreground">
                              ₱{group.totalClientFund.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Data rows */}
                    {!collapsed && group.records.map((record) => (
                      <tr key={record.id} className="bg-card hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{record.pcfNo}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString('en-PH', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-foreground max-w-xs truncate" title={record.purpose}>
                          {record.purpose}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">
                          ₱{getClientAmountForRecord(record, group.key).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[record.status] ?? ''}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {confirmDeleteId === record.id ? (
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
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
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

