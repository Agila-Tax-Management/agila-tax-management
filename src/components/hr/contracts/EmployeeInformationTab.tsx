// src/components/hr/contracts/EmployeeInformationTab.tsx
'use client';

import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

const inputClass = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
const selectClass = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none';

interface EmployeeData {
  employeeNo: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  phone: string;
  hireDate: string;
  employmentType: string;
  employmentStatus: string;
}

interface EmployeeInformationTabProps {
  data: EmployeeData;
  onSave: (updated: EmployeeData) => void;
}

export function EmployeeInformationTab({ data, onSave }: EmployeeInformationTabProps) {
  const { success } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EmployeeData>(data);

  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    setForm(data);
    setIsEditing(false);
  }

  const updateField = <K extends keyof EmployeeData>(key: K, value: EmployeeData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function handleSave(): void {
    onSave(form);
    setIsEditing(false);
    success('Employee updated', `${form.firstName} ${form.lastName}'s information has been saved.`);
  }

  function handleCancel(): void {
    setForm(data);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Employee Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Employee No.', value: data.employeeNo || '—' },
              { label: 'First Name', value: data.firstName },
              { label: 'Last Name', value: data.lastName },
              { label: 'Department', value: data.department },
              { label: 'Position', value: data.position },
              { label: 'Phone', value: data.phone },
              { label: 'Hire Date', value: data.hireDate },
              { label: 'Employment Type', value: data.employmentType },
              { label: 'Employment Status', value: data.employmentStatus },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{f.label}</p>
                <p className="text-sm font-medium text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            Edit Employee Info
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Edit Employee Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee No.</label>
            <input
              type="text"
              className={inputClass}
              value={form.employeeNo}
              onChange={(e) => updateField('employeeNo', e.target.value)}
              placeholder="EMP-0001"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
            <input
              type="text"
              className={inputClass}
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
            <input
              type="text"
              className={inputClass}
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
            <input
              type="text"
              className={inputClass}
              value={form.department}
              onChange={(e) => updateField('department', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position</label>
            <input
              type="text"
              className={inputClass}
              value={form.position}
              onChange={(e) => updateField('position', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
            <input
              type="text"
              className={inputClass}
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hire Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.hireDate}
              onChange={(e) => updateField('hireDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Type</label>
            <select
              className={selectClass}
              value={form.employmentType}
              onChange={(e) => updateField('employmentType', e.target.value)}
            >
              <option value="REGULAR">Regular</option>
              <option value="PROBATIONARY">Probationary</option>
              <option value="CONTRACTUAL">Contractual</option>
              <option value="PROJECT_BASED">Project Based</option>
              <option value="PART_TIME">Part Time</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Status</label>
            <select
              className={selectClass}
              value={form.employmentStatus}
              onChange={(e) => updateField('employmentStatus', e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel} className="gap-2">
          <X size={14} /> Cancel
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save size={14} /> Save Changes
        </Button>
      </div>
    </div>
  );
}
