'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Loader2, Network, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

interface TeamEmployee {
  employmentId: number;
  employeeId: number;
  fullName: string;
  employeeNo: string | null;
}

interface TeamPosition {
  id: number;
  title: string;
  employees: TeamEmployee[];
}

interface ApiTeam {
  id: number;
  name: string;
  leaderId: number | null;
  leaderName: string | null;
  leaderEmployeeNo: string | null;
  memberCount: number;
  positions: TeamPosition[];
}

interface ApiEmployee {
  id: number;
  fullName: string;
  employeeNo: string | null;
  employment: { id: number; position: { id: number; title: string } | null } | null;
}

interface ApiPosition {
  id: number;
  title: string;
}

interface TeamFormState {
  name: string;
  leaderId: string;
}

const EMPTY_FORM: TeamFormState = { name: '', leaderId: '' };

const SELECT_CLASS = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';
const INPUT_CLASS  = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30';

export function TeamsTab(): React.ReactNode {
  const { success, error } = useToast();

  const [teams,            setTeams]            = useState<ApiTeam[]>([]);
  const [loadingTeams,     setLoadingTeams]      = useState(true);
  const [employees,        setEmployees]         = useState<ApiEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees]  = useState(true);
  const [allPositions,     setAllPositions]      = useState<ApiPosition[]>([]);

  // Add / Edit modal
  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<ApiTeam | null>(null);
  const [form,       setForm]       = useState<TeamFormState>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ApiTeam | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Manage Positions modal
  const [positionsTeam,  setPositionsTeam]  = useState<ApiTeam | null>(null);
  const [addPositionId,  setAddPositionId]  = useState('');
  const [addingPosition, setAddingPosition] = useState(false);
  const [removingPosId,  setRemovingPosId]  = useState<number | null>(null);
  const [expandedPosIds, setExpandedPosIds] = useState<Set<number>>(new Set());

  // Reset form on modal open (adjust-during-render pattern)
  const [prevAddOpen, setPrevAddOpen] = useState(false);
  if (addOpen !== prevAddOpen) {
    setPrevAddOpen(addOpen);
    if (addOpen) setForm(EMPTY_FORM);
  }
  const [prevEditTarget, setPrevEditTarget] = useState<ApiTeam | null>(null);
  if (editTarget !== prevEditTarget) {
    setPrevEditTarget(editTarget);
    if (editTarget) setForm({ name: editTarget.name, leaderId: editTarget.leaderId ? String(editTarget.leaderId) : '' });
  }
  const [prevPositionsTeam, setPrevPositionsTeam] = useState<ApiTeam | null>(null);
  if (positionsTeam !== prevPositionsTeam) {
    setPrevPositionsTeam(positionsTeam);
    if (positionsTeam) { setAddPositionId(''); setExpandedPosIds(new Set()); }
  }

  /* ── Data fetchers ───────────────────────────────────────────── */

  const fetchTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const res = await fetch('/api/hr/teams');
      const json: { data?: ApiTeam[]; error?: string } = await res.json();
      if (!res.ok) { error('Failed to load teams', json.error ?? 'An error occurred.'); return; }
      setTeams(json.data ?? []);
    } catch { error('Failed to load teams', 'Could not reach the server.'); }
    finally { setLoadingTeams(false); }
  }, [error]);

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch('/api/hr/employees');
      const json: { data?: ApiEmployee[]; error?: string } = await res.json();
      if (res.ok) setEmployees(json.data ?? []);
    } catch { /* silently ignore */ }
    finally { setLoadingEmployees(false); }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/positions');
      const json: { data?: ApiPosition[]; error?: string } = await res.json();
      if (res.ok) setAllPositions(json.data ?? []);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    void fetchTeams();
    void fetchEmployees();
    void fetchPositions();
  }, [fetchTeams, fetchEmployees, fetchPositions]);

  /* ── CRUD handlers ───────────────────────────────────────────── */

  const handleSave = async () => {
    if (!form.name.trim()) { error('Validation error', 'Team name is required.'); return; }
    setSaving(true);
    try {
      const isEdit = editTarget !== null;
      const url    = isEdit ? `/api/hr/teams/${editTarget.id}` : '/api/hr/teams';
      const res    = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), leaderId: form.leaderId ? Number(form.leaderId) : null }),
      });
      const json: { data?: ApiTeam; error?: string } = await res.json();
      if (!res.ok) { error(isEdit ? 'Failed to update team' : 'Failed to create team', json.error ?? 'An error occurred.'); return; }
      if (json.data) {
        if (isEdit) setTeams((prev) => prev.map((t) => (t.id === editTarget.id ? json.data! : t)));
        else        setTeams((prev) => [...prev, json.data!]);
      }
      success(isEdit ? 'Team updated' : 'Team created', `"${form.name.trim()}" has been ${isEdit ? 'updated' : 'created'}.`);
      setAddOpen(false);
      setEditTarget(null);
    } catch { error('Network error', 'Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/hr/teams/${deleteTarget.id}`, { method: 'DELETE' });
      const json: { error?: string } = await res.json();
      if (!res.ok) { error('Failed to delete team', json.error ?? 'An error occurred.'); return; }
      setTeams((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      success('Team deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
    } catch { error('Network error', 'Could not reach the server.'); }
    finally { setDeleting(false); }
  };

  const handleAddPosition = async () => {
    if (!positionsTeam || !addPositionId) return;
    setAddingPosition(true);
    try {
      const res  = await fetch(`/api/hr/teams/${positionsTeam.id}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId: Number(addPositionId) }),
      });
      const json: { data?: TeamPosition; error?: string } = await res.json();
      if (!res.ok) { error('Failed to add position', json.error ?? 'An error occurred.'); return; }
      const newPos = json.data!;
      const updatedTeam: ApiTeam = {
        ...positionsTeam,
        positions: [...positionsTeam.positions, newPos].sort((a, b) => a.title.localeCompare(b.title)),
      };
      setPositionsTeam(updatedTeam);
      setTeams((prev) => prev.map((t) => t.id === positionsTeam.id ? updatedTeam : t));
      setAddPositionId('');
      setExpandedPosIds((prev) => new Set(prev).add(newPos.id));
      success('Position added', `"${newPos.title}" has been assigned to the team.`);
    } catch { error('Network error', 'Could not reach the server.'); }
    finally { setAddingPosition(false); }
  };

  const handleRemovePosition = async (positionId: number, positionTitle: string) => {
    if (!positionsTeam) return;
    setRemovingPosId(positionId);
    try {
      const res  = await fetch(`/api/hr/teams/${positionsTeam.id}/positions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId }),
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) { error('Failed to remove position', json.error ?? 'An error occurred.'); return; }
      const updatedTeam: ApiTeam = {
        ...positionsTeam,
        positions: positionsTeam.positions.filter((p) => p.id !== positionId),
      };
      setPositionsTeam(updatedTeam);
      setTeams((prev) => prev.map((t) => t.id === positionsTeam.id ? updatedTeam : t));
      success('Position removed', `"${positionTitle}" has been removed from the team.`);
    } catch { error('Network error', 'Could not reach the server.'); }
    finally { setRemovingPosId(null); }
  };

  const toggleExpand = (posId: number) => {
    setExpandedPosIds((prev) => {
      const next = new Set(prev);
      if (next.has(posId)) next.delete(posId); else next.add(posId);
      return next;
    });
  };

  /* ── Derived data ────────────────────────────────────────────── */

  const assignedPosIds     = new Set(positionsTeam?.positions.map((p) => p.id) ?? []);
  const availablePositions = allPositions.filter((p) => !assignedPosIds.has(p.id));

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <>
      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add Team
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Team Name</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Leader</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Positions</th>
                <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingTeams ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    <Loader2 className="inline-block animate-spin mr-2" size={16} />Loading...
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No teams yet.</td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0">
                          <Network size={16} />
                        </div>
                        <span className="font-bold text-foreground">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {team.leaderName ?? <span className="text-muted-foreground/50 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {team.positions.length === 0 ? (
                        <span className="text-muted-foreground/50 italic text-xs">No positions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {team.positions.map((p) => (
                            <span key={p.id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {p.title}
                              <span className="ml-1 text-blue-500">({p.employees.length})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          title="Manage positions"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => setPositionsTeam(team)}
                        ><Users size={14} /></button>
                        <button
                          type="button"
                          title="Edit team"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          onClick={() => setEditTarget(team)}
                        ><Pencil size={14} /></button>
                        <button
                          type="button"
                          title="Delete team"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setDeleteTarget(team)}
                        ><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Add / Edit Modal ───────────────────────────────────── */}
      <Modal
        isOpen={addOpen || editTarget !== null}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        title={editTarget ? 'Edit Team' : 'Add Team'}
        size="md"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Team Name</label>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder="e.g. Compliance Core"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Team Leader</label>
            <select
              className={SELECT_CLASS}
              value={form.leaderId}
              disabled={loadingEmployees}
              onChange={(e) => setForm((prev) => ({ ...prev, leaderId: e.target.value }))}
            >
              <option value="">No leader assigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}{emp.employeeNo ? ` (${emp.employeeNo})` : ''}
                  {emp.employment?.position ? ` — ${emp.employment.position.title}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditTarget(null); }} disabled={saving}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
              {editTarget ? 'Update Team' : 'Save Team'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        title="Delete Team"
        size="sm"
      >
        <div className="space-y-4 p-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? All position assignments will be cleared.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? <Loader2 size={15} className="animate-spin mr-2" /> : null}Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Manage Positions Modal ─────────────────────────────── */}
      <Modal
        isOpen={positionsTeam !== null}
        onClose={() => setPositionsTeam(null)}
        title={`${positionsTeam?.name ?? ''} — Positions`}
        size="lg"
      >
        <div className="p-6 space-y-4">

          {/* Assigned positions list */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/60 border-b border-border flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Positions</p>
              <Badge variant="neutral">{positionsTeam?.positions.length ?? 0}</Badge>
            </div>

            {!positionsTeam?.positions.length ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground italic">
                No positions assigned yet.
              </p>
            ) : (
              <div className="divide-y divide-border/70">
                {positionsTeam.positions.map((pos) => {
                  const isExpanded = expandedPosIds.has(pos.id);
                  return (
                    <div key={pos.id}>
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <button
                          type="button"
                          className="flex items-center gap-2 flex-1 text-left"
                          onClick={() => toggleExpand(pos.id)}
                        >
                          {isExpanded
                            ? <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                            : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                          <span className="font-semibold text-foreground text-sm">{pos.title}</span>
                          <Badge variant="neutral">{pos.employees.length} employee{pos.employees.length !== 1 ? 's' : ''}</Badge>
                        </button>
                        <button
                          type="button"
                          disabled={removingPosId === pos.id}
                          onClick={() => void handleRemovePosition(pos.id, pos.title)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                          title="Remove position from team"
                        >
                          {removingPosId === pos.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="bg-muted/30 border-t border-border/40">
                          {pos.employees.length === 0 ? (
                            <p className="px-8 py-3 text-xs text-muted-foreground italic">
                              No active employees hold this position.
                            </p>
                          ) : (
                            <ul className="px-8 py-2 space-y-1.5">
                              {pos.employees.map((emp) => (
                                <li key={emp.employmentId} className="flex items-center gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                  <span className="font-medium text-foreground">{emp.fullName}</span>
                                  {emp.employeeNo && (
                                    <span className="text-xs text-muted-foreground">({emp.employeeNo})</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add position */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Add Position</p>
            <div className="flex gap-2">
              <select
                className={`${SELECT_CLASS} flex-1`}
                value={addPositionId}
                disabled={addingPosition}
                onChange={(e) => setAddPositionId(e.target.value)}
              >
                <option value="">Select a position...</option>
                {availablePositions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                disabled={!addPositionId || addingPosition}
                onClick={() => void handleAddPosition()}
              >
                {addingPosition ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              </Button>
            </div>
            {availablePositions.length === 0 && allPositions.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">All available positions are already assigned.</p>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setPositionsTeam(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
