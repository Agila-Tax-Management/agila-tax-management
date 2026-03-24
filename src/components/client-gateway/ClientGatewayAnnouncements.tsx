// src/components/client-gateway/ClientGatewayAnnouncements.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Search, Megaphone, Tag, User, Calendar, Plus, X } from 'lucide-react';
import {
  MOCK_ANNOUNCEMENTS,
  type AnnouncementItem,
} from '@/lib/mock-client-gateway-data';

const PRIORITY_BADGE: Record<AnnouncementItem['priority'], string> = {
  Normal: 'bg-slate-100 text-slate-600 border border-slate-200',
  High:   'bg-orange-100 text-orange-700 border border-orange-200',
  Urgent: 'bg-red-100 text-red-700 border border-red-200',
};

const AUDIENCE_BADGE: Record<AnnouncementItem['audience'], string> = {
  'All Clients':      'bg-indigo-50 text-indigo-700',
  'Active Only':      'bg-emerald-50 text-emerald-700',
  'VAT Clients':      'bg-blue-50 text-blue-700',
  'Non-VAT Clients':  'bg-amber-50 text-amber-700',
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
  const [searchTerm, setSearchTerm]     = useState('');
  const [priority, setPriority]         = useState<AnnouncementItem['priority'] | 'All'>('All');
  const [audience, setAudience]         = useState<AnnouncementItem['audience'] | 'All'>('All');
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(MOCK_ANNOUNCEMENTS);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newContent, setNewContent]     = useState('');
  const [newAudience, setNewAudience]   = useState<AnnouncementItem['audience']>('All Clients');
  const [newPriority, setNewPriority]   = useState<AnnouncementItem['priority']>('Normal');
  const [newAuthor, setNewAuthor]       = useState('Admin');

  function handleNewSubmit() {
    if (!newTitle.trim() || !newContent.trim()) return;
    const ann: AnnouncementItem = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      content: newContent.trim(),
      audience: newAudience,
      priority: newPriority,
      author: newAuthor.trim() || 'Admin',
      publishedAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [ann, ...prev]);
    setNewModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewAudience('All Clients');
    setNewPriority('Normal');
    setNewAuthor('Admin');
  }

  const filtered = useMemo(() => {
    let list = announcements;
    if (priority !== 'All') list = list.filter((a) => a.priority === priority);
    if (audience !== 'All') list = list.filter((a) => a.audience === audience);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q),
      );
    }
    return list;
  }, [announcements, searchTerm, priority, audience]);

  const urgentCount = announcements.filter((a) => a.priority === 'Urgent').length;

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
            {announcements.length} Total
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {urgentCount} Urgent
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
          {(['All', 'Normal', 'High', 'Urgent'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                priority === p
                  ? 'bg-[#25238e] text-white border-[#25238e]'
                  : 'bg-card text-muted-foreground border-border hover:border-[#25238e]/40'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Audience filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(['All', 'All Clients', 'VAT Clients', 'Non-VAT Clients', 'Active Only'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                audience === a
                  ? 'bg-[#25238e] text-white border-[#25238e]'
                  : 'bg-card text-muted-foreground border-border hover:border-[#25238e]/40'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto px-6 pb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Megaphone size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No announcements match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ann) => {
              const isExpanded = expanded === ann.id;
              return (
                <div
                  key={ann.id}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all hover:shadow-sm ${
                    ann.priority === 'Urgent'
                      ? 'border-red-200'
                      : ann.priority === 'High'
                        ? 'border-orange-200'
                        : 'border-border'
                  }`}
                >
                  {/* Priority stripe */}
                  <div className={`h-1 w-full ${
                    ann.priority === 'Urgent' ? 'bg-red-500' :
                    ann.priority === 'High'   ? 'bg-orange-400' : 'bg-transparent'
                  }`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Icon + title */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${
                          ann.priority === 'Urgent' ? 'bg-red-100' :
                          ann.priority === 'High'   ? 'bg-orange-100' : 'bg-muted'
                        }`}>
                          <Megaphone size={16} className={
                            ann.priority === 'Urgent' ? 'text-red-600' :
                            ann.priority === 'High'   ? 'text-orange-600' : 'text-muted-foreground'
                          } />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground leading-snug">{ann.title}</p>

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

                      {/* Badges */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PRIORITY_BADGE[ann.priority]}`}>
                          {ann.priority}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${AUDIENCE_BADGE[ann.audience]}`}>
                          {ann.audience}
                        </span>
                      </div>
                    </div>

                    {/* Footer meta */}
                    <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User size={11} /> <span className="font-medium text-foreground">{ann.author}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={11} /> {formatRelative(ann.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag size={11} /> {ann.audience}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Showing {filtered.length} of {announcements.length} announcements
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
                    onChange={(e) => setNewAudience(e.target.value as AnnouncementItem['audience'])}
                  >
                    <option>All Clients</option>
                    <option>Active Only</option>
                    <option>VAT Clients</option>
                    <option>Non-VAT Clients</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 appearance-none cursor-pointer"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as AnnouncementItem['priority'])}
                  >
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Author</label>
                <input
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 focus:border-[#25238e]/50"
                  placeholder="Your name…"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                />
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
                onClick={handleNewSubmit}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-[#25238e]/20"
              >
                <Plus size={14} /> Post Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
