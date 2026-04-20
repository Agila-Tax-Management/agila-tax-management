// src/components/hr/profile/components/LeaveCreditsTab.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

interface LeaveCredit {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  isPaid: boolean;
  allocated: number;
  used: number;
  balance: number;
  validFrom: string;
  expiresAt: string;
  isExpired: boolean;
  remarks: string | null;
}

interface LeaveTypeOption {
  id: number;
  name: string;
  isPaid: boolean;
  defaultDays: number;
}

interface CreditFormState {
  leaveTypeId: string;
  allocated: string;
  validFrom: string;
  expiresAt: string;
  remarks: string;
}

const BLANK_FORM: CreditFormState = {
  leaveTypeId: '',
  allocated: '',
  validFrom: '',
  expiresAt: '',
  remarks: '',
};

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30';
const selectClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';

// ─── Component ────────────────────────────────────────────────────

interface LeaveCreditsTabProps {
  employeeId: number;
}

export function LeaveCreditsTab({ employeeId }: LeaveCreditsTabProps): React.ReactNode {
  const { success, error } = useToast();

  const [credits, setCredits] = useState<LeaveCredit[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeaveCredit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveCredit | null>(null);

  const [form, setForm] = useState<CreditFormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Adjust state during render (React pattern) ───────────────
  const [prevAddOpen, setPrevAddOpen] = useState(false);
  if (addModalOpen !== prevAddOpen) {
    setPrevAddOpen(addModalOpen);
    if (addModalOpen) setForm(BLANK_FORM);
  }

  const [prevEditTarget, setPrevEditTarget] = useState<LeaveCredit | null>(null);
  if (editTarget !== prevEditTarget) {
    setPrevEditTarget(editTarget);
    if (editTarget) {
      setForm({
        leaveTypeId: String(editTarget.leaveTypeId),
        allocated: String(editTarget.allocated),
        validFrom: editTarget.validFrom,
        expiresAt: editTarget.expiresAt,
        remarks: editTarget.remarks ?? '',
      });
    }
  }

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/leave-credits`);
      if (!res.ok) throw new Error('Failed to load');
      const json = (await res.json()) as { data?: LeaveCredit[] };
      setCredits(json.data ?? []);
    } catch {
      error('Load error', 'Could not fetch leave credits.');
    } finally {
      setLoading(false);
    }
  }, [employeeId, error]);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/leave-types');
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: { id: number; name: string; isPaid: boolean; defaultDays: number }[];
      };
      setLeaveTypes(json.data ?? []);
    } catch { /* keep empty */ }
  }, []);

  useEffect(() => {
    void fetchCredits();
    void fetchLeaveTypes();
  }, [fetchCredits, fetchLeaveTypes]);

  const set = <K extends keyof CreditFormState>(key: K, value: CreditFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdd = async () => {
    if (!form.leaveTypeId || !form.allocated || !form.validFrom || !form.expiresAt) {
      error('Missing fields', 'Leave type, allocated days, and validity dates are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/leave-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveTypeId: parseInt(form.leaveTypeId, 10),
          allocated: parseFloat(form.allocated),
          validFrom: form.validFrom,
          expiresAt: form.expiresAt,
          remarks: form.remarks || null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { error('Failed to allocate', json.error ?? 'Could not create leave credit.'); return; }
      success('Leave credit allocated', 'A new leave credit block has been added.');
      setAddModalOpen(false);
      void fetchCredits();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!form.allocated || !form.validFrom || !form.expiresAt) {
      error('Missing fields', 'Allocated days and validity dates are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/hr/employees/${employeeId}/leave-credits?creditId=${editTarget.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            allocated: parseFloat(form.allocated),
            validFrom: form.validFrom,
            expiresAt: form.expiresAt,
            remarks: form.remarks || null,
          }),
        },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { error('Failed to update', json.error ?? 'Could not update leave credit.'); return; }
      success('Leave credit updated', 'Leave credit block has been updated.');
      setEditTarget(null);
      void fetchCredits();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/hr/employees/${employeeId}/leave-credits?creditId=${deleteTarget.id}`,
        { method: 'DELETE' },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { error('Failed to delete', json.error ?? 'Could not delete leave credit.'); return; }
      success('Leave credit deleted', 'The leave credit block has been removed.');
      setDeleteTarget(null);
      void fetchCredits();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle leave type selection → prefill allocated from defaultDays
  const handleLeaveTypeChange = (typeId: string) => {
    set('leaveTypeId', typeId);
    const lt = leaveTypes.find((t) => String(t.id) === typeId);
    if (lt && lt.defaultDays > 0 && !form.allocated) {
      set('allocated', String(lt.defaultDays));
    }
  };

  const activeCredits = credits.filter((c) => !c.isExpired);
  const expiredCredits = credits.filter((c) => c.isExpired);

  const totalBalance = activeCredits.reduce((sum, c) => sum + c.balance, 0);

  const CreditRow = ({ c }: { c: LeaveCredit }) => (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <p className="font-bold text-foreground text-sm">{c.leaveTypeName}</p>
        <Badge variant={c.isPaid ? 'success' : 'neutral'} className="text-[10px] mt-0.5">
          {c.isPaid ? 'Paid' : 'Unpaid'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-foreground text-right font-semibold">
        {c.allocated.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground text-right">
        {c.used.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`text-sm font-black ${c.balance > 0 ? 'text-emerald-600' : 'text-red-500'}`}
        >
          {c.balance.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
        {c.validFrom} → {c.expiresAt}
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant={c.isExpired ? 'neutral' : 'success'}>
          {c.isExpired ? 'Expired' : 'Active'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {!c.isExpired && (
            <Button
              variant="ghost"
              onClick={() => setEditTarget(c)}
              title="Edit"
            >
              <Pencil size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setDeleteTarget(c)}
            title="Delete"
            disabled={c.used > 0}
            className="text-red-500 disabled:opacity-30"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );

  const CreditFormFields = ({ isEdit }: { isEdit: boolean }) => (
    <div className="space-y-4">
      {!isEdit && (
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Leave Type <span className="text-red-500">*</span>
          </label>
          <select
            className={selectClass}
            value={form.leaveTypeId}
            onChange={(e) => handleLeaveTypeChange(e.target.value)}
          >
            <option value="">Select leave type…</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name} ({lt.isPaid ? 'Paid' : 'Unpaid'})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Allocated Days <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            className={inputClass}
            placeholder="e.g. 15"
            value={form.allocated}
            onChange={(e) => set('allocated', e.target.value)}
          />
        </div>
        <div className="invisible sm:visible">
          {/* spacer */}
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Valid From <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className={inputClass}
            value={form.validFrom}
            onChange={(e) => set('validFrom', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Expires At <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className={inputClass}
            value={form.expiresAt}
            onChange={(e) => set('expiresAt', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Remarks
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="Optional notes (e.g. Annual allocation 2026)"
          value={form.remarks}
          onChange={(e) => set('remarks', e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header + summary */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-foreground">Leave Credits</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage leave credit allocations for this employee. Each block ties to a leave type
                from HR Settings.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {!loading && (
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Total Balance
                  </p>
                  <p className="text-xl font-black text-emerald-600">{totalBalance.toFixed(2)}d</p>
                </div>
              )}
              <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
                <Plus size={16} /> Allocate Credits
              </Button>
            </div>
          </div>
        </Card>

        {/* Active credits */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Active Credits</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Allocated
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Used
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                    Validity
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : activeCredits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No active leave credits. Click &ldquo;Allocate Credits&rdquo; to add one.
                    </td>
                  </tr>
                ) : (
                  activeCredits.map((c) => <CreditRow key={c.id} c={c} />)
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Expired credits */}
        {expiredCredits.length > 0 && (
          <Card className="overflow-hidden opacity-70">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-muted-foreground">
                Expired Credits ({expiredCredits.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Allocated
                    </th>
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Used
                    </th>
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                      Validity
                    </th>
                    <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expiredCredits.map((c) => <CreditRow key={c.id} c={c} />)}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Allocate Leave Credits"
        size="md"
      >
        <div className="p-6 space-y-5">
          <CreditFormFields isEdit={false} />
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setAddModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => { void handleAdd(); }}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Allocate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Leave Credit"
        size="md"
      >
        <div className="p-6 space-y-5">
          {editTarget && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-bold text-foreground">{editTarget.leaveTypeName}</p>
                <p className="text-xs text-muted-foreground">
                  {editTarget.used.toFixed(2)} day(s) already used — cannot reduce below this
                </p>
              </div>
              <Badge variant={editTarget.isPaid ? 'success' : 'neutral'} className="ml-auto shrink-0">
                {editTarget.isPaid ? 'Paid' : 'Unpaid'}
              </Badge>
            </div>
          )}
          <CreditFormFields isEdit />
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setEditTarget(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => { void handleEdit(); }}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Leave Credit"
        size="sm"
      >
        <div className="p-6 space-y-4">
          {deleteTarget && (
            <p className="text-sm text-foreground">
              Delete the{' '}
              <span className="font-bold">{deleteTarget.leaveTypeName}</span> credit block
              ({deleteTarget.allocated.toFixed(2)} day(s) allocated, valid{' '}
              {deleteTarget.validFrom} → {deleteTarget.expiresAt})?
              <br />
              <span className="text-red-600 font-semibold">This cannot be undone.</span>
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
              onClick={() => { void handleDelete(); }}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
