'use client';

import React, { useMemo, useState } from 'react';
import { Eye, Network, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { EMPLOYEES } from '@/lib/mock-hr-data';
import { HR_DEPARTMENTS, MOCK_TEAMS, type MockTeam } from './data';

interface AddTeamFormData {
  name: string;
  department: string;
  leader: string;
  memberCount: string;
}

interface EditTeamFormData {
  id: number;
  name: string;
  department: string;
  leader: string;
  memberCount: string;
}

const EMPTY_ADD_TEAM_FORM: AddTeamFormData = {
  name: '',
  department: '',
  leader: '',
  memberCount: '',
};

export function TeamsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [teams, setTeams] = useState<MockTeam[]>(MOCK_TEAMS);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [isViewTeamOpen, setIsViewTeamOpen] = useState(false);
  const [addTeamForm, setAddTeamForm] = useState<AddTeamFormData>(EMPTY_ADD_TEAM_FORM);
  const [editTeamForm, setEditTeamForm] = useState<EditTeamFormData | null>(null);
  const [viewTeam, setViewTeam] = useState<MockTeam | null>(null);

  const updateAddTeamForm = <K extends keyof AddTeamFormData>(key: K, value: AddTeamFormData[K]) => {
    setAddTeamForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeAddTeamModal = () => {
    setIsAddTeamOpen(false);
    setAddTeamForm(EMPTY_ADD_TEAM_FORM);
  };

  const openEditTeamModal = (team: MockTeam) => {
    setEditTeamForm({
      id: team.id,
      name: team.name,
      department: team.department,
      leader: team.leader,
      memberCount: String(team.memberCount),
    });
    setIsEditTeamOpen(true);
  };

  const closeEditTeamModal = () => {
    setIsEditTeamOpen(false);
    setEditTeamForm(null);
  };

  const openViewTeamModal = (team: MockTeam) => {
    setViewTeam(team);
    setIsViewTeamOpen(true);
  };

  const closeViewTeamModal = () => {
    setIsViewTeamOpen(false);
    setViewTeam(null);
  };

  const updateEditTeamForm = <K extends keyof EditTeamFormData>(key: K, value: EditTeamFormData[K]) => {
    setEditTeamForm((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, [key]: value };
    });
  };

  const handleAddTeam = () => {
    const requiredFields: Array<keyof AddTeamFormData> = ['name', 'department', 'leader', 'memberCount'];
    const hasMissingRequiredField = requiredFields.some((field) => !addTeamForm[field].trim());
    const hasInvalidMemberCount = Number.isNaN(Number(addTeamForm.memberCount)) || Number(addTeamForm.memberCount) <= 0;

    if (hasMissingRequiredField || hasInvalidMemberCount) {
      error('Failed to add team', 'Please complete all required fields with a valid member count.');
      return;
    }

    success('Team created', 'The new team has been added successfully.');
    closeAddTeamModal();
  };

  const handleSaveTeamEdit = () => {
    if (!editTeamForm) {
      return;
    }

    const requiredFields: Array<keyof EditTeamFormData> = ['name', 'department', 'leader', 'memberCount'];
    const hasMissingRequiredField = requiredFields.some((field) => !String(editTeamForm[field]).trim());
    const parsedMemberCount = Number(editTeamForm.memberCount);
    const hasInvalidMemberCount = Number.isNaN(parsedMemberCount) || parsedMemberCount <= 0;

    if (hasMissingRequiredField || hasInvalidMemberCount) {
      error('Failed to update team', 'Please complete all required fields with a valid member count.');
      return;
    }

    setTeams((prev) =>
      prev.map((team) =>
        team.id === editTeamForm.id
          ? {
              ...team,
              name: editTeamForm.name,
              department: editTeamForm.department,
              leader: editTeamForm.leader,
              memberCount: parsedMemberCount,
            }
          : team,
      ),
    );

    success('Team updated', 'Team details have been updated successfully.');
    closeEditTeamModal();
  };

  const departmentEmployees = useMemo(() => {
    if (!editTeamForm) {
      return [];
    }
    return EMPLOYEES.filter((employee) => employee.department === editTeamForm.department);
  }, [editTeamForm]);

  const leaderInDepartment = useMemo(() => {
    if (!editTeamForm) {
      return false;
    }
    return departmentEmployees.some((employee) => employee.fullName.toLowerCase() === editTeamForm.leader.toLowerCase());
  }, [departmentEmployees, editTeamForm]);

  const viewTeamEmployees = useMemo(() => {
    if (!viewTeam) {
      return [];
    }
    return EMPLOYEES.filter((employee) => employee.department === viewTeam.department);
  }, [viewTeam]);

  const isViewLeaderInDepartment = useMemo(() => {
    if (!viewTeam) {
      return false;
    }
    return viewTeamEmployees.some((employee) => employee.fullName.toLowerCase() === viewTeam.leader.toLowerCase());
  }, [viewTeam, viewTeamEmployees]);

  return (
    <>
      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => setIsAddTeamOpen(true)}>
          <Plus size={16} /> Add Team
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Team Name</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Leader</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Members</th>
                <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                        <Network size={16} />
                      </div>
                      <span className="font-bold text-foreground">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{team.department}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{team.leader}</td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{team.memberCount}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" className="p-1.5 h-auto" onClick={() => openViewTeamModal(team)}><Eye size={14} /></Button>
                      <Button variant="ghost" className="p-1.5 h-auto" onClick={() => openEditTeamModal(team)}><Pencil size={14} /></Button>
                      <Button variant="ghost" className="p-1.5 h-auto text-red-500"><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddTeamOpen} onClose={closeAddTeamModal} title="Add Team" size="lg">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Team Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addTeamForm.name}
                onChange={(e) => updateAddTeamForm('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={addTeamForm.department}
                onChange={(e) => updateAddTeamForm('department', e.target.value)}
              >
                <option value="">Select department</option>
                {HR_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Team Leader</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addTeamForm.leader}
                onChange={(e) => updateAddTeamForm('leader', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Member Count</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addTeamForm.memberCount}
                onChange={(e) => updateAddTeamForm('memberCount', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeAddTeamModal}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleAddTeam}>
              Save Team
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditTeamOpen} onClose={closeEditTeamModal} title="Edit Team" size="xl">
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Network size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Team Operations Editor</p>
              <p className="text-xs text-blue-700">Adjust structure, leadership, and member allocation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Team Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={editTeamForm?.name ?? ''}
                onChange={(e) => updateEditTeamForm('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
                value={editTeamForm?.department ?? ''}
                onChange={(e) => updateEditTeamForm('department', e.target.value)}
              >
                <option value="">Select department</option>
                {HR_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Team Leader</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={editTeamForm?.leader ?? ''}
                onChange={(e) => updateEditTeamForm('leader', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Member Count</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={editTeamForm?.memberCount ?? ''}
                onChange={(e) => updateEditTeamForm('memberCount', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Staff Pool</p>
              <p className="text-lg font-black text-slate-900 mt-1">{departmentEmployees.length}</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Target Members</p>
              <p className="text-lg font-black text-blue-900 mt-1">{editTeamForm?.memberCount || 0}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Leader Available</p>
              <p className="text-lg font-black text-emerald-900 mt-1">{leaderInDepartment ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-border flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Department Candidate Members</p>
              <div className="flex gap-2">
                <Badge variant="info">Team Ops</Badge>
                <Badge variant="neutral">{departmentEmployees.length} Candidates</Badge>
              </div>
            </div>
            <div className="max-h-56 overflow-auto">
              {departmentEmployees.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b border-border">
                      <th className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">Employee</th>
                      <th className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">Position</th>
                      <th className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">Role Tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentEmployees.map((employee) => {
                      const isLeader = employee.fullName.toLowerCase() === (editTeamForm?.leader ?? '').toLowerCase();
                      return (
                        <tr key={employee.id} className="border-b border-border/70 last:border-b-0">
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-foreground">{employee.fullName}</p>
                            <p className="text-[11px] text-muted-foreground">{employee.employeeNo}</p>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{employee.position}</td>
                          <td className="px-4 py-2.5">
                            {isLeader ? <Badge variant="success">Team Lead</Badge> : <Badge variant="neutral">Member</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="px-4 py-4 text-sm text-muted-foreground">No employees found for selected department.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={closeEditTeamModal}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleSaveTeamEdit}>
              Update Team
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewTeamOpen} onClose={closeViewTeamModal} title="Team Details" size="xl">
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Network size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">{viewTeam?.name ?? 'Team'}</p>
              <p className="text-xs text-blue-700">Detailed view of team structure and assigned department members.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department</p>
              <p className="text-sm font-semibold text-foreground mt-1">{viewTeam?.department ?? '-'}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team Leader</p>
              <p className="text-sm font-semibold text-foreground mt-1">{viewTeam?.leader ?? '-'}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Declared Members</p>
              <p className="text-sm font-semibold text-foreground mt-1">{viewTeam?.memberCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department Pool</p>
              <p className="text-sm font-semibold text-foreground mt-1">{viewTeamEmployees.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="info">Leader In Department: {isViewLeaderInDepartment ? 'Yes' : 'No'}</Badge>
            <Badge variant="neutral">Candidates: {viewTeamEmployees.length}</Badge>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Department Members</p>
            </div>
            <div className="max-h-64 overflow-auto">
              {viewTeamEmployees.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b border-border">
                      <th className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">Employee</th>
                      <th className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">Position</th>
                      <th className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewTeamEmployees.map((employee) => {
                      const isLeader = employee.fullName.toLowerCase() === (viewTeam?.leader ?? '').toLowerCase();
                      return (
                        <tr key={employee.id} className="border-b border-border/70 last:border-b-0">
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-foreground">{employee.fullName}</p>
                            <p className="text-[11px] text-muted-foreground">{employee.employeeNo}</p>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{employee.position}</td>
                          <td className="px-4 py-2.5">
                            {isLeader ? <Badge variant="success">Team Lead</Badge> : <Badge variant="neutral">Member</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="px-4 py-4 text-sm text-muted-foreground">No employees found for this department.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={closeViewTeamModal}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
