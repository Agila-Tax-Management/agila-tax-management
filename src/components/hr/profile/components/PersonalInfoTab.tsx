// src/components/hr/profile/components/PersonalInfoTab.tsx
'use client';

import React from 'react';
import { Save, X } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import type { EmploymentTypeOption, PersonalInfoFormState } from '../profile-types';

interface PersonalInfoTabProps {
  isEditingPersonal: boolean;
  personalInfoForm: PersonalInfoFormState;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onFieldChange: <K extends keyof PersonalInfoFormState>(key: K, value: PersonalInfoFormState[K]) => void;
  personalInputClass: string;
  personalSelectClass: string;
}

export function PersonalInfoTab({
  isEditingPersonal,
  personalInfoForm,
  onStartEdit,
  onCancelEdit,
  onSave,
  onFieldChange,
  personalInputClass,
  personalSelectClass,
}: PersonalInfoTabProps): React.ReactNode {
  return (
    <div className="space-y-6">
      {!isEditingPersonal ? (
        <>
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Employee Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { label: 'Employee No.', value: personalInfoForm.employeeNo || '-' },
                { label: 'First Name', value: personalInfoForm.firstName },
                { label: 'Last Name', value: personalInfoForm.lastName },
                { label: 'Department', value: personalInfoForm.department },
                { label: 'Position', value: personalInfoForm.position },
                { label: 'Phone', value: personalInfoForm.phone },
                { label: 'Hire Date', value: personalInfoForm.hireDate },
                { label: 'Employment Type', value: personalInfoForm.employmentType },
                { label: 'Employment Status', value: personalInfoForm.employmentStatus },
                { label: 'Birth Date', value: personalInfoForm.birthDate },
                { label: 'Gender', value: personalInfoForm.gender },
                { label: 'Email', value: personalInfoForm.email },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{field.label}</p>
                  <p className="text-sm font-medium text-foreground">{field.value}</p>
                </div>
              ))}
              <div className="md:col-span-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Address</p>
                <p className="text-sm font-medium text-foreground">{personalInfoForm.address}</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onStartEdit} className="gap-2">
              Edit Employee Info
            </Button>
          </div>
        </>
      ) : (
        <>
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Edit Employee Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee No.</label>
                <input
                  type="text"
                  className={personalInputClass}
                  value={personalInfoForm.employeeNo}
                  onChange={(event) => onFieldChange('employeeNo', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
                <input
                  type="text"
                  className={personalInputClass}
                  value={personalInfoForm.firstName}
                  onChange={(event) => onFieldChange('firstName', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
                <input
                  type="text"
                  className={personalInputClass}
                  value={personalInfoForm.lastName}
                  onChange={(event) => onFieldChange('lastName', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
                <input
                  type="text"
                  className={personalInputClass}
                  value={personalInfoForm.department}
                  onChange={(event) => onFieldChange('department', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position</label>
                <input
                  type="text"
                  className={personalInputClass}
                  value={personalInfoForm.position}
                  onChange={(event) => onFieldChange('position', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
                <input
                  type="text"
                  className={personalInputClass}
                  value={personalInfoForm.phone}
                  onChange={(event) => onFieldChange('phone', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hire Date</label>
                <input
                  type="date"
                  className={personalInputClass}
                  value={personalInfoForm.hireDate}
                  onChange={(event) => onFieldChange('hireDate', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Type</label>
                <select
                  className={personalSelectClass}
                  value={personalInfoForm.employmentType}
                  onChange={(event) => onFieldChange('employmentType', event.target.value as EmploymentTypeOption)}
                >
                  <option value="Regular">Regular</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Project Based">Project Based</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Status</label>
                <select
                  className={personalSelectClass}
                  value={personalInfoForm.employmentStatus}
                  onChange={(event) => onFieldChange('employmentStatus', event.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Resigned">Resigned</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Probationary">Probationary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Birth Date</label>
                <input
                  type="date"
                  className={personalInputClass}
                  value={personalInfoForm.birthDate}
                  onChange={(event) => onFieldChange('birthDate', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Gender</label>
                <input
                  type="text"
                  className={personalInputClass}
                  value={personalInfoForm.gender}
                  onChange={(event) => onFieldChange('gender', event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  className={personalInputClass}
                  value={personalInfoForm.email}
                  onChange={(event) => onFieldChange('email', event.target.value)}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Address</label>
                <input
                  type="text"
                  className={personalInputClass}
                  value={personalInfoForm.address}
                  onChange={(event) => onFieldChange('address', event.target.value)}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancelEdit} className="gap-2">
              <X size={14} /> Cancel
            </Button>
            <Button onClick={onSave} className="gap-2">
              <Save size={14} /> Save Changes
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
