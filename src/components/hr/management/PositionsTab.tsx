'use client';

import React, { useMemo, useState } from 'react';
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { EMPLOYEES, type Employee } from '@/lib/mock-hr-data';
import { HR_DEPARTMENTS, MOCK_POSITIONS, type MockPosition } from './data';

interface AddPositionFormData {
  title: string;
  department: string;
  level: string;
  employeeCount: string;
}

interface EditPositionFormData {
  id: number;
  title: string;
  department: string;
  level: string;
  employeeCount: string;
}

interface ReassignRoleFormData {
  employeeId: string;
}

const EMPTY_ADD_POSITION_FORM: AddPositionFormData = {
  title: '',
  department: '',
  level: '',
  employeeCount: '',
};

export function PositionsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [positions, setPositions] = useState<MockPosition[]>(MOCK_POSITIONS);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isEditPositionOpen, setIsEditPositionOpen] = useState(false);
  const [addPositionForm, setAddPositionForm] = useState<AddPositionFormData>(EMPTY_ADD_POSITION_FORM);
  const [editPositionForm, setEditPositionForm] = useState<EditPositionFormData | null>(null);
  const [reassignRoleForm, setReassignRoleForm] = useState<ReassignRoleFormData>({ employeeId: '' });

  const normalizeRole = (value: string) => value.trim().toLowerCase();

  const updateAddPositionForm = <K extends keyof AddPositionFormData>(
    key: K,
    value: AddPositionFormData[K],
  ) => {
    setAddPositionForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeAddPositionModal = () => {
    setIsAddPositionOpen(false);
    setAddPositionForm(EMPTY_ADD_POSITION_FORM);
  };

  const openEditPositionModal = (position: MockPosition) => {
    setEditPositionForm({
      id: position.id,
      title: position.title,
      department: position.department,
      level: position.level,
      employeeCount: String(position.employeeCount),
    });
    setReassignRoleForm({ employeeId: '' });
    setIsEditPositionOpen(true);
  };

  const closeEditPositionModal = () => {
    setIsEditPositionOpen(false);
    setEditPositionForm(null);
    setReassignRoleForm({ employeeId: '' });
  };

  const updateEditPositionForm = <K extends keyof EditPositionFormData>(key: K, value: EditPositionFormData[K]) => {
    setEditPositionForm((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, [key]: value };
    });
  };

  const handleAddPosition = () => {
    const requiredFields: Array<keyof AddPositionFormData> = ['title', 'department', 'level', 'employeeCount'];
    const hasMissingRequiredField = requiredFields.some((field) => !addPositionForm[field].trim());
    const hasInvalidEmployeeCount = Number.isNaN(Number(addPositionForm.employeeCount)) || Number(addPositionForm.employeeCount) <= 0;

    if (hasMissingRequiredField || hasInvalidEmployeeCount) {
      error('Failed to add position', 'Please complete all required fields with a valid employee count.');
      return;
    }

    success('Position created', 'The new position has been added successfully.');
    closeAddPositionModal();
  };

  const handleSavePositionEdit = () => {
    if (!editPositionForm) {
      return;
    }

    const requiredFields: Array<keyof EditPositionFormData> = ['title', 'department', 'level', 'employeeCount'];
    const hasMissingRequiredField = requiredFields.some((field) => !String(editPositionForm[field]).trim());
    const parsedEmployeeCount = Number(editPositionForm.employeeCount);
    const hasInvalidEmployeeCount = Number.isNaN(parsedEmployeeCount) || parsedEmployeeCount <= 0;

    if (hasMissingRequiredField || hasInvalidEmployeeCount) {
      error('Failed to update position', 'Please complete all required fields with a valid employee count.');
      return;
    }

    setPositions((prev) =>
      prev.map((position) =>
        position.id === editPositionForm.id
          ? {
              ...position,
              title: editPositionForm.title,
              department: editPositionForm.department,
              level: editPositionForm.level,
              employeeCount: parsedEmployeeCount,
            }
          : position,
      ),
    );

    success('Position updated', 'Position details have been updated successfully.');
    closeEditPositionModal();
  };

  const handleReassignEmployeeRole = () => {
    if (!editPositionForm) {
      return;
    }

    if (!reassignRoleForm.employeeId) {
      error('Failed to reassign role', 'Please select an employee to reassign.');
      return;
    }

    const selectedEmployee = employees.find((employee) => employee.id === reassignRoleForm.employeeId);

    if (!selectedEmployee) {
      error('Failed to reassign role', 'Selected employee was not found.');
      return;
    }

    const isSameRole =
      normalizeRole(selectedEmployee.position) === normalizeRole(editPositionForm.title)
      && selectedEmployee.department === editPositionForm.department;

    if (isSameRole) {
      error('Failed to reassign role', 'Employee is already assigned to this position.');
      return;
    }

    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === reassignRoleForm.employeeId
          ? {
              ...employee,
              position: editPositionForm.title,
              department: editPositionForm.department as Employee['department'],
            }
          : employee,
      ),
    );

    success('Position reassigned', `${selectedEmployee.fullName} has been assigned to ${editPositionForm.title}.`);
    setReassignRoleForm({ employeeId: '' });
  };

  const employeesInDepartment = useMemo(() => {
    if (!editPositionForm) {
      return [];
    }
    return employees.filter((employee) => employee.department === editPositionForm.department);
  }, [editPositionForm, employees]);

  const matchingPositionEmployees = useMemo(() => {
    if (!editPositionForm) {
      return [];
    }
    const normalizedTitle = normalizeRole(editPositionForm.title);
    if (!normalizedTitle) {
      return [];
    }
    return employeesInDepartment.filter((employee) => normalizeRole(employee.position) === normalizedTitle);
  }, [employeesInDepartment, editPositionForm]);

  const reassignableEmployees = useMemo(() => {
    if (!editPositionForm) {
      return [];
    }
    const normalizedTitle = normalizeRole(editPositionForm.title);
    return employeesInDepartment.filter((employee) => normalizeRole(employee.position) !== normalizedTitle);
  }, [employeesInDepartment, editPositionForm]);

  const getPositionHolderCount = (position: MockPosition) => {
    return employees.filter(
      (employee) =>
        employee.department === position.department
        && normalizeRole(employee.position) === normalizeRole(position.title),
    ).length;
  };

  return (
    <>
      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => setIsAddPositionOpen(true)}>
          <Plus size={16} /> Add Position
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Position Title</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Level</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Employees</th>
                <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center">
                        <Briefcase size={16} />
                      </div>
                      <span className="font-bold text-foreground">{pos.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{pos.department}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={
                      pos.level === 'Manager'
                        ? 'warning'
                        : pos.level === 'Senior'
                          ? 'info'
                          : pos.level === 'Supervisor'
                            ? 'success'
                            : 'neutral'
                    }
                    >
                      {pos.level}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{getPositionHolderCount(pos)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" className="p-1.5 h-auto" onClick={() => openEditPositionModal(pos)}><Pencil size={14} /></Button>
                      <Button variant="ghost" className="p-1.5 h-auto text-red-500"><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddPositionOpen} onClose={closeAddPositionModal} title="Add Position" size="lg">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position Title</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addPositionForm.title}
                onChange={(e) => updateAddPositionForm('title', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={addPositionForm.department}
                onChange={(e) => updateAddPositionForm('department', e.target.value)}
              >
                <option value="">Select department</option>
                {HR_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Level</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={addPositionForm.level}
                onChange={(e) => updateAddPositionForm('level', e.target.value)}
              >
                <option value="">Select level</option>
                <option value="Junior">Junior</option>
                <option value="Staff">Staff</option>
                <option value="Senior">Senior</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee Count</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addPositionForm.employeeCount}
                onChange={(e) => updateAddPositionForm('employeeCount', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeAddPositionModal}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleAddPosition}>
              Save Position
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditPositionOpen} onClose={closeEditPositionModal} title="Edit Position" size="xl">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position Title</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={editPositionForm?.title ?? ''}
                onChange={(e) => updateEditPositionForm('title', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={editPositionForm?.department ?? ''}
                onChange={(e) => updateEditPositionForm('department', e.target.value)}
              >
                <option value="">Select department</option>
                {HR_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Level</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={editPositionForm?.level ?? ''}
                onChange={(e) => updateEditPositionForm('level', e.target.value)}
              >
                <option value="">Select level</option>
                <option value="Junior">Junior</option>
                <option value="Staff">Staff</option>
                <option value="Senior">Senior</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee Count</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={editPositionForm?.employeeCount ?? ''}
                onChange={(e) => updateEditPositionForm('employeeCount', e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Position Context</p>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <Badge variant="neutral">Role Holders: {matchingPositionEmployees.length}</Badge>
              <Badge variant="info">Department Pool: {employeesInDepartment.length}</Badge>
              <Badge variant="success">Target Employees: {editPositionForm?.employeeCount || 0}</Badge>
            </div>
            <div className="rounded-lg border border-border bg-background max-h-52 overflow-auto divide-y divide-border">
              {matchingPositionEmployees.length > 0 ? (
                matchingPositionEmployees.map((employee) => (
                  <div key={employee.id} className="px-3 py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{employee.fullName}</p>
                      <p className="text-xs text-muted-foreground">{employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">{employee.employeeNo}</p>
                      <p className="text-[10px] font-semibold text-emerald-600">Current Holder</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">No employees currently hold this role.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Reassign Position</p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={reassignRoleForm.employeeId}
                onChange={(e) => setReassignRoleForm({ employeeId: e.target.value })}
              >
                <option value="">Select employee to assign this role</option>
                {reassignableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} - {employee.position}
                  </option>
                ))}
              </select>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleReassignEmployeeRole}>
                Reassign Role
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This updates the selected employee&apos;s position to <span className="font-semibold">{editPositionForm?.title ?? 'the selected role'}</span>.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeEditPositionModal}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleSavePositionEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
