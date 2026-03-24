// src/components/client-gateway/ClientGatewayActivityLog.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Search, ActivitySquare, Clock } from 'lucide-react';
import {
  MOCK_ACTIVITY_LOGS,
  type ActivityLogItem,
} from '@/lib/mock-client-gateway-data';

type LogCategory = ActivityLogItem['category'] | 'All';

const CATEGORY_BADGE: Record<ActivityLogItem['category'], string> = {
  Document: 'bg-blue-100 text-blue-700 border border-blue-200',
  Status:   'bg-orange-100 text-orange-700 border border-orange-200',
  Account:  'bg-purple-100 text-purple-700 border border-purple-200',
  Portal:   'bg-indigo-100 text-indigo-700 border border-indigo-200',
  Filing:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const CATEGORY_ICON_BG: Record<ActivityLogItem['category'], string> = {
  Document: 'bg-blue-50',
  Status:   'bg-orange-50',
  Account:  'bg-purple-50',
  Portal:   'bg-indigo-50',
  Filing:   'bg-emerald-50',
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

export function ClientGatewayActivityLog(): React.ReactNode {
  const [searchTerm, setSearchTerm]   = useState('');
  const [category, setCategory]       = useState<LogCategory>('All');

  const filtered = useMemo(() => {
    let list = MOCK_ACTIVITY_LOGS;
    if (category !== 'All') list = list.filter((l) => l.category === category);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (l) =>
          l.clientName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.performedBy.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q),
      );
    }
    return list;
  }, [searchTerm, category]);

  const categories: LogCategory[] = ['All', 'Document', 'Status', 'Account', 'Portal', 'Filing'];

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
            placeholder="Search by client, action, or performer…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#25238e]/30"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
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
        {filtered.length === 0 ? (
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
                    {filtered.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-foreground text-sm">{log.clientName}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{log.clientNumber}</p>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">{log.action}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_BADGE[log.category]}`}>
                            {log.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-sm">{log.performedBy}</td>
                        <td className="px-4 py-3.5 text-muted-foreground text-sm max-w-xs">
                          <span className="line-clamp-2" title={log.details}>{log.details}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-xs font-medium text-foreground">{formatRelative(log.timestamp)}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {formatDateTime(log.timestamp)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Showing {filtered.length} of {MOCK_ACTIVITY_LOGS.length} log entries
                </p>
              </div>
            </div>

            {/* Timeline view (below table) */}
            <div className="mt-6">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <ActivitySquare size={14} className="text-[#25238e]" /> Recent Activity Timeline
              </h2>
              <div className="relative">
                {/* vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {filtered.map((log) => (
                    <div key={`tl-${log.id}`} className="flex items-start gap-4 pl-2">
                      {/* dot */}
                      <div className={`relative z-10 w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${CATEGORY_ICON_BG[log.category]}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          log.category === 'Document' ? 'bg-blue-500' :
                          log.category === 'Status'   ? 'bg-orange-500' :
                          log.category === 'Account'  ? 'bg-purple-500' :
                          log.category === 'Portal'   ? 'bg-indigo-500' : 'bg-emerald-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0 bg-card border border-border rounded-xl p-3.5 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-foreground text-sm">{log.action}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelative(log.timestamp)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs font-medium text-foreground">{log.clientName}</span>
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
