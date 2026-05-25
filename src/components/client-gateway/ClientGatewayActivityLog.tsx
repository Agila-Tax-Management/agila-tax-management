// src/components/client-gateway/ClientGatewayActivityLog.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ActivitySquare, Clock, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ActivityLogEntry {
  id: string;
  clientId: number | null;
  clientNo: string | null;
  clientName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  performedBy: string;
  category: LogCategory;
  createdAt: string;
}

type LogCategory = 'Document' | 'Status' | 'Account' | 'Portal' | 'Filing';
type LogCategoryFilter = LogCategory | 'All';

const CATEGORY_BADGE: Record<LogCategory, string> = {
  Document: 'bg-blue-100 text-blue-700 border border-blue-200',
  Status:   'bg-orange-100 text-orange-700 border border-orange-200',
  Account:  'bg-purple-100 text-purple-700 border border-purple-200',
  Portal:   'bg-indigo-100 text-indigo-700 border border-indigo-200',
  Filing:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const CATEGORY_ICON_BG: Record<LogCategory, string> = {
  Document: 'bg-blue-50',
  Status:   'bg-orange-50',
  Account:  'bg-purple-50',
  Portal:   'bg-indigo-50',
  Filing:   'bg-emerald-50',
};

const CATEGORY_DOT: Record<LogCategory, string> = {
  Document: 'bg-blue-500',
  Status:   'bg-orange-500',
  Account:  'bg-purple-500',
  Portal:   'bg-indigo-500',
  Filing:   'bg-emerald-500',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return formatDateTime(iso);
}

function formatAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORIES: LogCategoryFilter[] = ['All', 'Document', 'Status', 'Account', 'Portal', 'Filing'];
const PAGE_SIZE = 25;

interface ApiResponse {
  data: ActivityLogEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function ClientGatewayActivityLog(): React.ReactNode {
  const [logs, setLogs]               = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [category, setCategory]       = useState<LogCategoryFilter>('All');
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(async (currentPage: number, search: string, cat: LogCategoryFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        category: cat,
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/client-gateway/activity-log?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load activity logs');

      const json = (await res.json()) as ApiResponse;
      setLogs(json.data);
      setTotal(json.pagination.total);
      setTotalPages(json.pagination.totalPages);
    } catch {
      setError('Could not load activity logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search, immediate on category/page change
  const [prevSearch, setPrevSearch]     = useState('');
  const [prevCategory, setPrevCategory] = useState<LogCategoryFilter>('All');
  const [prevPage, setPrevPage]         = useState(1);

  if (searchTerm !== prevSearch || category !== prevCategory || page !== prevPage) {
    setPrevSearch(searchTerm);
    setPrevCategory(category);
    setPrevPage(page);

    if (searchTerm !== prevSearch) {
      // debounce search changes
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchLogs(1, searchTerm, category);
      }, 350);
      if (page !== 1) setPage(1);
    } else {
      // immediate on category or page change
      void fetchLogs(page, searchTerm, category);
    }
  }

  // Initial load
  useEffect(() => {
    void fetchLogs(1, '', 'All');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-black text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Full audit trail of all actions performed across client accounts.
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 pb-4 shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#25238e]/30"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                category === cat
                  ? 'bg-[#25238e] text-white border-[#25238e]'
                  : 'bg-card text-muted-foreground border-border hover:border-[#25238e]/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle size={36} className="text-red-400 mb-3" />
            <p className="text-foreground font-semibold text-sm">Failed to load logs</p>
            <p className="text-muted-foreground text-xs mt-1">{error}</p>
            <button
              onClick={() => void fetchLogs(page, searchTerm, category)}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-[#25238e] text-white hover:bg-[#1e1c7a] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ActivitySquare size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No activity log entries found.</p>
          </div>
        ) : (
          <>
            {/* Table view */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performed By</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-foreground text-sm">{log.clientName ?? '—'}</p>
                          {log.clientNo && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{log.clientNo}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">{formatAction(log.action)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_BADGE[log.category]}`}>
                            {log.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-sm">{log.performedBy}</td>
                        <td className="px-4 py-3.5 text-muted-foreground text-sm max-w-xs">
                          <span className="line-clamp-2" title={log.description}>{log.description}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-xs font-medium text-foreground">{formatRelative(log.createdAt)}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {formatDateTime(log.createdAt)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Footer: count + pagination */}
              <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} entries
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs font-semibold text-foreground">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline view */}
            <div className="mt-6">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <ActivitySquare size={14} className="text-[#25238e]" /> Recent Activity Timeline
              </h2>
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={`tl-${log.id}`} className="flex items-start gap-4 pl-2">
                      <div className={`relative z-10 w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${CATEGORY_ICON_BG[log.category]}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_DOT[log.category]}`} />
                      </div>
                      <div className="flex-1 min-w-0 bg-card border border-border rounded-xl p-3.5 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-foreground text-sm">{formatAction(log.action)}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelative(log.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {log.clientName && (
                            <span className="text-xs font-medium text-foreground">{log.clientName}</span>
                          )}
                          <span className="text-xs text-muted-foreground">· {log.performedBy}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[log.category]}`}>
                            {log.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
