// src/components/it/ITSystemStatus.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import {
  Plus, Activity, CheckCircle2, AlertTriangle, XCircle,
  Wrench, X, Loader2, Pencil,
} from 'lucide-react';

interface StatusEntry {
  id: number;
  systemName: string;
  status: string;
  description: string | null;
  updatedAt: string;
  updatedBy: { id: string; name: string } | null;
}

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral'; icon: typeof CheckCircle2; label: string }> = {
  OPERATIONAL: { variant: 'success', icon: CheckCircle2, label: 'Operational' },
  DEGRADED: { variant: 'warning', icon: AlertTriangle, label: 'Degraded' },
  OUTAGE: { variant: 'danger', icon: XCircle, label: 'Outage' },
  MAINTENANCE: { variant: 'neutral', icon: Wrench, label: 'Maintenance' },
};

const EMPTY_FORM = { systemName: '', status: 'OPERATIONAL', description: '' };

export function ITSystemStatus() {
  const { success, error } = useToast();
  const [entries, setEntries] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<StatusEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    const res = await fetch('/api/it/system-status', { cache: 'no-store' });
    const json = await res.json();
    setEntries(json.data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    void fetchEntries().finally(() => setLoading(false));
  }, [fetchEntries]);

  function openAdd() {
    setEditEntry(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(entry: StatusEntry) {
    setEditEntry(entry);
    setForm({ systemName: entry.systemName, status: entry.status, description: entry.description ?? '' });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.systemName.trim()) { error('Missing name', 'System name is required.'); return; }
    setSubmitting(true);
    try {
      const method = editEntry ? 'PUT' : 'POST';
      const res = await fetch('/api/it/system-status', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const j = await res.json(); error('Failed', j.error ?? 'Error occurred.'); return; }
      success(editEntry ? 'Status updated' : 'System added', `${form.systemName} has been ${editEntry ? 'updated' : 'added'}.`);
      setShowForm(false);
      setEditEntry(null);
      void fetchEntries();
    } catch { error('Failed', 'Unexpected error.'); }
    finally { setSubmitting(false); }
  }

  const overall = entries.some((e) => e.status === 'OUTAGE')
    ? 'OUTAGE'
    : entries.some((e) => e.status === 'DEGRADED' || e.status === 'MAINTENANCE')
    ? 'DEGRADED'
    : 'OPERATIONAL';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">System Status</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor the health of all portals and systems.</p>
        </div>
        <Button onClick={openAdd} className="bg-cyan-700 hover:bg-cyan-800 text-white">
          <Plus size={16} className="mr-2" /> Add System
        </Button>
      </div>

      {/* Overall health banner */}
      <Card className={`p-4 flex items-center gap-3 ${
        overall === 'OPERATIONAL' ? 'bg-emerald-50 border-emerald-200' :
        overall === 'OUTAGE' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <Activity size={20} className={overall === 'OPERATIONAL' ? 'text-emerald-600' : overall === 'OUTAGE' ? 'text-red-600' : 'text-amber-600'} />
        <div>
          <p className={`font-bold text-sm ${overall === 'OPERATIONAL' ? 'text-emerald-700' : overall === 'OUTAGE' ? 'text-red-700' : 'text-amber-700'}`}>
            Overall: {overall === 'OPERATIONAL' ? 'All Systems Operational' : overall === 'OUTAGE' ? 'Active Outage' : 'Some Systems Affected'}
          </p>
          <p className="text-xs text-slate-500">
            {entries.filter((e) => e.status === 'OPERATIONAL').length} operational ·{' '}
            {entries.filter((e) => e.status !== 'OPERATIONAL').length} issues
          </p>
        </div>
      </Card>

      {/* Add/Edit form */}
      {showForm && (
        <Card className="p-5 border-cyan-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">{editEntry ? 'Update System Status' : 'Add System'}</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">System Name</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 disabled:bg-slate-50"
                placeholder="e.g., Sales Portal, BIR eFPS"
                value={form.systemName}
                disabled={!!editEntry}
                onChange={(e) => setForm((f) => ({ ...f, systemName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="OPERATIONAL">Operational</option>
                <option value="DEGRADED">Degraded</option>
                <option value="OUTAGE">Outage</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Description (optional)</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
              placeholder="Brief note about the current status…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-cyan-700 hover:bg-cyan-800 text-white">
              {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
              {editEntry ? 'Update' : 'Add System'}
            </Button>
          </div>
        </Card>
      )}

      {/* Status grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-cyan-700" /></div>
      ) : entries.length === 0 ? (
        <Card className="p-12 text-center">
          <Activity size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No systems tracked yet</p>
          <p className="text-slate-400 text-sm mt-1">Add portals and systems to monitor their status.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => {
            const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.OPERATIONAL!;
            const Icon = cfg.icon;
            return (
              <Card key={entry.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{entry.systemName}</p>
                    {entry.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={cfg.variant} className="text-[9px] flex items-center gap-1">
                        <Icon size={10} /> {cfg.label}
                      </Badge>
                    </div>
                    {entry.updatedBy && (
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        Updated by {entry.updatedBy.name} · {new Date(entry.updatedAt).toLocaleDateString('en-PH')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openEdit(entry)}
                    className="text-slate-400 hover:text-cyan-700 transition-colors p-1 shrink-0"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
