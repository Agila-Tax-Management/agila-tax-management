// src/components/hr/settings/HolidaysSettingsTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, CalendarX, Loader2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

type HolidayType = 'REGULAR' | 'SPECIAL_NON_WORKING' | 'SPECIAL_WORKING' | 'LOCAL_HOLIDAY';

interface HolidayRecord {
  id: number;
  name: string;
  date: string;
  type: HolidayType;
}

interface HolidayFormState {
  name: string;
  date: string;
  type: HolidayType;
}

// ─── Constants ────────────────────────────────────────────────────

const HOLIDAY_TYPE_LABEL: Record<HolidayType, string> = {
  REGULAR:              'Regular Holiday',
  SPECIAL_NON_WORKING:  'Special Non-Working',
  SPECIAL_WORKING:      'Special Working',
  LOCAL_HOLIDAY:        'Local Holiday',
};

const HOLIDAY_TYPE_VARIANT: Record<HolidayType, 'danger' | 'warning' | 'info' | 'neutral'> = {
  REGULAR:             'danger',
  SPECIAL_NON_WORKING: 'warning',
  SPECIAL_WORKING:     'info',
  LOCAL_HOLIDAY:       'neutral',
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const DEFAULT_FORM: HolidayFormState = {
  name: '',
  date: '',
  type: 'REGULAR',
};

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500';
const selectCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';
const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1.5';

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────

export function HolidaysSettingsTab(): React.ReactNode {
  const { success, error } = useToast();

  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>(String(CURRENT_YEAR));
  const [filterType, setFilterType] = useState<string>('');

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HolidayRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HolidayRecord | null>(null);

  const [form, setForm] = useState<HolidayFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Adjust state during render (avoid setState in useEffect) ────
  const [prevAddOpen, setPrevAddOpen] = useState(false);
  if (addOpen !== prevAddOpen) {
    setPrevAddOpen(addOpen);
    if (addOpen) setForm(DEFAULT_FORM);
  }

  const [prevEditTarget, setPrevEditTarget] = useState<HolidayRecord | null>(null);
  if (editTarget !== prevEditTarget) {
    setPrevEditTarget(editTarget);
    if (editTarget) {
      setForm({
        name: editTarget.name,
        date: editTarget.date.slice(0, 10),
        type: editTarget.type,
      });
    }
  }

  // ── Fetch holidays ───────────────────────────────────────────────
  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear) params.set('year', filterYear);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/hr/holidays?${params.toString()}`);
      const json: { data?: HolidayRecord[]; error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to load', json.error ?? 'Could not load holidays');
        return;
      }
      setHolidays(json.data ?? []);
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterType, error]);

  useEffect(() => {
    void fetchHolidays();
  }, [fetchHolidays]);

  // ── Save (add or edit) ───────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      error('Missing field', 'Holiday name is required.');
      return;
    }
    if (!form.date) {
      error('Missing field', 'Date is required.');
      return;
    }
    setSaving(true);
    try {
      const isEdit = editTarget !== null;
      const url = isEdit ? `/api/hr/holidays/${editTarget.id}` : '/api/hr/holidays';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), date: form.date, type: form.type }),
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error(isEdit ? 'Failed to update' : 'Failed to add', json.error ?? 'An error occurred.');
        return;
      }
      success(
        isEdit ? 'Holiday updated' : 'Holiday added',
        isEdit
          ? `"${form.name}" has been updated.`
          : `"${form.name}" has been added to the calendar.`,
      );
      setAddOpen(false);
      setEditTarget(null);
      await fetchHolidays();
    } catch {
      error('Network error', 'Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/holidays/${deleteTarget.id}`, { method: 'DELETE' });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to delete', json.error ?? 'An error occurred.');
        return;
      }
      success('Holiday deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      await fetchHolidays();
    } catch {
      error('Network error', 'Could not reach the server.');
    } finally {
      setDeleting(false);
    }
  };

  const isFormOpen = addOpen || editTarget !== null;
  const isEditMode = editTarget !== null;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                Holiday Calendar
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Manage Philippine regular, special, and local holidays used in payroll computation.
              </p>
            </div>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2 text-xs shrink-0"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={14} />
              Add Holiday
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex-1 min-w-[120px] max-w-[160px]">
              <select
                className={selectCls}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">All Years</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px] max-w-[220px]">
              <select
                className={selectCls}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                {(Object.keys(HOLIDAY_TYPE_LABEL) as HolidayType[]).map((t) => (
                  <option key={t} value={t}>{HOLIDAY_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Holiday List */}
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="animate-spin text-muted-foreground" />
            </div>
          ) : holidays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <CalendarX size={32} className="text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm font-medium text-foreground">No holidays found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filterYear || filterType
                  ? 'Try adjusting the filters above.'
                  : 'Click "Add Holiday" to start building your calendar.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                        {new Date(h.date).toLocaleDateString('en-PH', { month: 'short' })}
                      </span>
                      <span className="text-sm font-black text-foreground leading-tight">
                        {new Date(h.date).getUTCDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(h.date)}
                        &nbsp;·&nbsp;
                        {new Date(h.date).toLocaleDateString('en-PH', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={HOLIDAY_TYPE_VARIANT[h.type]}>
                      {HOLIDAY_TYPE_LABEL[h.type]}
                    </Badge>
                    <button
                      onClick={() => setEditTarget(h)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(h)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        title={isEditMode ? 'Edit Holiday' : 'Add Holiday'}
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Holiday Name <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Christmas Day"
            />
          </div>
          <div>
            <label className={labelCls}>Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Holiday Type <span className="text-red-500">*</span></label>
            <select
              className={selectCls}
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as HolidayType }))}
            >
              {(Object.keys(HOLIDAY_TYPE_LABEL) as HolidayType[]).map((t) => (
                <option key={t} value={t}>{HOLIDAY_TYPE_LABEL[t]}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {form.type === 'REGULAR' && 'Employees are entitled to 100% of daily wage even if absent.'}
              {form.type === 'SPECIAL_NON_WORKING' && 'Employees who work receive 130% of daily rate.'}
              {form.type === 'SPECIAL_WORKING' && 'Employees who work receive regular daily rate.'}
              {form.type === 'LOCAL_HOLIDAY' && 'Declared by local government; same rates as special non-working.'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => { setAddOpen(false); setEditTarget(null); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => { void handleSave(); }}
              disabled={saving}
            >
              {saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Add Holiday'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        title="Delete Holiday"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold">&ldquo;{deleteTarget?.name}&rdquo;</span>
            {deleteTarget && (
              <> ({fmtDate(deleteTarget.date)})</>
            )}
            ?
          </p>
          <p className="text-xs text-muted-foreground">
            This will remove it from the holiday calendar. Existing payslips are not affected.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { void handleDelete(); }}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete Holiday'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
