// src/components/accounting/Journaling.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, BookOpen, RefreshCw,
  CheckCircle2, Clock, PenLine, FileText, CreditCard, Receipt, Download, Pencil,
} from 'lucide-react';
import { JournalEntryForm, parseNum, formatPHP } from './JournalEntryForm';
import type { JournalEntry, TransactionType, JournalStatus, GlAccountOption } from './JournalEntryForm';

// Suppress "unused variable" — MOCK_ENTRIES removed, this marker avoids accidental re-introduction

// ─── Constants & helpers ───────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JournalStatus }): React.ReactElement {
  return status === 'Posted' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
      <CheckCircle2 size={10} /> Posted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
      <Clock size={10} /> Draft
    </span>
  );
}

// ─── Transaction type badge ───────────────────────────────────────────────────

function TransactionTypeBadge({ type }: { type: TransactionType }): React.ReactElement {
  const map: Record<TransactionType, { cls: string; icon: React.ReactNode; label: string }> = {
    'Journal Entry': { cls: 'bg-slate-100 text-slate-600',     icon: <PenLine size={10} />,    label: 'Journal Entry' },
    Invoice:         { cls: 'bg-blue-100 text-blue-700',       icon: <FileText size={10} />,   label: 'Invoice' },
    Payment:         { cls: 'bg-emerald-100 text-emerald-700', icon: <CreditCard size={10} />, label: 'Payment' },
    Expense:         { cls: 'bg-rose-100 text-rose-700',       icon: <Receipt size={10} />,    label: 'Expense' },
    Receipt:         { cls: 'bg-violet-100 text-violet-700',   icon: <Download size={10} />,   label: 'Receipt' },
  };
  const { cls, icon, label } = map[type] ?? map['Journal Entry'];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cls}`}>
      {icon} {label}
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function Journaling(): React.ReactNode {
  const now = new Date();
  const [entries, setEntries]       = useState<JournalEntry[]>([]);
  const [glAccounts, setGlAccounts] = useState<GlAccountOption[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [view, setView]             = useState<'list' | 'new' | 'edit'>('list');
  const [editEntry, setEditEntry]   = useState<JournalEntry | null>(null);
  const [filterMonth, setFilterMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });

  // ─── Fetch entries for selected month ──────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/accounting/journal-entries?month=${filterMonth.month}&year=${filterMonth.year}`,
      );
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to load entries');
      }
      const json = await res.json() as { data: JournalEntry[] };
      setEntries(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => { void fetchEntries(); }, [fetchEntries]);

  // ─── Fetch GL accounts (once on mount) ─────────────────────────────────────
  const fetchGlAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounting/gl-accounts?isActive=true');
      if (!res.ok) return;
      const json = await res.json() as { data: Array<{ id: string; accountCode: string; name: string }> };
      setGlAccounts(json.data.map((a) => ({ id: a.id, accountCode: a.accountCode, name: a.name })));
    } catch {
      // Silent — form is still usable without GL accounts (empty dropdown)
    }
  }, []);

  useEffect(() => { void fetchGlAccounts(); }, [fetchGlAccounts]);

  // ─── Save new entry via API ─────────────────────────────────────────────────
  async function handleSave(entry: JournalEntry) {
    const body = {
      transactionDate: entry.transactionDate,
      transactionType: entry.transactionType,
      status: entry.status,
      notes: entry.notes,
      attachments: entry.attachments,
      lines: entry.lines
        .filter((l) => l.glAccountId)
        .map((l, i) => ({
          glAccountId: l.glAccountId,
          debit:       parseNum(l.debit) > 0  ? parseNum(l.debit)  : null,
          credit:      parseNum(l.credit) > 0 ? parseNum(l.credit) : null,
          description: l.description,
          name:        l.name,
          sortOrder:   i,
        })),
    };
    try {
      const res = await fetch('/api/accounting/journal-entries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setError(err.error ?? 'Failed to save journal entry');
        return;
      }
      void fetchEntries();
    } catch {
      setError('Network error — could not save the journal entry');
    }
  }

  async function handleSaveNew(entry: JournalEntry) {
    await handleSave(entry);
  }

  async function handleUpdate(entry: JournalEntry) {
    const body = {
      transactionDate: entry.transactionDate,
      transactionType: entry.transactionType,
      status: entry.status,
      notes: entry.notes,
      attachments: entry.attachments,
      lines: entry.lines
        .filter((l) => l.glAccountId)
        .map((l, i) => ({
          glAccountId: l.glAccountId,
          debit:       parseNum(l.debit) > 0  ? parseNum(l.debit)  : null,
          credit:      parseNum(l.credit) > 0 ? parseNum(l.credit) : null,
          description: l.description,
          name:        l.name,
          sortOrder:   i,
        })),
    };
    try {
      const res = await fetch(`/api/accounting/journal-entries/${entry.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setError(err.error ?? 'Failed to update journal entry');
        return;
      }
      setEditEntry(null);
      setView('list');
      void fetchEntries();
    } catch {
      setError('Network error — could not update the journal entry');
    }
  }

  function prevMonth() {
    setFilterMonth((p) =>
      p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 },
    );
  }

  function nextMonth() {
    setFilterMonth((p) =>
      p.month === 12 ? { year: p.year + 1, month: 1 } : { year: p.year, month: p.month + 1 },
    );
  }

  const filteredEntries = entries; // already filtered by API

  // Flatten each entry's lines into ledger rows
  const ledgerRows = useMemo(
    () =>
      filteredEntries.flatMap((e) =>
        e.lines.map((l, lineIdx) => ({
          entryId:         e.id,
          isFirstLine:     lineIdx === 0,
          entry:           e,
          transactionDate: e.transactionDate,
          referenceNo:     e.referenceNo,
          transactionType: e.transactionType,
          status:          e.status,
          name:            l.name,
          description:     l.description,
          account:         l.account,
          debit:           parseNum(l.debit),
          credit:          parseNum(l.credit),
        })),
      ),
    [filteredEntries],
  );

  const totalDebit  = ledgerRows.reduce((s, r) => s + r.debit,  0);
  const totalCredit = ledgerRows.reduce((s, r) => s + r.credit, 0);

  if (view === 'new') {
    return (
      <JournalEntryForm
        entries={entries}
        glAccounts={glAccounts}
        onSave={handleSave}
        onClose={() => setView('list')}
        onSaveNew={handleSaveNew}
      />
    );
  }

  if (view === 'edit' && editEntry) {
    return (
      <JournalEntryForm
        entries={entries}
        glAccounts={glAccounts}
        initialEntry={editEntry}
        onSave={handleSave}
        onClose={() => { setEditEntry(null); setView('list'); }}
        onSaveNew={handleSaveNew}
        onUpdate={(entry) => { void handleUpdate(entry); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Journal Entries</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Record and review all accounting transactions by month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchEntries()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setView('new')}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all shrink-0"
          >
            <Plus size={16} />
            New Journal Entry
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Month filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={prevMonth}
            className="flex items-center justify-center px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-r border-slate-200"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-5 py-2.5 text-sm font-bold text-slate-800 min-w-44 text-center">
            {MONTH_NAMES[filterMonth.month - 1]} {filterMonth.year}
          </span>
          <button
            onClick={nextMonth}
            className="flex items-center justify-center px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-l border-slate-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {filteredEntries.length > 0 && (
          <span className="text-xs text-slate-500">
            {filteredEntries.length} entr{filteredEntries.length !== 1 ? 'ies' : 'y'} &bull; {ledgerRows.length} lines
          </span>
        )}
      </div>

      {/* Ledger table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw size={24} className="text-slate-300 animate-spin" />
            <p className="text-sm text-slate-400">Loading journal entries…</p>
          </div>
        ) : ledgerRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen size={32} className="text-slate-300" />
            <p className="text-sm text-slate-400">
              No journal entries for {MONTH_NAMES[filterMonth.month - 1]} {filterMonth.year}.
            </p>
            <button
              onClick={() => setView('new')}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              Create a new entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Date</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Ref No.</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Account</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Debit</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Credit</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row, idx) => (
                  <tr
                    key={`${row.entryId}-${idx}`}
                    className="border-b border-slate-100 hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                      {formatDate(row.transactionDate)}
                    </td>
                    <td className="px-3 py-2.5">
                      <TransactionTypeBadge type={row.transactionType} />
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono text-slate-700 whitespace-nowrap">
                      {row.referenceNo}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-700 max-w-24 truncate" title={row.name}>
                      {row.name || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {row.description || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-800 max-w-36 truncate" title={row.account}>
                      {row.account || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums text-slate-800 whitespace-nowrap">
                      {row.debit > 0 ? formatPHP(row.debit) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums text-slate-800 whitespace-nowrap">
                      {row.credit > 0 ? formatPHP(row.credit) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.isFirstLine && row.status === 'Draft' && (
                        <button
                          onClick={() => { setEditEntry(row.entry); setView('edit'); }}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Edit draft"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-600 text-white">
                  <td colSpan={7} className="px-3 py-3">
                    <span className="text-xs font-black uppercase tracking-widest">
                      Total — {MONTH_NAMES[filterMonth.month - 1]} {filterMonth.year}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-black tabular-nums">{formatPHP(totalDebit)}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-black tabular-nums">{formatPHP(totalCredit)}</span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

