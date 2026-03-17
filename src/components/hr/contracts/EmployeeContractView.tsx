// src/components/hr/contracts/EmployeeContractView.tsx
'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, User, FileText, DollarSign, FolderOpen, Paperclip, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { Employee } from '@/lib/mock-hr-data';
import { ContractDetailsTab } from './ContractDetailsTab';
import { SalaryInformationTab } from './SalaryInformationTab';
import { PersonalDocumentsTab } from './PersonalDocumentsTab';
import { SalaryAttachmentTab } from './SalaryAttachmentTab';
import { GovernmentComplianceTab } from './GovernmentComplianceTab';

type ContractTab = 'info' | 'details' | 'salary' | 'documents' | 'attachment' | 'government-compliance';

const TABS: { key: ContractTab; label: string; icon: typeof FileText }[] = [
  { key: 'info', label: 'Employee Information', icon: User },
  { key: 'government-compliance', label: 'Government Compliance', icon: Landmark },
  { key: 'details', label: 'Contract Details', icon: FileText },
  { key: 'salary', label: 'Salary Information', icon: DollarSign },
  { key: 'documents', label: 'Personal Documents', icon: FolderOpen },
  { key: 'attachment', label: 'Attachment of Salary', icon: Paperclip },
];

type ContractType = 'Permanent' | 'Probationary' | 'Project-Based' | 'Contractual';
type SalaryStructureType = 'Regular Employee' | 'Managerial' | 'Supervisory' | 'Contractual';
type WorkingSchedule = 'Standard (Mon-Fri)' | 'Shifting' | 'Flexible' | 'Compressed';

interface ContractFormData {
  contractType: ContractType;
  salaryStructureType: SalaryStructureType;
  startDate: string;
  firstContractDate: string;
  endDate: string;
  workingSchedule: WorkingSchedule;
  hrResponsible: string;
  analyticAccount: string;
}

interface EmployeeInfoFormData {
  fullName: string;
  employeeNo: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  dateHired: string;
  status: string;
  sssNo: string;
  philHealthNo: string;
  pagIbigNo: string;
  tinNo: string;
}

function getContractDefaults(employee: Employee): ContractFormData {
  return {
    contractType: employee.status === 'Probationary' ? 'Probationary' : 'Permanent',
    salaryStructureType: 'Regular Employee',
    startDate: employee.dateHired,
    firstContractDate: employee.dateHired,
    endDate: '',
    workingSchedule: 'Standard (Mon-Fri)',
    hrResponsible: 'Rosa Mendoza',
    analyticAccount: employee.department,
  };
}

const inputClass = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500';
const selectClass = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  Active: 'success',
  'On Leave': 'info',
  Probationary: 'warning',
  Resigned: 'danger',
};

interface EmployeeContractViewProps {
  employee: Employee;
}

export function EmployeeContractView({ employee }: EmployeeContractViewProps) {
  const router = useRouter();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<ContractTab>('info');
  const [isInfoEditing, setIsInfoEditing] = useState(false);
  const [form, setForm] = useState<ContractFormData>(() => getContractDefaults(employee));
  const [savedEmpInfo, setSavedEmpInfo] = useState<EmployeeInfoFormData>({
    fullName: employee.fullName,
    employeeNo: employee.employeeNo,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    position: employee.position,
    dateHired: employee.dateHired,
    status: employee.status,
    sssNo: employee.sssNo,
    philHealthNo: employee.philHealthNo,
    pagIbigNo: employee.pagIbigNo,
    tinNo: employee.tinNo,
  });
  const [empInfo, setEmpInfo] = useState<EmployeeInfoFormData>(savedEmpInfo);

  const _updateField = <K extends keyof ContractFormData>(key: K, value: ContractFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateEmpInfo = <K extends keyof EmployeeInfoFormData>(key: K, value: EmployeeInfoFormData[K]) => {
    setEmpInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleInfoSave = () => {
    setSavedEmpInfo(empInfo);
    setIsInfoEditing(false);
    success('Employee information updated', 'Employee information has been saved successfully.');
  };

  const handleInfoCancel = () => {
    setEmpInfo(savedEmpInfo);
    setIsInfoEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/portal/hr/employee-management')} className="p-2 h-auto">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-foreground">Employee Information</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {employee.fullName} — {employee.employeeNo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[employee.status] ?? 'neutral'} className="text-xs">
            {employee.status}
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Employee Information
            </p>
            {!isInfoEditing ? (
              <Button variant="outline" onClick={() => setIsInfoEditing(true)}>
                Edit
              </Button>
            ) : (
              <Button variant="outline" onClick={handleInfoCancel}>
                Cancel
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name</label>
              <input type="text" className={inputClass} value={empInfo.fullName} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('fullName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee No.</label>
              <input type="text" className={inputClass} value={empInfo.employeeNo} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('employeeNo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
              <input type="email" className={inputClass} value={empInfo.email} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
              <input type="tel" className={inputClass} value={empInfo.phone} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
              <input type="text" className={inputClass} value={empInfo.department} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('department', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position</label>
              <input type="text" className={inputClass} value={empInfo.position} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('position', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date Hired</label>
              <input type="date" className={inputClass} value={empInfo.dateHired} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('dateHired', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status</label>
              <select className={selectClass} value={empInfo.status} disabled={!isInfoEditing} onChange={e => updateEmpInfo('status', e.target.value)}>
                <option>Active</option>
                <option>On Leave</option>
                <option>Probationary</option>
                <option>Resigned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">SSS No.</label>
              <input type="text" className={inputClass} value={empInfo.sssNo} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('sssNo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">PhilHealth No.</label>
              <input type="text" className={inputClass} value={empInfo.philHealthNo} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('philHealthNo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pag-IBIG No.</label>
              <input type="text" className={inputClass} value={empInfo.pagIbigNo} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('pagIbigNo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">TIN No.</label>
              <input type="text" className={inputClass} value={empInfo.tinNo} readOnly={!isInfoEditing} onChange={e => updateEmpInfo('tinNo', e.target.value)} />
            </div>
          </div>
        </Card>
      )}
      {activeTab === 'details' && <ContractDetailsTab />}
      {activeTab === 'government-compliance' && <GovernmentComplianceTab employee={employee} />}
      {activeTab === 'salary' && <SalaryInformationTab baseSalary={employee.salary} />}
      {activeTab === 'documents' && <PersonalDocumentsTab />}
      {activeTab === 'attachment' && <SalaryAttachmentTab />}

      {activeTab === 'info' && isInfoEditing && (
        <div className="flex justify-end">
          <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={handleInfoSave}>
            <Save size={16} /> Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
