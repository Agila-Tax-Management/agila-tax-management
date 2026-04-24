// src/app/(portal)/portal/sales/quotations/components/QuotationsPage.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  FileText, Search, Plus, Loader2, Trash2, Edit2, Eye,
  RefreshCw, ChevronUp, ChevronDown, AlertCircle,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { SalesQuoteListItem } from '@/lib/data/sales/quotes';
import { NewQuotationModal } from './NewQuotationModal';
import { QuotationViewModal } from './QuotationViewModal';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT_TO_CLIENT: 'bg-blue-100 text-blue-700',
  NEGOTIATING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT_TO_CLIENT: 'Sent',
  NEGOTIATING: 'Negotiating',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ quote }: { quote: SalesQuoteListItem }) {
  if (quote.sourceType === 'LEAD') {
    return (
      <div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 mb-0.5">
          Lead
        </span>
        <p className="text-xs text-slate-600 leading-tight">
          {quote.lead?.firstName} {quote.lead?.lastName}
          {quote.lead?.businessName && (
            <span className="text-slate-400"> · {quote.lead.businessName}</span>
          )}
        </p>
      </div>
    );
  }
  return (
    <div>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 mb-0.5">
        Client
      </span>
      <p className="text-xs text-slate-600 leading-tight">
        {quote.client?.businessName}
        {quote.client?.clientNo && (
          <span className="text-slate-400"> · {quote.client.clientNo}</span>
        )}
      </p>
    </div>
  );
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortField = 'quoteNumber' | 'sourceType' | 'grandTotal' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ChevronDown size={12} className="text-slate-300" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-slate-500" />
    : <ChevronDown size={12} className="text-slate-500" />;
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  target,
  onCancel,
  onConfirm,
  deleting,
}: {
  target: SalesQuoteListItem;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-100">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Delete Quotation</h3>
            <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-700 mb-6">
          Are you sure you want to delete{' '}
          <strong className="text-slate-900">{target.quoteNumber}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuotationsPage(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [quotes, setQuotes] = useState<SalesQuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<'ALL' | 'LEAD' | 'CLIENT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [showNewModal, setShowNewModal] = useState(false);
  const [viewTarget, setViewTarget] = useState<SalesQuoteListItem | null>(null);
  const [editTarget, setEditTarget] = useState<SalesQuoteListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesQuoteListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales/quotes');
      const json = await res.json() as { data?: SalesQuoteListItem[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load');
      setQuotes(json.data ?? []);
    } catch {
      toastError('Load failed', 'Could not fetch quotations.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { void fetchQuotes(); }, [fetchQuotes]);

  // ─── Sort handler ─────────────────────────────────────────────────────────
  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  // ─── Filter + sort ────────────────────────────────────────────────────────
  const filtered = quotes
    .filter((q) => {
      const matchSearch =
        search === '' ||
        q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
        (q.lead && `${q.lead.firstName} ${q.lead.lastName}`.toLowerCase().includes(search.toLowerCase())) ||
        (q.lead?.businessName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (q.client?.businessName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (q.client?.clientNo ?? '').toLowerCase().includes(search.toLowerCase());
      const matchSource = filterSource === 'ALL' || q.sourceType === filterSource;
      const matchStatus = filterStatus === 'ALL' || q.status === filterStatus;
      return matchSearch && matchSource && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'quoteNumber':
          cmp = a.quoteNumber.localeCompare(b.quoteNumber);
          break;
        case 'sourceType':
          cmp = a.sourceType.localeCompare(b.sourceType);
          break;
        case 'grandTotal':
          cmp = parseFloat(a.grandTotal) - parseFloat(b.grandTotal);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // ─── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sales/quotes/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Delete failed', json.error ?? 'Could not delete this quotation.');
        return;
      }
      setQuotes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setDeleteTarget(null);
      success('Quotation deleted', `${deleteTarget.quoteNumber} has been removed.`);
    } catch {
      toastError('Delete failed', 'An unexpected error occurred.');
    } finally {
      setDeleting(false);
    }
  }

  // ─── Table header cell ────────────────────────────────────────────────────
  function Th({ field, label }: { field: SortField; label: string }) {
    return (
      <th
        className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
        </div>
      </th>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quotations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            All quotations — leads and existing clients
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void fetchQuotes()}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#25238e] text-white rounded-xl text-sm font-bold hover:bg-[#1e1c7a] transition-colors"
          >
            <Plus size={15} /> New Quotation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by quote #, client, lead name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/20"
          />
        </div>

        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as 'ALL' | 'LEAD' | 'CLIENT')}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/20"
        >
          <option value="ALL">All Sources</option>
          <option value="LEAD">Lead</option>
          <option value="CLIENT">Client</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/20"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT_TO_CLIENT">Sent</option>
          <option value="NEGOTIATING">Negotiating</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th field="quoteNumber" label="Quote #" />
                <Th field="sourceType" label="Source" />
                <Th field="grandTotal" label="Grand Total" />
                <Th field="status" label="Status" />
                <Th field="createdAt" label="Created" />
                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading quotations…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <FileText size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No quotations found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || filterSource !== 'ALL' || filterStatus !== 'ALL'
                        ? 'Try adjusting your filters.'
                        : 'Create a new quotation to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm font-bold text-slate-800">
                        {quote.quoteNumber}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {quote.lineItemCount} service{quote.lineItemCount !== 1 ? 's' : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <SourceBadge quote={quote} />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 text-sm">
                      ₱{Number(quote.grandTotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(quote.createdAt).toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setViewTarget(quote)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          title="View"
                        >
                          <Eye size={12} /> View
                        </button>
                        {quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' && (
                          <button
                            onClick={() => setEditTarget(quote)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(quote)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
          {loading ? 'Loading…' : `Showing ${filtered.length} of ${quotes.length} quotations`}
        </div>
      </div>

      {/* New Quotation Modal */}
      <NewQuotationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={(newQuote) => {
          setQuotes((prev) => [newQuote, ...prev]);
          setShowNewModal(false);
          success('Quotation created', `${newQuote.quoteNumber} has been saved.`);
        }}
      />

      {/* View Modal */}
      {viewTarget && (
        <QuotationViewModal
          quoteId={viewTarget.id}
          quoteNumber={viewTarget.quoteNumber}
          isOpen={viewTarget !== null}
          onClose={() => setViewTarget(null)}
          onAccepted={(id) => {
            setQuotes((prev) =>
              prev.map((q) => (q.id === id ? { ...q, status: 'ACCEPTED' } : q)),
            );
          }}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <NewQuotationModal
          isOpen={editTarget !== null}
          onClose={() => setEditTarget(null)}
          existingQuote={editTarget}
          onSuccess={(updated) => {
            setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
            setEditTarget(null);
            success('Quotation updated', `${updated.quoteNumber} has been saved.`);
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
          deleting={deleting}
        />
      )}
    </div>
  );
}
