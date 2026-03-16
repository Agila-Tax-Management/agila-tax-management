// src/components/hr/profile/EmployeeProfileView.tsx
'use client';

import React, { useState } from 'react';
import { ArrowLeft, Briefcase, FileText, FolderOpen, IdCard, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { Employee } from '@/lib/mock-hr-data';
import { AppAccessTab } from './components/AppAccessTab';
import { ContractsTab } from './components/ContractsTab';
import { DocumentsTab } from './components/DocumentsTab';
import { EmploymentTab } from './components/EmploymentTab';
import { GovernmentIdsTab } from './components/GovernmentIdsTab';
import { PersonalInfoTab } from './components/PersonalInfoTab';
import type {
  AppAccessKey,
  AppAccessState,
  ContractFormState,
  ContractRecord,
  DocumentLabel,
  DocumentState,
  EmploymentFormState,
  EmploymentRecord,
  EmploymentTypeOption,
  GovernmentIdsState,
  PersonalInfoFormState,
  ProfileTab,
} from './profile-types';

const TABS: { key: ProfileTab; label: string; icon: typeof User }[] = [
  { key: 'personal', label: 'Personal Information', icon: User },
  { key: 'government-ids', label: 'Government IDs', icon: IdCard },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
  { key: 'employment', label: 'Employment', icon: Briefcase },
  { key: 'contracts', label: 'Contracts', icon: FileText },
  { key: 'app-access', label: 'App Access', icon: Shield },
];

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

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30';
const selectClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';
const personalInputClass =
  'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
const personalSelectClass =
  'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none';

interface EmployeeProfileViewProps {
  employee: Employee;
}

export function EmployeeProfileView({ employee }: EmployeeProfileViewProps): React.ReactNode {
  const router = useRouter();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalInfoForm, setPersonalInfoForm] = useState<PersonalInfoFormState>({
    employeeNo: employee.employeeNo,
    firstName: employee.firstName,
    lastName: employee.lastName,
    department: employee.department,
    position: employee.position,
    phone: employee.phone,
    hireDate: employee.dateHired,
    employmentType: employee.status === 'Probationary' ? 'Probationary' : 'Regular',
    employmentStatus: employee.status,
    birthDate: '1998-04-16',
    gender: 'Male',
    address: 'Cebu City, Philippines',
    email: employee.email,
  });
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

  const updatePersonalInfoForm = <K extends keyof PersonalInfoFormState>(key: K, value: PersonalInfoFormState[K]) => {
    setPersonalInfoForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetPersonalInfoForm = () => {
    setPersonalInfoForm({
      employeeNo: employee.employeeNo,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
      position: employee.position,
      phone: employee.phone,
      hireDate: employee.dateHired,
      employmentType: employee.status === 'Probationary' ? 'Probationary' : 'Regular',
      employmentStatus: employee.status,
      birthDate: '1998-04-16',
      gender: 'Male',
      address: 'Cebu City, Philippines',
      email: employee.email,
    });
  };

  const handleSavePersonalInfo = () => {
    if (!personalInfoForm.firstName || !personalInfoForm.lastName || !personalInfoForm.employeeNo) {
      error('Failed to save employee information', 'Please complete all required employee fields.');
      return;
    }

    success('Employee updated', `${personalInfoForm.firstName} ${personalInfoForm.lastName}'s information has been saved.`);
    setIsEditingPersonal(false);
  };

  const handleCancelPersonalInfoEdit = () => {
    resetPersonalInfoForm();
    setIsEditingPersonal(false);
  };

  const handleSaveGovernmentIds = () => {
    success('Government IDs saved', 'Government ID information has been updated.');
  };

  const handleDocumentUpload = (label: DocumentLabel, fileName?: string) => {
    setDocuments((prev) => ({
      ...prev,
      [label]: fileName ?? `${label.toLowerCase().replace(/ /g, '_')}_upload.pdf`,
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
              {employee.fullName} - {employee.employeeNo}
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
              <p className="text-sm font-bold text-foreground mt-1">{personalInfoForm.department}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Position</p>
              <p className="text-sm font-bold text-foreground mt-1">{personalInfoForm.position}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
              <p className="text-sm font-bold text-foreground mt-1">{personalInfoForm.email}</p>
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
              activeTab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'personal' && (
        <PersonalInfoTab
          isEditingPersonal={isEditingPersonal}
          personalInfoForm={personalInfoForm}
          onStartEdit={() => setIsEditingPersonal(true)}
          onCancelEdit={handleCancelPersonalInfoEdit}
          onSave={handleSavePersonalInfo}
          onFieldChange={updatePersonalInfoForm}
          personalInputClass={personalInputClass}
          personalSelectClass={personalSelectClass}
        />
      )}

      {activeTab === 'government-ids' && (
        <GovernmentIdsTab
          governmentIds={governmentIds}
          inputClass={inputClass}
          onFieldChange={updateGovernmentId}
          onSave={handleSaveGovernmentIds}
        />
      )}

      {activeTab === 'documents' && <DocumentsTab documents={documents} onUpload={handleDocumentUpload} />}

      {activeTab === 'employment' && (
        <EmploymentTab
          employmentForm={employmentForm}
          employmentRecords={employmentRecords}
          selectClass={selectClass}
          inputClass={inputClass}
          statusVariant={STATUS_VARIANT}
          departmentOptions={DEPARTMENT_OPTIONS}
          teamOptions={TEAM_OPTIONS}
          levelOptions={LEVEL_OPTIONS}
          reportingManagerOptions={REPORTING_MANAGER_OPTIONS}
          clientOptions={CLIENT_OPTIONS}
          onFieldChange={updateEmploymentForm}
          onSave={handleAddEmployment}
        />
      )}

      {activeTab === 'contracts' && (
        <ContractsTab
          contractForm={contractForm}
          contracts={contracts}
          employmentRecords={employmentRecords}
          selectClass={selectClass}
          inputClass={inputClass}
          statusVariant={STATUS_VARIANT}
          onFieldChange={updateContractForm}
          onSave={handleSaveContract}
        />
      )}

      {activeTab === 'app-access' && (
        <AppAccessTab
          appAccess={appAccess}
          accessItems={accessItems}
          onToggleAccess={toggleAppAccess}
          onSave={() => success('App access updated', 'Application access settings have been saved.')}
        />
      )}
    </div>
  );
}
