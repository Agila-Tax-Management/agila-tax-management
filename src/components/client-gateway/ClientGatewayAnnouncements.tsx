// src/components/client-gateway/ClientGatewayAnnouncements.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Megaphone, Tag, User, Calendar, Plus, X,
  Loader2, AlertCircle, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

type AnnouncementAudience = 'ALL_CLIENTS' | 'ACTIVE_ONLY' | 'VAT_CLIENTS' | 'NON_VAT_CLIENTS';
type AnnouncementPriority = 'NORMAL' | 'HIGH' | 'URGENT';

/* ─── Types ─────────────────────────────────────────────────────── */

export interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  authorName: string;
  isActive: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type PriorityFilter = AnnouncementPriority | 'All';
type AudienceFilter = AnnouncementAudience | 'All';

/* ─── Display maps ───────────────────────────────────────────────── */

const PRIORITY_LABEL: Record<AnnouncementPriority, string> = {
  NORMAL: 'Normal',
  HIGH:   'High',
  URGENT: 'Urgent',
};

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  ALL_CLIENTS:     'All Clients',
  ACTIVE_ONLY:     'Active Only',
  VAT_CLIENTS:     'VAT Clients',
  NON_VAT_CLIENTS: 'Non-VAT Clients',
};

const PRIORITY_BADGE: Record<AnnouncementPriority, string> = {
  NORMAL: 'bg-slate-100 text-slate-600 border border-slate-200',
  HIGH:   'bg-orange-100 text-orange-700 border border-orange-200',
  URGENT: 'bg-red-100 text-red-700 border border-red-200',
};

const AUDIENCE_BADGE: Record<AnnouncementAudience, string> = {
  ALL_CLIENTS:     'bg-indigo-50 text-indigo-700',
  ACTIVE_ONLY:     'bg-emerald-50 text-emerald-700',
  VAT_CLIENTS:     'bg-blue-50 text-blue-700',
  NON_VAT_CLIENTS: 'bg-amber-50 text-amber-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  return formatDate(iso);
}

export function ClientGatewayAnnouncements(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState<string | null>(null);
  const [total, setTotal]                 = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority]     = useState<PriorityFilter>('All');
  const [audience, setAudience]     = useState<AudienceFilter>('All');
  const [expanded, setExpanded]     = useState<string | null>(null);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newContent, setNewContent]     = useState('');
  const [newAudience, setNewAudience]   = useState<AnnouncementAudience>('ALL_CLIENTS');
  const [newPriority, setNewPriority]   = useState<AnnouncementPriority>('NORMAL');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch ── */
  const fetchAnnouncements = useCallback(async (search: string, pri: PriorityFilter, aud: AudienceFilter) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search.trim()) params.set('search', search.trim());
      if (pri !== 'All') params.set('priority', pri);
      if (aud !== 'All') params.set('audience', aud);

      const res = await fetch(`/api/client-gateway/announcements?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load');

      const json = (await res.json()) as { data: AnnouncementRecord[]; pagination: { total: number } };
      setAnnouncements(json.data);
      setTotal(json.pagination.total);
    } catch {
      setFetchError('Could not load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  /* Adjust-state-during-render for debounced search + immediate filter changes */
  const [prevSearch, setPrevSearch]     = useState('');
  const [prevPriority, setPrevPriority] = useState<PriorityFilter>('All');
  const [prevAudience, setPrevAudience] = useState<AudienceFilter>('All');

  if (searchTerm !== prevSearch || priority !== prevPriority || audience !== prevAudience) {
    setPrevSearch(searchTerm);
    setPrevPriority(priority);
    setPrevAudience(audience);
    if (searchTerm !== prevSearch) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { void fetchAnnouncements(searchTerm, priority, audience); }, 350);
    } else {
      void fetchAnnouncements(searchTerm, priority, audience);
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect -- initial data fetch on mount */
  useEffect(() => {
    void fetchAnnouncements('', 'All', 'All');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── Create ── */
  async function handleCreate() {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/client-gateway/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          audience: newAudience,
          priority: newPriority,
          authorName: 'Staff',
          isActive: true,
        }),
      });
      if (!res.ok) { const j = (await res.json()) as { error?: string }; throw new Error(j.error ?? 'Failed'); }
      success('Announcement posted', 'The announcement is now live for clients.');
      setNewModalOpen(false);
      setNewTitle(''); setNewContent(''); setNewAudience('ALL_CLIENTS'); setNewPriority('NORMAL');
      void fetchAnnouncements(searchTerm, priority, audience);
    } catch (err) {
      toastError('Failed to post', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  /* ── Toggle active ── */
  async function handleToggleActive(ann: AnnouncementRecord) {
    try {
      const res = await fetch(`/api/client-gateway/announcements/${ann.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ann.isActive }),
      });
      if (!res.ok) throw new Error();
      setAnnouncements((prev) => prev.map((a) => a.id === ann.id ? { ...a, isActive: !ann.isActive } : a));
      success(ann.isActive ? 'Unpublished' : 'Published', ann.title);
    } catch {
      toastError('Update failed', 'Could not toggle announcement status.');
    }
  }

  /* ── Delete ── */
  async function handleDelete(ann: AnnouncementRecord) {
    if (!confirm(`Delete "${ann.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/client-gateway/announcements/${ann.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id));
      setTotal((t) => t - 1);
      success('Deleted', ann.title);
    } catch {
      toastError('Delete failed', 'Could not delete the announcement.');
    }
  }

  const urgentCount = announcements.filter((a) => a.priority === 'URGENT' && a.isActive).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-foreground">Announcements</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Broadcast updates and reminders to your clients.
            </p>
          </div>
          <button onClick={() => setNewModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors shadow-sm shadow-[#25238e]/20 shrink-0">
            <Plus size={15} /> New Announcement
          </button>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
            <Megaphone size={13} className="text-[#25238e]" />
            {total} Total
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {urgentCount} Urgent Active
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-4 shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search announcements…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#25238e]/30"
          />
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(['All', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                priority === p
                  ? 'bg-[#25238e] text-white border-[#25238e]'
                  : 'bg-card text-muted-foreground border-border hover:border-[#25238e]/40'
              }`}
            >
              {p === 'All' ? 'All' : PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>

        {/* Audience filter */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {(['All', 'ALL_CLIENTS', 'VAT_CLIENTS', 'NON_VAT_CLIENTS', 'ACTIVE_ONLY'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                audience === a
                  ? 'bg-[#25238e] text-white border-[#25238e]'
                  : 'bg-card text-muted-foreground border-border hover:border-[#25238e]/40'
              }`}
            >
              {a === 'All' ? 'All Audience' : AUDIENCE_LABEL[a]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto px-6 pb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle size={36} className="text-red-400 mb-3" />
            <p className="text-foreground font-semibold text-sm">Failed to load</p>
            <p className="text-muted-foreground text-xs mt-1">{fetchError}</p>
            <button
              onClick={() => void fetchAnnouncements(searchTerm, priority, audience)}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-[#25238e] text-white hover:bg-[#1e1c7a] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Megaphone size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No announcements match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => {
              const isExpanded = expanded === ann.id;
              return (
                <div
                  key={ann.id}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all hover:shadow-sm ${
                    !ann.isActive ? 'opacity-60 border-dashed' :
                    ann.priority === 'URGENT' ? 'border-red-200' :
                    ann.priority === 'HIGH'   ? 'border-orange-200' : 'border-border'
                  }`}
                >
                  {/* Priority stripe */}
                  <div className={`h-1 w-full ${
                    ann.priority === 'URGENT' ? 'bg-red-500' :
                    ann.priority === 'HIGH'   ? 'bg-orange-400' : 'bg-transparent'
                  }`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Icon + title */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${
                          ann.priority === 'URGENT' ? 'bg-red-100' :
                          ann.priority === 'HIGH'   ? 'bg-orange-100' : 'bg-muted'
                        }`}>
                          <Megaphone size={16} className={
                            ann.priority === 'URGENT' ? 'text-red-600' :
                            ann.priority === 'HIGH'   ? 'text-orange-600' : 'text-muted-foreground'
                          } />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-foreground leading-snug">{ann.title}</p>
                            {!ann.isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">
                                Unpublished
                              </span>
                            )}
                          </div>

                          {/* Content — truncated unless expanded */}
                          <p className={`text-sm text-muted-foreground mt-1.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {ann.content}
                          </p>
                          {ann.content.length > 120 && (
                            <button
                              onClick={() => setExpanded(isExpanded ? null : ann.id)}
                              className="mt-1 text-xs font-semibold text-[#25238e] hover:underline"
                            >
                              {isExpanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Badges + actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PRIORITY_BADGE[ann.priority]}`}>
                          {PRIORITY_LABEL[ann.priority]}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${AUDIENCE_BADGE[ann.audience]}`}>
                          {AUDIENCE_LABEL[ann.audience]}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            title={ann.isActive ? 'Unpublish' : 'Publish'}
                            onClick={() => void handleToggleActive(ann)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {ann.isActive
                              ? <ToggleRight size={15} className="text-emerald-600" />
                              : <ToggleLeft size={15} />}
                          </button>
                          <button
                            title="Delete"
                            onClick={() => void handleDelete(ann)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer meta */}
                    <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User size={11} /> <span className="font-medium text-foreground">{ann.authorName}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={11} /> {formatRelative(ann.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag size={11} /> {AUDIENCE_LABEL[ann.audience]}
                      </span>
                      {ann.expiresAt && (
                        <span className="flex items-center gap-1.5 text-xs text-orange-600">
                          Expires {formatDate(ann.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && announcements.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Showing {announcements.length} of {total} announcements
          </p>
        )}
      </div>

      {/* New Announcement Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#25238e]/10">
                  <Megaphone size={16} className="text-[#25238e]" />
                </div>
                <h2 className="font-black text-slate-900">New Announcement</h2>
              </div>
              <button onClick={() => setNewModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[60vh] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 focus:border-[#25238e]/50"
                  placeholder="Announcement title…"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 focus:border-[#25238e]/50 resize-none"
                  placeholder="Write the announcement here…"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Audience</label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 appearance-none cursor-pointer"
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value as AnnouncementAudience)}
                  >
                    <option value="ALL_CLIENTS">All Clients</option>
                    <option value="ACTIVE_ONLY">Active Only</option>
                    <option value="VAT_CLIENTS">VAT Clients</option>
                    <option value="NON_VAT_CLIENTS">Non-VAT Clients</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 appearance-none cursor-pointer"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as AnnouncementPriority)}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setNewModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={!newTitle.trim() || !newContent.trim() || saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-[#25238e]/20"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? 'Posting…' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
