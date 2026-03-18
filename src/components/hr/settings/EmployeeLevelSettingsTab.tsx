'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Check, Loader2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

interface EmployeeLevelItem {
  id: number;
  name: string;
  position: number;
  description: string;
}

interface NewLevelForm {
  name: string;
  position: number;
  description: string;
}

export function EmployeeLevelSettingsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [levels, setLevels] = useState<EmployeeLevelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newLevel, setNewLevel] = useState<NewLevelForm>({ name: '', position: 1, description: '' });

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/settings/employee-levels');
      const json: { data?: EmployeeLevelItem[]; error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to load levels', json.error ?? 'An error occurred.');
        return;
      }
      setLevels(json.data ?? []);
      const maxPos = Math.max(0, ...(json.data ?? []).map((l) => l.position));
      setNewLevel((prev) => ({ ...prev, position: maxPos + 1 }));
    } catch {
      error('Failed to load levels', 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchLevels();
  }, [fetchLevels]);

  const updateRow = (id: number, field: keyof EmployeeLevelItem, value: string | number) => {
    setLevels((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const saveLevel = async (level: EmployeeLevelItem) => {
    if (!level.name.trim()) {
      error('Validation error', 'Level name cannot be empty.');
      return;
    }
    setSaving(level.id);
    try {
      const res = await fetch(`/api/hr/settings/employee-levels/${level.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: level.name.trim(), position: level.position, description: level.description }),
      });
      const json: { data?: EmployeeLevelItem; error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to update level', json.error ?? 'An error occurred.');
        return;
      }
      setLevels((prev) => prev.map((item) => (item.id === level.id ? (json.data ?? item) : item)));
      success('Level updated', `"${level.name}" has been saved.`);
    } catch {
      error('Failed to update level', 'Could not reach the server.');
    } finally {
      setSaving(null);
    }
  };

  const deleteLevel = async (level: EmployeeLevelItem) => {
    setDeleting(level.id);
    try {
      const res = await fetch(`/api/hr/settings/employee-levels/${level.id}`, { method: 'DELETE' });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to delete level', json.error ?? 'An error occurred.');
        return;
      }
      setLevels((prev) => prev.filter((item) => item.id !== level.id));
      success('Level deleted', `"${level.name}" has been removed.`);
    } catch {
      error('Failed to delete level', 'Could not reach the server.');
    } finally {
      setDeleting(null);
    }
  };

  const addLevel = async () => {
    if (!newLevel.name.trim()) {
      error('Failed to add level', 'Level name is required.');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/hr/settings/employee-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLevel.name.trim(), position: newLevel.position, description: newLevel.description }),
      });
      const json: { data?: EmployeeLevelItem; error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to add level', json.error ?? 'An error occurred.');
        return;
      }
      if (json.data) {
        setLevels((prev) => [...prev, json.data!].sort((a, b) => a.position - b.position));
        setNewLevel({ name: '', position: json.data.position + 1, description: '' });
      }
      success('Level added', `"${newLevel.name.trim()}" has been created.`);
    } catch {
      error('Failed to add level', 'Could not reach the server.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="p-6 sm:p-7 space-y-5">
      <div>
        <h2 className="text-lg font-black text-foreground">Employee Level</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Maintain dynamic employee level hierarchy and ordering.
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs tracking-wider">Position</th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs tracking-wider">Name</th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs tracking-wider hidden md:table-cell">Description</th>
              <th className="text-right px-4 py-3 font-bold uppercase text-xs tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  <Loader2 className="inline-block animate-spin mr-2" size={16} />
                  Loading...
                </td>
              </tr>
            ) : levels.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No employee levels yet. Add one below.
                </td>
              </tr>
            ) : (
              levels
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((level) => (
                  <tr key={level.id} className="border-t border-border/70">
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={level.position}
                        onChange={(event) => updateRow(level.id, 'position', Number(event.target.value) || 1)}
                        className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={level.name}
                        onChange={(event) => updateRow(level.id, 'name', event.target.value)}
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <input
                        type="text"
                        value={level.description}
                        placeholder="Optional description"
                        onChange={(event) => updateRow(level.id, 'description', event.target.value)}
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={saving === level.id}
                          onClick={() => void saveLevel(level)}
                          className="inline-flex items-center justify-center rounded-md p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                          title="Save changes"
                        >
                          {saving === level.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Check size={15} />}
                        </button>
                        <button
                          type="button"
                          disabled={deleting === level.id}
                          onClick={() => void deleteLevel(level)}
                          className="inline-flex items-center justify-center rounded-md p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          title="Delete level"
                        >
                          {deleting === level.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Add New Level</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Level name (e.g. Senior)"
            value={newLevel.name}
            onChange={(event) => setNewLevel((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <input
            type="number"
            min={1}
            placeholder="Position (1 = highest)"
            value={newLevel.position}
            onChange={(event) => setNewLevel((prev) => ({ ...prev, position: Number(event.target.value) || 1 }))}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newLevel.description}
            onChange={(event) => setNewLevel((prev) => ({ ...prev, description: event.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm md:col-span-2"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            className="bg-slate-800 hover:bg-slate-900 text-white"
            disabled={adding}
            onClick={() => void addLevel()}
          >
            {adding ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
            Add Level
          </Button>
        </div>
      </div>
    </Card>
  );
}
