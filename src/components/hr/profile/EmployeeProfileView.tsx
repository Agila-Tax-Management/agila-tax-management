// src/components/hr/profile/EmployeeProfileView.tsx
'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  FileText,
  FolderOpen,
  IdCard,
  Landmark,
  Plus,
  Save,
  Shield,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { Employee } from '@/lib/mock-hr-data';

type ProfileTab = 'personal' | 'government-ids' | 'documents' | 'employment' | 'contracts' | 'app-access';

type AppAccessKey = 'sales' | 'compliance' | 'liaison' | 'accounting' | 'accountOfficer' | 'hr' | 'taskManagement';

type EmploymentTypeOption = 'Regular' | 'Probationary' | 'Contractual' | 'Project Based' | 'Part Time' | 'Intern';
type ContractTypeOption = 'Probationary' | 'Regular' | 'Contractual' | 'Project Based' | 'Consultant' | 'Intern';
type PayMethodOption = 'Cash Salary' | 'Fund Transfer';

interface GovernmentIdsState {
  sss: string;
  pagibig: string;
  philhealth: string;
  tin: string;
}

interface EmploymentRecord {
  id: string;
  client: string;
  department: string;
  position: string;
  team: string;
  employeeLevel: string;
  employmentType: EmploymentTypeOption;
  hireDate: string;
  regularizationDate: string;
  reportingManager: string;
  status: 'Active' | 'Completed';
}

interface EmploymentFormState {
  client: string;
  department: string;
  position: string;
  team: string;
  employeeLevel: string;
  employmentType: EmploymentTypeOption;
  hireDate: string;
  regularizationDate: string;
  reportingManager: string;
}

interface ContractRecord {
  id: string;
  employmentId: string;
  contractType: ContractTypeOption;
  startDate: string;
  endDate: string;
  salary: string;
  payMethod: PayMethodOption;
  workHours: string;
  notes: string;
  status: 'Active' | 'Draft';
}

interface ContractFormState {
  employmentId: string;
  contractType: ContractTypeOption;
  startDate: string;
  endDate: string;
  salary: string;
  payMethod: PayMethodOption;
  workHours: string;
  notes: string;
}

interface AppAccessState {
  sales: boolean;
  compliance: boolean;
  liaison: boolean;
  accounting: boolean;
  accountOfficer: boolean;
  hr: boolean;
  taskManagement: boolean;
}

const TABS: { key: ProfileTab; label: string; icon: typeof User }[] = [
  { key: 'personal', label: 'Personal Information', icon: User },
  { key: 'government-ids', label: 'Government IDs', icon: IdCard },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
  { key: 'employment', label: 'Employment', icon: Briefcase },
  { key: 'contracts', label: 'Contracts', icon: FileText },
  { key: 'app-access', label: 'App Access', icon: Shield },
];

const DOCUMENT_LABELS = [
  'Resume',
  'Birth Certificate',
  'Valid ID',
  'NBI Clearance',
  'Barangay Clearance',
  'Medical Results',
  'Bank QR',
] as const;

type DocumentLabel = (typeof DOCUMENT_LABELS)[number];

type DocumentState = Record<DocumentLabel, string | null>;

const DEPARTMENT_OPTIONS = ['Accounting', 'Sales', 'Compliance', 'Liaison', 'Account Officer', 'HR', 'IT', 'Admin'];
const TEAM_OPTIONS = ['Tax Team', 'Payroll Team', 'Client Services', 'Field Ops', 'Finance Team', 'Recruitment Team'];
const LEVEL_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7'];
const REPORTING_MANAGER_OPTIONS = ['Maria Santos', 'Juan Dela Cruz', 'Patricia Lim', 'Ana Reyes', 'Carlos Garcia'];
const CLIENT_OPTIONS = ['Internal Company', 'Agila Tax Management', 'Agila Business Support', 'Agila Corporate Services'];

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  Active: 'success',
  'On Leave': 'info',
  Probationary: 'warning',
  Resigned: 'danger',
  Draft: 'warning',
  Completed: 'info',
};

const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30';
const selectClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';

interface EmployeeProfileViewProps {
  employee: Employee;
}

export function EmployeeProfileView({ employee }: EmployeeProfileViewProps): React.ReactNode {
  const router = useRouter();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [governmentIds, setGovernmentIds] = useState<GovernmentIdsState>({
    sss: employee.sssNo,
    pagibig: employee.pagIbigNo,
    philhealth: employee.philHealthNo,
    tin: employee.tinNo,
  });
  const [documents, setDocuments] = useState<DocumentState>({
    Resume: 'resume_roberto_villanueva.pdf',
    'Birth Certificate': 'birth_certificate_roberto.pdf',
    'Valid ID': 'drivers_license_roberto.jpg',
    'NBI Clearance': null,
    'Barangay Clearance': null,
    'Medical Results': 'medical_results_2026.pdf',
    'Bank QR': 'bank_qr_bdo.png',
  });
  const [employmentForm, setEmploymentForm] = useState<EmploymentFormState>({
    client: 'Internal Company',
    department: employee.department,
    position: employee.position,
    team: 'Tax Team',
    employeeLevel: 'Level 7',
    employmentType: employee.status === 'Probationary' ? 'Probationary' : 'Regular',
    hireDate: employee.dateHired,
    regularizationDate: '2026-07-15',
    reportingManager: 'Maria Santos',
  });
  const [employmentRecords, setEmploymentRecords] = useState<EmploymentRecord[]>([
    {
      id: 'employment-1',
      client: 'Internal Company',
      department: employee.department,
      position: employee.position,
      team: 'Tax Team',
      employeeLevel: 'Level 7',
      employmentType: employee.status === 'Probationary' ? 'Probationary' : 'Regular',
      hireDate: employee.dateHired,
      regularizationDate: '2026-07-15',
      reportingManager: 'Maria Santos',
      status: 'Active',
    },
  ]);
  const [contractForm, setContractForm] = useState<ContractFormState>({
    employmentId: 'employment-1',
    contractType: 'Probationary',
    startDate: employee.dateHired,
    endDate: '2026-07-15',
    salary: String(employee.salary),
    payMethod: 'Fund Transfer',
    workHours: '40 per week',
    notes: 'Probationary period for 6 months.',
  });
  const [contracts, setContracts] = useState<ContractRecord[]>([
    {
      id: 'contract-1',
      employmentId: 'employment-1',
      contractType: 'Probationary',
      startDate: employee.dateHired,
      endDate: '2026-07-15',
      salary: String(employee.salary),
      payMethod: 'Fund Transfer',
      workHours: '40 per week',
      notes: 'Probationary period for 6 months.',
      status: 'Active',
    },
  ]);
  const [appAccess, setAppAccess] = useState<AppAccessState>({
    sales: false,
    compliance: false,
    liaison: false,
    accounting: employee.department === 'Accounting',
    accountOfficer: employee.department === 'Account Officer',
    hr: employee.department === 'HR',
    taskManagement: true,
  });

  const updateGovernmentId = <K extends keyof GovernmentIdsState>(key: K, value: GovernmentIdsState[K]) => {
    setGovernmentIds((prev) => ({ ...prev, [key]: value }));
  };

  const updateEmploymentForm = <K extends keyof EmploymentFormState>(key: K, value: EmploymentFormState[K]) => {
    setEmploymentForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateContractForm = <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setContractForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveGovernmentIds = () => {
    success('Government IDs saved', 'Government ID information has been updated.');
  };

  const handleDocumentUpload = (label: DocumentLabel) => {
    setDocuments((prev) => ({
      ...prev,
      [label]: `${label.toLowerCase().replace(/ /g, '_')}_upload.pdf`,
    }));
    success('Document uploaded', `${label} has been uploaded.`);
  };

  const handleAddEmployment = () => {
    if (!employmentForm.client || !employmentForm.department || !employmentForm.position || !employmentForm.hireDate) {
      error('Failed to save employment', 'Please complete the employment form.');
      return;
    }

    const nextRecord: EmploymentRecord = {
      id: crypto.randomUUID(),
      ...employmentForm,
      status: 'Active',
    };

    setEmploymentRecords((prev) => [nextRecord, ...prev]);
    setContractForm((prev) => ({ ...prev, employmentId: nextRecord.id }));
    success('Employment added', 'Employment history has been updated.');
  };

  const handleSaveContract = () => {
    if (!contractForm.employmentId || !contractForm.contractType || !contractForm.startDate || !contractForm.salary) {
      error('Failed to save contract', 'Please complete the contract form.');
      return;
    }

    const nextContract: ContractRecord = {
      id: crypto.randomUUID(),
      ...contractForm,
      status: 'Active',
    };

    setContracts((prev) => [nextContract, ...prev]);
    success('Contract saved', 'Employee contract has been added.');
  };

  const toggleAppAccess = (key: AppAccessKey) => {
    setAppAccess((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const accessItems: Array<{ key: AppAccessKey; label: string; description: string }> = [
    { key: 'sales', label: 'Sales Portal', description: 'Leads, plans, and commission workflows.' },
    { key: 'compliance', label: 'Compliance Portal', description: 'Tax and regulatory task management.' },
    { key: 'liaison', label: 'Liaison Portal', description: 'Agency schedules and field assignments.' },
    { key: 'accounting', label: 'Accounting Portal', description: 'Billing, invoices, and payments.' },
    { key: 'accountOfficer', label: 'Account Officer Portal', description: 'Client relationship workflows.' },
    { key: 'hr', label: 'HR Portal', description: 'Employee administration and internal HR tasks.' },
    { key: 'taskManagement', label: 'Task Management Portal', description: 'Cross-team task visibility and updates.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/portal/hr/employee-management')} className="p-2 h-auto">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-foreground">Employee Profile</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {employee.fullName} — {employee.employeeNo}
            </p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[employee.status] ?? 'neutral'} className="text-xs">
          {employee.status}
        </Badge>
      </div>

      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-black shrink-0">
            {employee.avatar}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Department</p>
              <p className="text-sm font-bold text-foreground mt-1">{employee.department}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Position</p>
              <p className="text-sm font-bold text-foreground mt-1">{employee.position}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
              <p className="text-sm font-bold text-foreground mt-1">{employee.email}</p>
            </div>
          </div>
        </div>
      </Card>

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

      {activeTab === 'personal' && (
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">First Name</p>
              <p className="text-sm font-semibold text-foreground mt-1">{employee.firstName}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Last Name</p>
              <p className="text-sm font-semibold text-foreground mt-1">{employee.lastName}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Employee No</p>
              <p className="text-sm font-semibold text-foreground mt-1">{employee.employeeNo}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Birth Date</p>
              <p className="text-sm font-semibold text-foreground mt-1">1998-04-16</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Gender</p>
              <p className="text-sm font-semibold text-foreground mt-1">Male</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Phone</p>
              <p className="text-sm font-semibold text-foreground mt-1">{employee.phone}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Address</p>
              <p className="text-sm font-semibold text-foreground mt-1">Cebu City, Philippines</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
              <p className="text-sm font-semibold text-foreground mt-1">{employee.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Date Hired</p>
              <p className="text-sm font-semibold text-foreground mt-1">{employee.dateHired}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Current Status</p>
              <Badge variant={STATUS_VARIANT[employee.status] ?? 'neutral'} className="mt-1">{employee.status}</Badge>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'government-ids' && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-black text-foreground">Government IDs</h2>
            <p className="text-sm text-muted-foreground mt-1">Maintain employee statutory registration information.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">SSS</label>
              <input type="text" className={inputClass} value={governmentIds.sss} onChange={(event) => updateGovernmentId('sss', event.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">PagIBIG</label>
              <input type="text" className={inputClass} value={governmentIds.pagibig} onChange={(event) => updateGovernmentId('pagibig', event.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">PhilHealth</label>
              <input type="text" className={inputClass} value={governmentIds.philhealth} onChange={(event) => updateGovernmentId('philhealth', event.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">TIN</label>
              <input type="text" className={inputClass} value={governmentIds.tin} onChange={(event) => updateGovernmentId('tin', event.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={handleSaveGovernmentIds}>
              <Save size={16} /> Save
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-black text-foreground">Documents</h2>
            <p className="text-sm text-muted-foreground mt-1">Track required employee requirements and uploads.</p>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {DOCUMENT_LABELS.map((label) => (
              <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 bg-background">
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {documents[label] ? documents[label] : 'No file uploaded'}
                  </p>
                </div>
                <Button variant="outline" onClick={() => handleDocumentUpload(label)}>
                  {documents[label] ? 'Replace' : 'Upload'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'employment' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-foreground">Employment</h2>
                <p className="text-sm text-muted-foreground mt-1">Create and maintain employee job assignments.</p>
              </div>
              <Badge variant="info">Add Employment</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Client</label>
                <select className={selectClass} value={employmentForm.client} onChange={(event) => updateEmploymentForm('client', event.target.value)}>
                  {CLIENT_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
                <select className={selectClass} value={employmentForm.department} onChange={(event) => updateEmploymentForm('department', event.target.value)}>
                  {DEPARTMENT_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position</label>
                <input type="text" className={inputClass} value={employmentForm.position} onChange={(event) => updateEmploymentForm('position', event.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Team</label>
                <select className={selectClass} value={employmentForm.team} onChange={(event) => updateEmploymentForm('team', event.target.value)}>
                  {TEAM_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee Level</label>
                <select className={selectClass} value={employmentForm.employeeLevel} onChange={(event) => updateEmploymentForm('employeeLevel', event.target.value)}>
                  {LEVEL_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Type</label>
                <select className={selectClass} value={employmentForm.employmentType} onChange={(event) => updateEmploymentForm('employmentType', event.target.value as EmploymentTypeOption)}>
                  <option>Regular</option>
                  <option>Probationary</option>
                  <option>Contractual</option>
                  <option>Project Based</option>
                  <option>Part Time</option>
                  <option>Intern</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hire Date</label>
                <input type="date" className={inputClass} value={employmentForm.hireDate} onChange={(event) => updateEmploymentForm('hireDate', event.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Regularization Date</label>
                <input type="date" className={inputClass} value={employmentForm.regularizationDate} onChange={(event) => updateEmploymentForm('regularizationDate', event.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Reporting Manager</label>
                <select className={selectClass} value={employmentForm.reportingManager} onChange={(event) => updateEmploymentForm('reportingManager', event.target.value)}>
                  {REPORTING_MANAGER_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={handleAddEmployment}>
                <Plus size={16} /> Save
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Employment History</h3>
            <div className="space-y-3">
              {employmentRecords.map((record) => (
                <div key={record.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{record.position}</p>
                      <p className="text-sm text-muted-foreground mt-1">{record.department} Department</p>
                      <p className="text-xs text-muted-foreground mt-1">{record.hireDate} – Present</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[record.status] ?? 'neutral'}>{record.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-foreground">Contracts</h2>
                <p className="text-sm text-muted-foreground mt-1">Maintain legal agreement records for the selected employment.</p>
              </div>
              <Badge variant="warning">Add Contract</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Record</label>
                <select className={selectClass} value={contractForm.employmentId} onChange={(event) => updateContractForm('employmentId', event.target.value)}>
                  {employmentRecords.map((record) => (
                    <option key={record.id} value={record.id}>{record.position} · {record.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contract Type</label>
                <select className={selectClass} value={contractForm.contractType} onChange={(event) => updateContractForm('contractType', event.target.value as ContractTypeOption)}>
                  <option>Probationary</option>
                  <option>Regular</option>
                  <option>Contractual</option>
                  <option>Project Based</option>
                  <option>Consultant</option>
                  <option>Intern</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Start Date</label>
                <input type="date" className={inputClass} value={contractForm.startDate} onChange={(event) => updateContractForm('startDate', event.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">End Date</label>
                <input type="date" className={inputClass} value={contractForm.endDate} onChange={(event) => updateContractForm('endDate', event.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Salary (Monthly)</label>
                <input type="text" className={inputClass} value={contractForm.salary} onChange={(event) => updateContractForm('salary', event.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pay Method</label>
                <select className={selectClass} value={contractForm.payMethod} onChange={(event) => updateContractForm('payMethod', event.target.value as PayMethodOption)}>
                  <option>Cash Salary</option>
                  <option>Fund Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Working Hours</label>
                <input type="text" className={inputClass} value={contractForm.workHours} onChange={(event) => updateContractForm('workHours', event.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes</label>
                <textarea
                  className={`${inputClass} min-h-28 resize-none`}
                  value={contractForm.notes}
                  onChange={(event) => updateContractForm('notes', event.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={handleSaveContract}>
                <Save size={16} /> Save Contract
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Contract Records</h3>
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div key={contract.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{contract.contractType}</p>
                      <p className="text-xs text-muted-foreground mt-1">{contract.startDate} – {contract.endDate || 'Open-ended'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Salary: {contract.salary} · {contract.payMethod} · {contract.workHours}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[contract.status] ?? 'neutral'}>{contract.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'app-access' && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-black text-foreground">App Access</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage application access for this employee profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accessItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleAppAccess(item.key)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  appAccess[item.key]
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-border bg-background text-foreground hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs mt-1 opacity-80">{item.description}</p>
                  </div>
                  <Badge variant={appAccess[item.key] ? 'success' : 'neutral'}>
                    {appAccess[item.key] ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => success('App access updated', 'Application access settings have been saved.')}>
              <Landmark size={16} /> Save Access
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
