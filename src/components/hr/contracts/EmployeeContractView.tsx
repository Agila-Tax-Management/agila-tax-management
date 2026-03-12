// src/components/hr/contracts/EmployeeContractView.tsx
'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, User, FileText, DollarSign, FolderOpen, Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Employee } from '@/lib/mock-hr-data';
import { ContractDetailsTab } from './ContractDetailsTab';
import { SalaryInformationTab } from './SalaryInformationTab';
import { PersonalDocumentsTab } from './PersonalDocumentsTab';
import { SalaryAttachmentTab } from './SalaryAttachmentTab';

type ContractTab = 'info' | 'details' | 'salary' | 'documents' | 'attachment';

const TABS: { key: ContractTab; label: string; icon: typeof FileText }[] = [
  { key: 'info', label: 'Employee Information', icon: User },
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
  const [activeTab, setActiveTab] = useState<ContractTab>('info');
  const [form, setForm] = useState<ContractFormData>(() => getContractDefaults(employee));
  const [empInfo, setEmpInfo] = useState<EmployeeInfoFormData>({
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

  const updateField = <K extends keyof ContractFormData>(key: K, value: ContractFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateEmpInfo = <K extends keyof EmployeeInfoFormData>(key: K, value: EmployeeInfoFormData[K]) => {
    setEmpInfo(prev => ({ ...prev, [key]: value }));
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
            <h1 className="text-2xl font-black text-foreground">Employee Contract</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {employee.fullName} — {employee.employeeNo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[employee.status] ?? 'neutral'} className="text-xs">
            {employee.status}
          </Badge>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </div>

      {/* Header Form — Two-Column (Read-Only) */}
      <Card className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={employee.fullName} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={employee.department} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Job Position</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={employee.position} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Company</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value="Agila Tax Consulting" readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contract Type</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={form.contractType} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Salary Structure Type</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={form.salaryStructureType} readOnly />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Start Date</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={form.startDate} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Contract Date</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={form.firstContractDate} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">End Date</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={form.endDate || 'No end date (permanent)'} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Working Schedule</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={form.workingSchedule} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">HR Responsible</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={form.hrResponsible} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Analytic Account</label>
              <input type="text" className={`${inputClass} bg-muted cursor-not-allowed`} value={form.analyticAccount} readOnly />
            </div>
          </div>
        </div>
      </Card>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name</label>
              <input type="text" className={inputClass} value={empInfo.fullName} onChange={e => updateEmpInfo('fullName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee No.</label>
              <input type="text" className={inputClass} value={empInfo.employeeNo} onChange={e => updateEmpInfo('employeeNo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
              <input type="email" className={inputClass} value={empInfo.email} onChange={e => updateEmpInfo('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
              <input type="tel" className={inputClass} value={empInfo.phone} onChange={e => updateEmpInfo('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
              <input type="text" className={inputClass} value={empInfo.department} onChange={e => updateEmpInfo('department', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position</label>
              <input type="text" className={inputClass} value={empInfo.position} onChange={e => updateEmpInfo('position', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date Hired</label>
              <input type="date" className={inputClass} value={empInfo.dateHired} onChange={e => updateEmpInfo('dateHired', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status</label>
              <select className={selectClass} value={empInfo.status} onChange={e => updateEmpInfo('status', e.target.value)}>
                <option>Active</option>
                <option>On Leave</option>
                <option>Probationary</option>
                <option>Resigned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">SSS No.</label>
              <input type="text" className={inputClass} value={empInfo.sssNo} onChange={e => updateEmpInfo('sssNo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">PhilHealth No.</label>
              <input type="text" className={inputClass} value={empInfo.philHealthNo} onChange={e => updateEmpInfo('philHealthNo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pag-IBIG No.</label>
              <input type="text" className={inputClass} value={empInfo.pagIbigNo} onChange={e => updateEmpInfo('pagIbigNo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">TIN No.</label>
              <input type="text" className={inputClass} value={empInfo.tinNo} onChange={e => updateEmpInfo('tinNo', e.target.value)} />
            </div>
          </div>
        </Card>
      )}
      {activeTab === 'details' && <ContractDetailsTab />}
      {activeTab === 'salary' && <SalaryInformationTab baseSalary={employee.salary} />}
      {activeTab === 'documents' && <PersonalDocumentsTab />}
      {activeTab === 'attachment' && <SalaryAttachmentTab />}
    </div>
  );
}
