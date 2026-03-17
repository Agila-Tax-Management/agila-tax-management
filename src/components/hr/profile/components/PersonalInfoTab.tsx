// src/components/hr/profile/components/PersonalInfoTab.tsx
'use client';

import React from 'react';
import { Save, X } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import type { PersonalInfoFormState } from '../profile-types';

interface PersonalInfoTabProps {
  isEditingPersonal: boolean;
  personalInfoForm: PersonalInfoFormState;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onFieldChange: <K extends keyof PersonalInfoFormState>(key: K, value: PersonalInfoFormState[K]) => void;
  personalInputClass: string;
  personalSelectClass: string;
  disabled?: boolean;
}

const GENDER_OPTIONS = ['Male', 'Female'];
const CIVIL_STATUS_OPTIONS = ['Single', 'Married', 'Widowed', 'Legally Separated'];

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
  disabled,
}: PersonalInfoTabProps): React.ReactNode {
  // ── Employment card (always read-only) ───────────────────────────
  const employmentCard = (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Employment Information</h3>
        <Badge variant="neutral" className="text-xs">Read Only</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Employee No.', value: personalInfoForm.employeeNo || '—' },
          { label: 'Department', value: personalInfoForm.department || '—' },
          { label: 'Position', value: personalInfoForm.position || '—' },
          { label: 'Hire Date', value: formatDate(personalInfoForm.hireDate) },
          { label: 'Employment Type', value: personalInfoForm.employmentType || '—' },
        ].map((field) => (
          <div key={field.label}>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{field.label}</p>
            <p className="text-sm font-medium text-foreground">{field.value}</p>
          </div>
        ))}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Employment Status</p>
          <Badge variant="success" className="text-xs">{personalInfoForm.employmentStatus || '—'}</Badge>
        </div>
      </div>
    </Card>
  );

  // ── View mode ────────────────────────────────────────────────────
  if (!isEditingPersonal) {
    return (
      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">First Name</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.firstName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Middle Name</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.middleName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Last Name</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.lastName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Name Extension</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.nameExtension || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Date of Birth</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.birthDate || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Place of Birth</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.placeOfBirth || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Gender</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.gender || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Civil Status</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.civilStatus || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Contact Number</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Personal Email</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.personalEmail || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Email (System)</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.email || '—'}</p>
            </div>
          </div>
        </Card>

        {/* Employment Information */}
        {employmentCard}

        {/* Address Information */}
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Address Information</h3>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Address</p>
            <p className="text-sm font-medium text-foreground">{personalInfoForm.address || '—'}</p>
          </div>
        </Card>

        {/* Educational Background */}
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Educational Background</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Highest Educational Attainment</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.educationalBackground || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">School / University</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.school || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Course / Degree</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.course || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Year Last Attended / Graduated</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.yearGraduated || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Certifications / Licenses</p>
              <p className="text-sm font-medium text-foreground">{personalInfoForm.certifications || '—'}</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onStartEdit} className="gap-2">
            Edit Employee Info
          </Button>
        </div>
      </div>
    );
  }

  // ── Edit mode ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Edit Personal Information */}
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.firstName}
              onChange={(e) => onFieldChange('firstName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Middle Name</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.middleName}
              onChange={(e) => onFieldChange('middleName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.lastName}
              onChange={(e) => onFieldChange('lastName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Name Extension <span className="font-normal text-muted-foreground">(e.g. Jr., Sr.)</span></label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.nameExtension}
              placeholder="Jr., Sr., III..."
              onChange={(e) => onFieldChange('nameExtension', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date of Birth</label>
            <input
              type="date"
              className={personalInputClass}
              value={personalInfoForm.birthDate}
              onChange={(e) => onFieldChange('birthDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Place of Birth</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.placeOfBirth}
              onChange={(e) => onFieldChange('placeOfBirth', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Gender</label>
            <select
              className={personalSelectClass}
              value={personalInfoForm.gender}
              onChange={(e) => onFieldChange('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Civil Status</label>
            <select
              className={personalSelectClass}
              value={personalInfoForm.civilStatus}
              onChange={(e) => onFieldChange('civilStatus', e.target.value)}
            >
              <option value="">Select civil status</option>
              {CIVIL_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contact Number</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Personal Email</label>
            <input
              type="email"
              className={personalInputClass}
              value={personalInfoForm.personalEmail}
              onChange={(e) => onFieldChange('personalEmail', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email (System)</label>
            <div className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground select-none">
              {personalInfoForm.email || '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* Employment — always read-only */}
      {employmentCard}

      {/* Edit Address Information */}
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Address Information</h3>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Address</label>
          <input
            type="text"
            className={personalInputClass}
            value={personalInfoForm.address}
            onChange={(e) => onFieldChange('address', e.target.value)}
          />
        </div>
      </Card>

      {/* Edit Educational Background */}
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Educational Background</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Highest Educational Attainment</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.educationalBackground}
              placeholder="e.g. Bachelor's Degree"
              onChange={(e) => onFieldChange('educationalBackground', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">School / University</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.school}
              onChange={(e) => onFieldChange('school', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Course / Degree</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.course}
              onChange={(e) => onFieldChange('course', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Year Last Attended / Graduated</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.yearGraduated}
              placeholder="e.g. 2020"
              onChange={(e) => onFieldChange('yearGraduated', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Certifications / Licenses</label>
            <input
              type="text"
              className={personalInputClass}
              value={personalInfoForm.certifications}
              placeholder="e.g. CPA, TESDA NC II..."
              onChange={(e) => onFieldChange('certifications', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancelEdit} className="gap-2">
          <X size={14} /> Cancel
        </Button>
        <Button onClick={onSave} disabled={disabled} className="gap-2">
          <Save size={14} /> Save Changes
        </Button>
      </div>
    </div>
  );
}
