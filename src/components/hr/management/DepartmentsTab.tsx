'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

interface Department {
  id: string;
  name: string;
  description: string | null;
  positionCount: number;
  employeeCount: number;
}

interface DeptForm {
  name: string;
  description: string;
}

const EMPTY: DeptForm = { name: '', description: '' };

export function DepartmentsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptForm>(EMPTY);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/departments');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as { data: Department[] };
      setDepartments(json.data ?? []);
    } catch {
      error('Error', 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { void fetchDepartments(); }, [fetchDepartments]);

  const openAdd = () => { setForm(EMPTY); setIsAddOpen(true); };
  const closeAdd = () => { setIsAddOpen(false); setForm(EMPTY); };

  const openEdit = (dept: Department) => {
    setEditTarget(dept);
    setForm({ name: dept.name, description: dept.description ?? '' });
    setIsEditOpen(true);
  };
  const closeEdit = () => { setIsEditOpen(false); setEditTarget(null); setForm(EMPTY); };

  const handleAdd = async () => {
    if (!form.name.trim()) {
      error('Missing field', 'Department name is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/hr/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not create department.'); return; }
      success('Department created', `${form.name} has been added.`);
      closeAdd();
      void fetchDepartments();
    } catch {
      error('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget || !form.name.trim()) {
      error('Missing field', 'Department name is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/departments/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not update department.'); return; }
      success('Department updated', `${form.name} has been updated.`);
      closeEdit();
      void fetchDepartments();
    } catch {
      error('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/hr/departments/${dept.id}`, { method: 'DELETE' });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error('Cannot delete', data.error ?? 'Could not delete department.'); return; }
      success('Department deleted', `${dept.name} has been removed.`);
      void fetchDepartments();
    } catch {
      error('Error', 'An unexpected error occurred.');
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={openAdd}>
          <Plus size={16} /> Add Department
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{dept.name}</h3>
                    <p className="text-xs text-muted-foreground">{dept.positionCount} position{dept.positionCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" className="p-1.5 h-auto" onClick={() => openEdit(dept)}><Pencil size={14} /></Button>
                  <Button variant="ghost" className="p-1.5 h-auto text-red-500" onClick={() => void handleDelete(dept)}><Trash2 size={14} /></Button>
                </div>
              </div>
              {dept.description && <p className="text-sm text-muted-foreground">{dept.description}</p>}
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="neutral">{dept.employeeCount} Staff</Badge>
              </div>
            </Card>
          ))}
          {departments.length === 0 && (
            <p className="col-span-3 text-center py-12 text-muted-foreground">No departments yet.</p>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={closeAdd} title="Add Department" size="lg">
        <div className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
              <textarea
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 min-h-24 resize-none"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeAdd} disabled={saving}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => void handleAdd()} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save Department
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={closeEdit} title="Edit Department" size="lg">
        <div className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
              <textarea
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 min-h-24 resize-none"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeEdit} disabled={saving}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => void handleEdit()} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
