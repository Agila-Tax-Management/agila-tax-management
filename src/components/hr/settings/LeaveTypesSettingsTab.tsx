// src/components/hr/settings/LeaveTypesSettingsTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

interface LeaveTypeRecord {
  id: number;
  name: string;
  isPaid: boolean;
  defaultDays: string;
  carryOverLimit: string;
  resetMonth: number | null;
  resetDay: number | null;
  createdAt: string;
}

interface LeaveTypeForm {
  name: string;
  isPaid: boolean;
  defaultDays: string;
  carryOverLimit: string;
  resetMonth: string;
  resetDay: string;
}

const EMPTY_FORM: LeaveTypeForm = {
  name: '',
  isPaid: true,
  defaultDays: '0',
  carryOverLimit: '0',
  resetMonth: '',
  resetDay: '',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function LeaveTypesSettingsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeaveTypeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveTypeRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<LeaveTypeForm>(EMPTY_FORM);

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/leave-types');
      const json = await res.json() as { data?: LeaveTypeRecord[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load');
      setLeaveTypes(json.data ?? []);
    } catch {
      error('Failed to load leave types', 'Could not fetch leave type configuration.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (lt: LeaveTypeRecord) => {
    setEditTarget(lt);
    setForm({
      name: lt.name,
      isPaid: lt.isPaid,
      defaultDays: lt.defaultDays,
      carryOverLimit: lt.carryOverLimit,
      resetMonth: lt.resetMonth !== null ? String(lt.resetMonth) : '',
      resetDay: lt.resetDay !== null ? String(lt.resetDay) : '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      error('Validation error', 'Leave type name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        isPaid: form.isPaid,
        defaultDays: parseFloat(form.defaultDays) || 0,
        carryOverLimit: parseFloat(form.carryOverLimit) || 0,
        resetMonth: form.resetMonth ? parseInt(form.resetMonth, 10) : null,
        resetDay: form.resetDay ? parseInt(form.resetDay, 10) : null,
      };
      const url = editTarget ? `/api/hr/leave-types/${editTarget.id}` : '/api/hr/leave-types';
      const method = editTarget ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      success(
        editTarget ? 'Leave type updated' : 'Leave type created',
        `"${payload.name}" has been saved.`,
      );
      setFormOpen(false);
      void fetchLeaveTypes();
    } catch (err) {
      error('Failed to save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/leave-types/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete');
      success('Leave type deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      void fetchLeaveTypes();
    } catch (err) {
      error('Failed to delete', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground">Leave Types</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Define company leave policies and accrual rules.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm">
            <Plus size={16} /> Add Leave Type
          </Button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
        ) : leaveTypes.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No leave types configured yet. Add one to get started.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-4 py-2.5 font-bold text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-2.5 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Paid</th>
                  <th className="text-left px-4 py-2.5 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Default Days</th>
                  <th className="text-left px-4 py-2.5 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Carry Over</th>
                  <th className="text-left px-4 py-2.5 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Reset Date</th>
                  <th className="text-center px-4 py-2.5 font-bold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((lt) => (
                  <tr key={lt.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{lt.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {lt.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          <CheckCircle size={12} /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-semibold">
                          <XCircle size={12} /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {parseFloat(lt.defaultDays).toFixed(2)} days
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {parseFloat(lt.carryOverLimit).toFixed(2)} days
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                      {lt.resetMonth && lt.resetDay ? `${MONTHS[lt.resetMonth - 1]} ${lt.resetDay}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" onClick={() => openEdit(lt)} title="Edit">
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" onClick={() => setDeleteTarget(lt)} title="Delete">
                          <Trash2 size={15} className="text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit Leave Type' : 'Add Leave Type'}
        size="sm"
      >
        <div className="p-6 space-y-4">
          <label className="block text-sm font-semibold text-foreground">
            Name <span className="text-red-500">*</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Vacation Leave"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </label>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPaid"
              checked={form.isPaid}
              onChange={(e) => setForm((prev) => ({ ...prev, isPaid: e.target.checked }))}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="isPaid" className="text-sm font-semibold text-foreground cursor-pointer">
              Paid Leave
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-foreground">
              Default Days
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.defaultDays}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultDays: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Carry Over Limit
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.carryOverLimit}
                onChange={(e) => setForm((prev) => ({ ...prev, carryOverLimit: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Annual Reset Date{' '}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-muted-foreground">
                Month
                <select
                  value={form.resetMonth}
                  onChange={(e) => setForm((prev) => ({ ...prev, resetMonth: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="">— None —</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-muted-foreground">
                Day
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g. 1"
                  value={form.resetDay}
                  onChange={(e) => setForm((prev) => ({ ...prev, resetDay: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Leave Type"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be
            undone and will remove all associated leave credits.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
