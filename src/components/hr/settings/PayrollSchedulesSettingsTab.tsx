// src/components/hr/settings/PayrollSchedulesSettingsTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, CalendarRange } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { Badge } from '@/components/UI/Badge';
import { useToast } from '@/context/ToastContext';

type SalaryFrequency = 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';

interface PayrollScheduleItem {
  id: string;
  name: string;
  frequency: SalaryFrequency;
  firstPeriodStartDay: number;
  firstPeriodEndDay: number;
  firstPayoutDay: number;
  secondPeriodStartDay: number | null;
  secondPeriodEndDay: number | null;
  secondPayoutDay: number | null;
  isActive: boolean;
  _count: { compensations: number; payrollPeriods: number };
}

interface FormState {
  name: string;
  frequency: SalaryFrequency;
  firstPeriodStartDay: string;
  firstPeriodEndDay: string;
  firstPayoutDay: string;
  secondPeriodStartDay: string;
  secondPeriodEndDay: string;
  secondPayoutDay: string;
  isActive: boolean;
}

const DEFAULT_FORM: FormState = {
  name: '',
  frequency: 'TWICE_A_MONTH',
  firstPeriodStartDay: '1',
  firstPeriodEndDay: '15',
  firstPayoutDay: '20',
  secondPeriodStartDay: '16',
  secondPeriodEndDay: '31',
  secondPayoutDay: '5',
  isActive: true,
};

const FREQ_LABELS: Record<SalaryFrequency, string> = {
  ONCE_A_MONTH: 'Once a Month',
  TWICE_A_MONTH: 'Twice a Month (Semi-Monthly)',
  WEEKLY: 'Weekly',
};

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1';

export function PayrollSchedulesSettingsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [schedules, setSchedules] = useState<PayrollScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PayrollScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/payroll-schedules');
      const json: { data?: PayrollScheduleItem[]; error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to load schedules', json.error ?? 'An error occurred');
        return;
      }
      setSchedules(json.data ?? []);
    } catch {
      error('Failed to load schedules', 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchSchedules();
  }, [fetchSchedules]);

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (s: PayrollScheduleItem) => {
    setForm({
      name: s.name,
      frequency: s.frequency,
      firstPeriodStartDay: String(s.firstPeriodStartDay),
      firstPeriodEndDay: String(s.firstPeriodEndDay),
      firstPayoutDay: String(s.firstPayoutDay),
      secondPeriodStartDay: String(s.secondPeriodStartDay ?? 16),
      secondPeriodEndDay: String(s.secondPeriodEndDay ?? 31),
      secondPayoutDay: String(s.secondPayoutDay ?? 5),
      isActive: s.isActive,
    });
    setEditingId(s.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      error('Missing field', 'Schedule name is required');
      return;
    }
    setSaving(true);
    try {
      const isTwice = form.frequency === 'TWICE_A_MONTH';
      const bodyData = {
        name: form.name.trim(),
        frequency: form.frequency,
        firstPeriodStartDay: parseInt(form.firstPeriodStartDay, 10),
        firstPeriodEndDay: parseInt(form.firstPeriodEndDay, 10),
        firstPayoutDay: parseInt(form.firstPayoutDay, 10),
        secondPeriodStartDay: isTwice ? parseInt(form.secondPeriodStartDay, 10) : null,
        secondPeriodEndDay: isTwice ? parseInt(form.secondPeriodEndDay, 10) : null,
        secondPayoutDay: isTwice ? parseInt(form.secondPayoutDay, 10) : null,
        isActive: form.isActive,
      };

      const url = editingId
        ? `/api/hr/payroll-schedules/${editingId}`
        : '/api/hr/payroll-schedules';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      const json: { data?: PayrollScheduleItem; error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to save', json.error ?? 'An error occurred');
        return;
      }
      success(
        editingId ? 'Schedule updated' : 'Schedule created',
        `"${form.name}" has been saved.`,
      );
      setModalOpen(false);
      await fetchSchedules();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/payroll-schedules/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to delete', json.error ?? 'An error occurred');
        return;
      }
      success('Schedule deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      await fetchSchedules();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setDeleting(false);
    }
  };

  const periodSummary = (s: PayrollScheduleItem) => {
    const firstEnd = (s.firstPeriodEndDay >= 31) ? 'EOM' : String(s.firstPeriodEndDay);
    const first = `Day ${s.firstPeriodStartDay}–${firstEnd} → payout day ${s.firstPayoutDay}`;
    if (s.frequency === 'TWICE_A_MONTH' && s.secondPeriodStartDay !== null) {
      const secondEnd = ((s.secondPeriodEndDay ?? 31) >= 31) ? 'EOM' : String(s.secondPeriodEndDay);
      const second = `Day ${s.secondPeriodStartDay}–${secondEnd} → payout day ${s.secondPayoutDay}`;
      return `${first} · ${second}`;
    }
    return first;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Payroll Schedules</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define cutoff and payout rules for employee payroll groups.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5 text-sm h-9 px-3">
          <Plus size={14} /> New Schedule
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Loading schedules…
        </div>
      ) : schedules.length === 0 ? (
        <Card className="p-12 text-center space-y-2">
          <CalendarRange size={28} className="mx-auto text-muted-foreground opacity-40" />
          <p className="text-sm font-semibold text-foreground">No payroll schedules yet</p>
          <p className="text-xs text-muted-foreground">
            Create a schedule to define when employees get paid.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                {/* Left info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                    <CalendarRange size={15} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                      <Badge variant={s.isActive ? 'success' : 'neutral'} className="text-[10px]">
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {FREQ_LABELS[s.frequency]} · {periodSummary(s)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {s._count.compensations} employee
                      {s._count.compensations !== 1 ? 's' : ''} assigned ·{' '}
                      {s._count.payrollPeriods} period
                      {s._count.payrollPeriods !== 1 ? 's' : ''} generated
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    onClick={() => openEdit(s)}
                    className="h-8 w-8 p-0"
                    title="Edit schedule"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteTarget(s)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    disabled={s._count.compensations > 0 || s._count.payrollPeriods > 0}
                    title={
                      s._count.compensations > 0 || s._count.payrollPeriods > 0
                        ? 'Cannot delete: has linked data'
                        : 'Delete schedule'
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Payroll Schedule' : 'New Payroll Schedule'}
        size="md"
      >
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
          {/* Name */}
          <div>
            <label className={labelCls}>
              Schedule Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Standard Semi-Monthly"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className={labelCls}>Pay Frequency</label>
            <select
              className={inputCls}
              value={form.frequency}
              onChange={(e) =>
                setForm((p) => ({ ...p, frequency: e.target.value as SalaryFrequency }))
              }
            >
              <option value="TWICE_A_MONTH">Twice a Month (Semi-Monthly)</option>
              <option value="ONCE_A_MONTH">Once a Month</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>

          {/* First Period */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
              {form.frequency === 'TWICE_A_MONTH' ? 'First Period (e.g. 1st–15th)' : 'Payroll Period'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Cut-off Start Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className={inputCls}
                  value={form.firstPeriodStartDay}
                  onChange={(e) => setForm((p) => ({ ...p, firstPeriodStartDay: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Cut-off End Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className={inputCls}
                  value={form.firstPeriodEndDay}
                  onChange={(e) => setForm((p) => ({ ...p, firstPeriodEndDay: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Payout Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className={inputCls}
                  value={form.firstPayoutDay}
                  onChange={(e) => setForm((p) => ({ ...p, firstPayoutDay: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Second Period — only for TWICE_A_MONTH */}
          {form.frequency === 'TWICE_A_MONTH' && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                Second Period (e.g. 16th–End of Month)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Cut-off Start Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    className={inputCls}
                    value={form.secondPeriodStartDay}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, secondPeriodStartDay: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Cut-off End Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    className={inputCls}
                    value={form.secondPeriodEndDay}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, secondPeriodEndDay: e.target.value }))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Use <strong>31</strong> for End of Month
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Payout Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    className={inputCls}
                    value={form.secondPayoutDay}
                    onChange={(e) => setForm((p) => ({ ...p, secondPayoutDay: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    If &lt; start day → next month
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* EOM info banner */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2.5">
            <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
              <strong>End-of-Month (EOM):</strong> A cut-off end day of 31 automatically resolves
              to the actual last day of each month — 28 or 29 for February, 30 for
              April/June/September/November.
            </p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Only active schedules can be assigned to employees and used for payroll generation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleSave();
              }}
              disabled={saving}
              className="gap-2"
            >
              {saving ? 'Saving…' : editingId ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Payroll Schedule"
        size="sm"
      >
        {deleteTarget && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete{' '}
              <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  void handleDelete();
                }}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
