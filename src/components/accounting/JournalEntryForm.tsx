// src/components/accounting/JournalEntryForm.tsx
'use client';

import React, { useState, useRef } from 'react';
import {
  Plus, Trash2, Upload, X, AlertTriangle, CheckCircle2,
  Eraser, ArrowLeft, PenLine, FileText,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TransactionType = 'Journal Entry' | 'Invoice' | 'Payment' | 'Expense' | 'Receipt';

export type JournalStatus = 'Posted' | 'Draft';

export interface JournalLine {
  id: string;
  glAccountId: string;
  account: string;
  debit: string;
  credit: string;
  description: string;
  name: string;
}

export interface GlAccountOption {
  id: string;
  accountCode: string;
  name: string;
}

export interface JournalEntry {
  id: string;
  transactionDate: string;
  referenceNo: string;
  transactionType: TransactionType;
  status: JournalStatus;
  lines: JournalLine[];
  notes: string;
  attachments: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function emptyLine(): JournalLine {
  return { id: crypto.randomUUID(), glAccountId: '', account: '', debit: '', credit: '', description: '', name: '' };
}

export function defaultLines(): JournalLine[] {
  return Array.from({ length: 5 }, emptyLine);
}

export function parseNum(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function formatPHP(val: number): string {
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export function generateRefNo(entries: JournalEntry[]): string {
  const year = new Date().getFullYear();
  return `JE-${year}-${String(entries.length + 1).padStart(4, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface JournalEntryFormProps {
  entries: JournalEntry[];
  glAccounts: GlAccountOption[];
  onSave: (entry: JournalEntry) => Promise<void>;
  onClose: () => void;
  onSaveNew: (entry: JournalEntry) => Promise<void>;
  initialEntry?: JournalEntry;
  onUpdate?: (entry: JournalEntry) => Promise<void>;
}

export function JournalEntryForm({ entries, glAccounts, onSave, onClose, onSaveNew, initialEntry, onUpdate }: JournalEntryFormProps): React.ReactNode {
  const isEditing = !!initialEntry;
  const today = new Date().toISOString().split('T')[0];
  const [transactionDate, setTransactionDate] = useState(() => initialEntry?.transactionDate ?? today);
  const status: JournalStatus = 'Posted';
  const [lines, setLines] = useState<JournalLine[]>(() => initialEntry?.lines.length ? initialEntry.lines : defaultLines());
  const [notes, setNotes] = useState(() => initialEntry?.notes ?? '');
  const [attachments, setAttachments] = useState<string[]>(() => initialEntry?.attachments ?? []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refNo = isEditing ? initialEntry.referenceNo : generateRefNo(entries);
  const totalDebit = lines.reduce((s, l) => s + parseNum(l.debit), 0);
  const totalCredit = lines.reduce((s, l) => s + parseNum(l.credit), 0);
  const hasBalance = totalDebit > 0 || totalCredit > 0;
  const isBalanced = hasBalance && totalDebit === totalCredit;

  function updateLine(id: string, field: keyof JournalLine, value: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function setLineFields(id: string, fields: Partial<JournalLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...fields } : l)));
  }

  function deleteLine(id: string) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function buildEntry(): JournalEntry {
    return {
      id: isEditing ? initialEntry.id : crypto.randomUUID(),
      transactionDate,
      referenceNo: refNo,
      transactionType: 'Journal Entry',
      status,
      lines: lines.filter((l) => l.account),
      notes,
      attachments,
    };
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).map((f) => f.name);
    setAttachments((prev) => [...prev, ...files]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function resetForm() {
    setTransactionDate(today);
    setLines(defaultLines());
    setNotes('');
    setAttachments([]);
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) { await onUpdate?.(buildEntry()); }
      else { await onSave(buildEntry()); }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveClose() {
    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) { await onUpdate?.(buildEntry()); }
      else { await onSave(buildEntry()); }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNew() {
    setSaving(true);
    setFormError(null);
    try {
      await onSaveNew(buildEntry());
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const INPUT_CLS =
    'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors';

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Journal
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg select-all">
            {refNo}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
            Posted
          </span>
        </div>
      </div>

      {/* Title + Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
            <PenLine size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">{isEditing ? 'Edit Journal Entry' : 'Journal Entry'}</h2>
            <p className="text-xs text-slate-500">{isEditing ? `Editing — ${refNo}` : `New entry — ${refNo}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
            Transaction Date
          </label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Lines table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '760px' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-8">#</th>
                <th className="text-left px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-48">Account</th>
                <th className="text-right px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-32">Debit</th>
                <th className="text-right px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-32">Credit</th>
                <th className="text-left px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                <th className="text-left px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-36">Name</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, idx) => (
                <tr key={line.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-3 py-1.5 text-xs text-center text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="px-1 py-1.5">
                    <select
                      value={line.glAccountId}
                      onChange={(e) => {
                        const selected = glAccounts.find((a) => a.id === e.target.value);
                        setLineFields(line.id, {
                          glAccountId: e.target.value,
                          account: selected ? `${selected.accountCode} · ${selected.name}` : '',
                        });
                      }}
                      className={INPUT_CLS}
                    >
                      <option value="">— Select —</option>
                      {glAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountCode} · {a.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                        placeholder="0.00"
                        className={`${INPUT_CLS} pl-5 text-right`}
                      />
                    </div>
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                        placeholder="0.00"
                        className={`${INPUT_CLS} pl-5 text-right`}
                      />
                    </div>
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      placeholder="Description..."
                      className={INPUT_CLS}
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      value={line.name}
                      onChange={(e) => updateLine(line.id, 'name', e.target.value)}
                      placeholder="Name..."
                      className={INPUT_CLS}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => deleteLine(line.id)}
                      disabled={lines.length <= 1}
                      className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={2} className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLines((p) => [...p, emptyLine()])}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      <Plus size={13} /> Add Row
                    </button>
                    <span className="text-slate-300 select-none">|</span>
                    <button
                      type="button"
                      onClick={() => setLines(defaultLines())}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Eraser size={13} /> Clear All Lines
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="block text-xs font-black text-slate-800 tabular-nums">{formatPHP(totalDebit)}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide">Total Debit</span>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="block text-xs font-black text-slate-800 tabular-nums">{formatPHP(totalCredit)}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide">Total Credit</span>
                </td>
                <td colSpan={3} className="px-3 py-3">
                  {hasBalance && (
                    isBalanced ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={13} /> Balanced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500">
                        <AlertTriangle size={13} />
                        Unbalanced — Diff: {formatPHP(Math.abs(totalDebit - totalCredit))}
                      </span>
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes + Attachments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Additional notes or memo..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Attachments</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors text-center"
          >
            <Upload size={20} className="text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-500 font-medium">Drop files or click to upload</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Receipts, invoices, PDF, images</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf,.xlsx,.xls,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {attachments.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {attachments.map((file, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                >
                  <FileText size={11} className="text-slate-400 shrink-0" />
                  <span className="max-w-32 truncate">{file}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline save error */}
      {formError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={() => { void handleSave(); }}
              disabled={saving || (hasBalance && !isBalanced)}
              title={hasBalance && !isBalanced ? 'Debits must equal credits before saving' : undefined}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Update'}
            </button>
            <button
              type="button"
              onClick={() => { void handleSaveClose(); }}
              disabled={saving || (hasBalance && !isBalanced)}
              title={hasBalance && !isBalanced ? 'Debits must equal credits before saving' : undefined}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {saving ? 'Saving…' : 'Update & Close'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { void handleSaveClose(); }}
              disabled={saving || (hasBalance && !isBalanced)}
              title={hasBalance && !isBalanced ? 'Debits must equal credits before saving' : undefined}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {saving ? 'Saving…' : 'Save & Close'}
            </button>
            <button
              type="button"
              onClick={() => { void handleSaveNew(); }}
              disabled={saving || (hasBalance && !isBalanced)}
              title={hasBalance && !isBalanced ? 'Debits must equal credits before saving' : undefined}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {saving ? 'Saving…' : 'Save & New'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
