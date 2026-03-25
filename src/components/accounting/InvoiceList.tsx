// src/components/accounting/InvoiceList.tsx — REPLACED with real API data
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import {
  Search, FileText, Plus,
  CheckCircle2, Clock, AlertTriangle, XCircle, CircleDot,
  Eye, Printer, Pencil, Copy, Trash2,
} from 'lucide-react';
import type { InvoiceRecord, InvoiceStats } from '@/types/accounting.types';

async function openInvoicePDF(invoice: InvoiceRecord) {
  const [{ pdf }, { InvoicePDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./InvoicePDF'),
  ]);
  const el = React.createElement(InvoicePDF, { invoice }) as Parameters<typeof pdf>[0];
  const blob = await pdf(el).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ── Types ──────────────────────────────────────────────────────── */
type InvoiceStatus = InvoiceRecord['status'];

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { badge: 'info' | 'success' | 'danger' | 'warning' | 'neutral'; icon: React.ReactNode; label: string }
> = {
  DRAFT:          { badge: 'neutral',  icon: <FileText size={10} />,    label: 'Draft' },
  UNPAID:         { badge: 'warning',  icon: <Clock size={10} />,       label: 'Unpaid' },
  PARTIALLY_PAID: { badge: 'info',     icon: <CircleDot size={10} />,   label: 'Partial' },
  PAID:           { badge: 'success',  icon: <CheckCircle2 size={10} />, label: 'Paid' },
  OVERDUE:        { badge: 'danger',   icon: <AlertTriangle size={10} />, label: 'Overdue' },
  VOID:           { badge: 'neutral',  icon: <XCircle size={10} />,     label: 'Void' },
};

// Satisfy unused import check from original file — these are no longer needed
const _unused = { _Send: null as unknown };
void _unused;

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}
function getDisplayName(inv: InvoiceRecord) {
  if (inv.client) return inv.client.businessName;
  if (inv.lead) return [inv.lead.firstName, inv.lead.lastName].filter(Boolean).join(' ');
  return '—';
}
function getSubLabel(inv: InvoiceRecord) {
  if (inv.client) return inv.client.clientNo ?? `Client #${inv.client.id}`;
  if (inv.lead) return inv.lead.businessName ?? `Lead #${inv.lead.id}`;
  return '';
}

export function InvoiceList() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Reset page on filter change (adjust during render)
  const [prevFilters, setPrevFilters] = useState({ search, statusFilter });
  if (prevFilters.search !== search || prevFilters.statusFilter !== statusFilter) {
    setPrevFilters({ search, statusFilter });
    setPage(1);
  }

  const abortRef = useRef<AbortController | null>(null);

  const loadInvoices = useCallback(
    async (currentPage: number, sq: string, sf: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(currentPage) });
        if (sq) params.set('search', sq);
        if (sf) params.set('status', sf);
        const res = await fetch(`/api/accounting/invoices?${params.toString()}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setInvoices(data.data ?? []);
        setStats(
          data.stats ?? { totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0, overdueCount: 0 },
        );
        setTotalPages(data.meta?.pages ?? 1);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        toastError('Failed to load', 'Could not load invoices. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [toastError],
  );

  /* eslint-disable react-hooks/set-state-in-effect -- API data fetch on dependency change */
  useEffect(() => {
    void loadInvoices(page, search, statusFilter);
  }, [page, search, statusFilter, loadInvoices]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/accounting/invoices/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toastError('Delete failed', data.error ?? 'An error occurred.'); return; }
      success('Deleted', `Invoice ${deleteTarget.invoiceNumber} has been deleted.`);
      setDeleteTarget(null);
      void loadInvoices(page, search, statusFilter);
    } catch {
      toastError('Delete failed', 'An unexpected error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (inv: InvoiceRecord) => {
    setIsDuplicating(inv.id);
    try {
      const res = await fetch(`/api/accounting/invoices/${inv.id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { toastError('Duplicate failed', data.error ?? 'An error occurred.'); return; }
      success('Duplicated', `Invoice ${data.data.invoiceNumber} created as a draft.`);
      router.push(`/portal/accounting/invoices/${data.data.id}`);
    } catch {
      toastError('Duplicate failed', 'An unexpected error occurred.');
    } finally {
      setIsDuplicating(null);
    }
  };

  const handlePrintClick = async (inv: InvoiceRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintingId(inv.id);
    try {
      // Always fetch the full invoice (items + payments needed for PDF)
      const res = await fetch(`/api/accounting/invoices/${inv.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await openInvoicePDF(data.data);
    } catch {
      toastError('Print failed', 'Could not generate PDF.');
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Invoices</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and track all client invoices.</p>
        </div>
        <Button
          variant="default"
          onClick={() => router.push('/portal/accounting/invoices/new')}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
        >
          <Plus size={16} /> New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 mb-3 w-fit"><FileText size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Invoiced</p>
          <p className="text-2xl font-black text-slate-900">{fmt(stats.totalInvoiced)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 mb-3 w-fit"><CheckCircle2 size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Collected</p>
          <p className="text-2xl font-black text-emerald-600">{fmt(stats.totalCollected)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600 mb-3 w-fit"><Clock size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-black text-slate-900">{fmt(stats.totalOutstanding)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-red-50 p-3 rounded-xl text-red-600 mb-3 w-fit"><AlertTriangle size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-2xl font-black text-red-600">{stats.overdueCount}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices, clients..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
          >
            <option value="">All Status</option>
            {(Object.entries(STATUS_CONFIG) as [InvoiceStatus, typeof STATUS_CONFIG[InvoiceStatus]][]).map(
              ([k, v]) => <option key={k} value={k}>{v.label}</option>,
            )}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice No.</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billed To</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No invoices found.</td></tr>
              ) : (
                invoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status];
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/portal/accounting/invoices/${inv.id}`)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-amber-700">{inv.invoiceNumber}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-[10px] font-black shrink-0">
                            {getDisplayName(inv).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{getDisplayName(inv)}</p>
                            <p className="text-[10px] text-slate-400">{getSubLabel(inv)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{fmtDate(inv.issueDate)}</td>
                      <td className="px-5 py-4">
                        <span className={inv.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {fmtDate(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="font-black text-slate-900">{fmt(inv.totalAmount)}</p>
                        {inv.balanceDue > 0 && inv.balanceDue < inv.totalAmount && (
                          <p className="text-[10px] text-amber-600 font-bold">Due: {fmt(inv.balanceDue)}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={cfg.badge} className="text-[9px] uppercase flex items-center gap-1 w-fit">
                          {cfg.icon} {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button title="View" onClick={() => router.push(`/portal/accounting/invoices/${inv.id}`)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                            <Eye size={14} />
                          </button>
                          <button title="Print" onClick={(e) => void handlePrintClick(inv, e)} disabled={printingId === inv.id} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-40">
                            <Printer size={14} className={printingId === inv.id ? 'animate-pulse' : ''} />
                          </button>
                          <button title="Edit" onClick={(e) => { e.stopPropagation(); router.push(`/portal/accounting/invoices/${inv.id}?edit=true`); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button title="Duplicate" disabled={isDuplicating === inv.id} onClick={(e) => { e.stopPropagation(); void handleDuplicate(inv); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors disabled:opacity-40">
                            <Copy size={14} />
                          </button>
                          <button title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteTarget(inv); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Invoice" size="sm">
        {deleteTarget && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete{' '}
              <span className="font-bold text-amber-700">{deleteTarget.invoiceNumber}</span>?
            </p>
            {deleteTarget.status !== 'DRAFT' && deleteTarget.status !== 'VOID' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                Only DRAFT or VOID invoices can be deleted. The server will reject this request if the invoice has been issued.
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

