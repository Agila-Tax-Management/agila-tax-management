'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Network, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

interface ApiTeam {
  id: number;
  name: string;
  leaderId: number | null;
  leaderName: string | null;
  leaderEmployeeNo: string | null;
  memberCount: number;
}

interface ApiEmployee {
  id: number;
  fullName: string;
  employeeNo: string | null;
  employment: { id: number; position: { title: string } | null } | null;
}

interface TeamMember {
  employmentId: number;
  employeeId: number;
  fullName: string;
  employeeNo: string | null;
  position: string | null;
  department: string | null;
}

interface TeamFormState {
  name: string;
  leaderId: string;
}

const EMPTY_FORM: TeamFormState = { name: '', leaderId: '' };

const SELECT_CLASS = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';
const INPUT_CLASS = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30';

export function TeamsTab(): React.ReactNode {
  const { success, error } = useToast();

  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Add / Edit modal
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiTeam | null>(null);
  const [form, setForm] = useState<TeamFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ApiTeam | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Members modal
  const [membersTeam, setMembersTeam] = useState<ApiTeam | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [addEmploymentId, setAddEmploymentId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Reset form when modals open (adjust state during render)
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
  const [prevMembersTeam, setPrevMembersTeam] = useState<ApiTeam | null>(null);
  if (membersTeam !== prevMembersTeam) {
    setPrevMembersTeam(membersTeam);
    if (membersTeam) setAddEmploymentId('');
  }

  /* â”€â”€ Data fetchers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

  const fetchMembers = useCallback(async (teamId: number) => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/hr/teams/${teamId}/members`);
      const json: { data?: TeamMember[]; error?: string } = await res.json();
      if (!res.ok) { error('Failed to load members', json.error ?? 'An error occurred.'); return; }
      setMembers(json.data ?? []);
    } catch { error('Failed to load members', 'Could not reach the server.'); }
    finally { setLoadingMembers(false); }
  }, [error]);

  useEffect(() => {
    void fetchTeams();
    void fetchEmployees();
  }, [fetchTeams, fetchEmployees]);

  useEffect(() => {
    if (membersTeam) void fetchMembers(membersTeam.id);
    else setMembers([]);
  }, [membersTeam, fetchMembers]);

  /* â”€â”€ CRUD handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  const handleSave = async () => {
    if (!form.name.trim()) { error('Validation error', 'Team name is required.'); return; }
    setSaving(true);
    try {
      const isEdit = editTarget !== null;
      const url = isEdit ? `/api/hr/teams/${editTarget.id}` : '/api/hr/teams';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), leaderId: form.leaderId ? Number(form.leaderId) : null }),
      });
      const json: { data?: ApiTeam; error?: string } = await res.json();
      if (!res.ok) { error(isEdit ? 'Failed to update team' : 'Failed to create team', json.error ?? 'An error occurred.'); return; }
      if (json.data) {
        if (isEdit) setTeams((prev) => prev.map((t) => (t.id === editTarget.id ? json.data! : t)));
        else setTeams((prev) => [...prev, json.data!]);
      }
      success(isEdit ? 'Team updated' : 'Team created', isEdit ? `"${form.name.trim()}" has been updated.` : `"${form.name.trim()}" has been created.`);
      setAddOpen(false);
      setEditTarget(null);
    } catch { error('Network error', 'Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/teams/${deleteTarget.id}`, { method: 'DELETE' });
      const json: { error?: string } = await res.json();
      if (!res.ok) { error('Failed to delete team', json.error ?? 'An error occurred.'); return; }
      setTeams((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      success('Team deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
    } catch { error('Network error', 'Could not reach the server.'); }
    finally { setDeleting(false); }
  };

  const handleAddMember = async () => {
    if (!membersTeam || !addEmploymentId) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/hr/teams/${membersTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employmentId: Number(addEmploymentId) }),
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) { error('Failed to add member', json.error ?? 'An error occurred.'); return; }
      setAddEmploymentId('');
      await fetchMembers(membersTeam.id);
      setTeams((prev) => prev.map((t) => t.id === membersTeam.id ? { ...t, memberCount: t.memberCount + 1 } : t));
      success('Member added', 'The employee has been added to the team.');
    } catch { error('Network error', 'Could not reach the server.'); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (employmentId: number) => {
    if (!membersTeam) return;
    setRemovingMemberId(employmentId);
    try {
      const res = await fetch(`/api/hr/teams/${membersTeam.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employmentId }),
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) { error('Failed to remove member', json.error ?? 'An error occurred.'); return; }
      setMembers((prev) => prev.filter((m) => m.employmentId !== employmentId));
      setTeams((prev) => prev.map((t) => t.id === membersTeam.id ? { ...t, memberCount: Math.max(0, t.memberCount - 1) } : t));
      success('Member removed', 'The employee has been removed from the team.');
    } catch { error('Network error', 'Could not reach the server.'); }
    finally { setRemovingMemberId(null); }
  };

  /* â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  // Employees not already in the team (for the add-member select)
  const memberEmploymentIds = new Set(members.map((m) => m.employmentId));
  const availableToAdd = employees.filter((emp) => {
    if (!emp.employment) return false;
    return !memberEmploymentIds.has(emp.employment.id);
  });

  /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Members</th>
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
                      {team.leaderName ?? <span className="text-muted-foreground/50 italic">â€”</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{team.memberCount}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          title="Manage members"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => setMembersTeam(team)}
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

      {/* â”€â”€ Add / Edit Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ Delete Confirmation Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        title="Delete Team"
        size="sm"
      >
        <div className="space-y-4 p-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? All member assignments will be cleared.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? <Loader2 size={15} className="animate-spin mr-2" /> : null}Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/*  Manage Members Modal */}
      <Modal
        isOpen={membersTeam !== null}
        onClose={() => setMembersTeam(null)}
        title={`${membersTeam?.name ?? ''} Members`}
        size="lg"
      >
        <div className="p-6 space-y-4">
          {/* Current members list */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/60 border-b border-border flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Members</p>
              <Badge variant="neutral">{members.length}</Badge>
            </div>
            <div className="max-h-56 overflow-auto">
              {loadingMembers ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="inline-block animate-spin mr-2" size={14} />Loading...
                </p>
              ) : members.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">No members assigned yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">Employee</th>
                      <th className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase hidden sm:table-cell">Position</th>
                      <th className="text-right px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.employmentId} className="border-b border-border/70 last:border-b-0">
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-foreground">{m.fullName}</p>
                          {m.employeeNo && <p className="text-[11px] text-muted-foreground">{m.employeeNo}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{m.position ?? 'â€”'}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            disabled={removingMemberId === m.employmentId}
                            onClick={() => void handleRemoveMember(m.employmentId)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {removingMemberId === m.employmentId
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Add member */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Add Member</p>
            <div className="flex gap-2">
              <select
                className={`${SELECT_CLASS} flex-1`}
                value={addEmploymentId}
                disabled={loadingEmployees || addingMember}
                onChange={(e) => setAddEmploymentId(e.target.value)}
              >
                <option value="">Select an employee</option>
                {availableToAdd.map((emp) => (
                  <option key={emp.employment!.id} value={emp.employment!.id}>
                    {emp.fullName}{emp.employeeNo ? ` (${emp.employeeNo})` : ''}
                  </option>
                ))}
              </select>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                disabled={!addEmploymentId || addingMember}
                onClick={() => void handleAddMember()}
              >
                {addingMember ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setMembersTeam(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
