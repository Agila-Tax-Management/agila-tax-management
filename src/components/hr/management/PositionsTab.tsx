'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

interface Department { id: string; name: string; }

interface Position {
  id: number;
  title: string;
  description: string | null;
  departmentId: number;
  departmentName: string;
  employeeCount: number;
}

interface PosForm {
  title: string;
  departmentId: string;
  description: string;
}

const EMPTY: PosForm = { title: '', departmentId: '', description: '' };

export function PositionsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Position | null>(null);
  const [form, setForm] = useState<PosForm>(EMPTY);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/positions');
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { data: Position[] };
      setPositions(json.data ?? []);
    } catch {
      error('Error', 'Failed to load positions.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/departments');
      if (!res.ok) return;
      const json = (await res.json()) as { data: Department[] };
      setDepartments(json.data ?? []);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    void fetchPositions();
    void fetchDepartments();
  }, [fetchPositions, fetchDepartments]);

  const openAdd = () => { setForm(EMPTY); setIsAddOpen(true); };
  const closeAdd = () => { setIsAddOpen(false); setForm(EMPTY); };

  const openEdit = (pos: Position) => {
    setEditTarget(pos);
    setForm({ title: pos.title, departmentId: String(pos.departmentId), description: pos.description ?? '' });
    setIsEditOpen(true);
  };
  const closeEdit = () => { setIsEditOpen(false); setEditTarget(null); setForm(EMPTY); };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.departmentId) {
      error('Missing fields', 'Position title and department are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/hr/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          departmentId: parseInt(form.departmentId, 10),
          description: form.description.trim() || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not create position.'); return; }
      success('Position created', `${form.title} has been added.`);
      closeAdd();
      void fetchPositions();
    } catch {
      error('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget || !form.title.trim() || !form.departmentId) {
      error('Missing fields', 'Position title and department are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/positions/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          departmentId: parseInt(form.departmentId, 10),
          description: form.description.trim() || null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not update position.'); return; }
      success('Position updated', `${form.title} has been updated.`);
      closeEdit();
      void fetchPositions();
    } catch {
      error('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pos: Position) => {
    if (!confirm(`Delete position "${pos.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/hr/positions/${pos.id}`, { method: 'DELETE' });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error('Cannot delete', data.error ?? 'Could not delete position.'); return; }
      success('Position deleted', `${pos.title} has been removed.`);
      void fetchPositions();
    } catch {
      error('Error', 'An unexpected error occurred.');
    }
  };

  const FormModal = ({ isOpen, onClose, title, onSave }: { isOpen: boolean; onClose: () => void; title: string; onSave: () => Promise<void> }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department <span className="text-red-500">*</span></label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={form.departmentId}
              onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}
            >
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 min-h-20 resize-none"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => void onSave()} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />} Save Position
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <>
      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={openAdd}>
          <Plus size={16} /> Add Position
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Position Title</th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Department</th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Employees</th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => (
                  <tr key={pos.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center">
                          <Briefcase size={16} />
                        </div>
                        <span className="font-bold text-foreground">{pos.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{pos.departmentName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{pos.employeeCount}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" className="p-1.5 h-auto" onClick={() => openEdit(pos)}><Pencil size={14} /></Button>
                        <Button variant="ghost" className="p-1.5 h-auto text-red-500" onClick={() => void handleDelete(pos)}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No positions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <FormModal isOpen={isAddOpen} onClose={closeAdd} title="Add Position" onSave={handleAdd} />
      <FormModal isOpen={isEditOpen} onClose={closeEdit} title="Edit Position" onSave={handleEdit} />
    </>
  );
}
