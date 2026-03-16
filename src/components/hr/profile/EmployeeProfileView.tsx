// src/components/hr/profile/EmployeeProfileView.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Briefcase, FileText, FolderOpen, IdCard, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { Employee } from '@/lib/mock-hr-data';
import { ContractsTab } from './components/ContractsTab';
import { DocumentsTab } from './components/DocumentsTab';
import { EmploymentTab } from './components/EmploymentTab';
import { GovernmentIdsTab } from './components/GovernmentIdsTab';
import { PersonalInfoTab } from './components/PersonalInfoTab';
import type {
  ContractRecord,
  DocumentLabel,
  DocumentState,
  EmploymentRecord,
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
];

/* API response types */
interface ApiEmployment {
  id: number;
  employmentStatus: string;
  employmentType: string | null;
  hireDate: string | null;
  regularizationDate: string | null;
  endDate: string | null;
  employeeLevelId: number | null;
  client: { id: number; businessName: string | null } | null;
  department: { id: number; name: string } | null;
  position: { id: number; title: string } | null;
  reportingManager: { id: number; firstName: string; lastName: string } | null;
}

interface ApiContract {
  id: number;
  employmentId: number;
  contractType: string;
  status: string;
  contractStart: string;
  contractEnd: string | null;
  monthlyRate: string | null;
  dailyRate: string | null;
  hourlyRate: string | null;
  disbursedMethod: string | null;
  scheduleId: number | null;
  workingHoursPerWeek: number | null;
  bankDetails: string | null;
  notes: string | null;
  employment: {
    department: { name: string } | null;
    position: { title: string } | null;
  };
}

interface ApiEmployeeDetail {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  nameExtension: string | null;
  birthDate: string | null;
  placeOfBirth: string | null;
  gender: string;
  civilStatus: string | null;
  phone: string;
  personalEmail: string | null;
  email: string | null;
  address: string;
  employeeNo: string | null;
  educationalBackground: string | null;
  school: string | null;
  course: string | null;
  yearGraduated: string | null;
  certifications: string | null;
  employments: ApiEmployment[];
}

interface IdNameOption { id: number; name: string; }
interface ManagerOption { id: number; fullName: string; }

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
  const employeeId = parseInt(employee.id, 10);

  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const personalDataSnapshot = useRef<PersonalInfoFormState | null>(null);

  /* ── Personal info ───────────────────────────────────────────── */
  const [personalInfoForm, setPersonalInfoForm] = useState<PersonalInfoFormState>({
    employeeNo: employee.employeeNo,
    firstName: employee.firstName,
    middleName: '',
    lastName: employee.lastName,
    nameExtension: '',
    department: employee.department,
    position: employee.position,
    phone: employee.phone,
    hireDate: employee.dateHired,
    employmentType: employee.status === 'Probationary' ? 'Probationary' : 'Regular',
    employmentStatus: employee.status,
    birthDate: '',
    placeOfBirth: '',
    gender: '',
    civilStatus: '',
    personalEmail: '',
    address: '',
    email: employee.email,
    educationalBackground: '',
    school: '',
    course: '',
    yearGraduated: '',
    certifications: '',
  });

  /* ── Government IDs ──────────────────────────────────────────── */
  const [governmentIds, setGovernmentIds] = useState<GovernmentIdsState>({
    sss: employee.sssNo,
    pagibig: employee.pagIbigNo,
    philhealth: employee.philHealthNo,
    tin: employee.tinNo,
  });
  const [govIdsSaving, setGovIdsSaving] = useState(false);

  /* ── Documents (mock — left as-is) ──────────────────────────── */
  const [documents, setDocuments] = useState<DocumentState>({
    Resume: null, 'Birth Certificate': null, 'Valid ID': null,
    'NBI Clearance': null, 'Barangay Clearance': null, 'Medical Results': null, 'Bank QR': null,
  });

  /* ── Employment ──────────────────────────────────────────────── */
  const [employmentRecords, setEmploymentRecords] = useState<EmploymentRecord[]>([]);
  /* ── Contracts ───────────────────────────────────────────────── */
  const [contracts, setContracts] = useState<ContractRecord[]>([]);

  const [dataLoaded, setDataLoaded] = useState(false);

  /* ── Option state ────────────────────────────────────────────── */
  const [deptOptions, setDeptOptions] = useState<IdNameOption[]>([]);
  const [positionOptions, setPositionOptions] = useState<{ id: number; title: string }[]>([]);
  const [levelOptions, setLevelOptions] = useState<IdNameOption[]>([]);

  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<IdNameOption[]>([]);

  /* ── Fetch helpers ───────────────────────────────────────────── */

  const fetchPersonalData = useCallback(async () => {
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: ApiEmployeeDetail };
      const emp = json.data;
      const activeEmp = emp.employments.find((e) => e.employmentStatus === 'ACTIVE') ?? emp.employments[0];
      const formatEnum = (val: string) =>
        val.toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const snapshot: PersonalInfoFormState = {
        employeeNo: emp.employeeNo ?? '',
        firstName: emp.firstName,
        middleName: emp.middleName ?? '',
        lastName: emp.lastName,
        nameExtension: emp.nameExtension ?? '',
        department: activeEmp?.department?.name ?? '',
        position: activeEmp?.position?.title ?? '',
        phone: emp.phone,
        hireDate: activeEmp?.hireDate ?? '',
        employmentType: activeEmp?.employmentType ? formatEnum(activeEmp.employmentType) : '',
        employmentStatus: activeEmp?.employmentStatus ? formatEnum(activeEmp.employmentStatus) : '',
        birthDate: emp.birthDate ? emp.birthDate.slice(0, 10) : '',
        placeOfBirth: emp.placeOfBirth ?? '',
        gender: emp.gender,
        civilStatus: emp.civilStatus ?? '',
        personalEmail: emp.personalEmail ?? '',
        address: emp.address,
        email: emp.email ?? '',
        educationalBackground: emp.educationalBackground ?? '',
        school: emp.school ?? '',
        course: emp.course ?? '',
        yearGraduated: emp.yearGraduated ?? '',
        certifications: emp.certifications ?? '',
      };
      personalDataSnapshot.current = snapshot;
      setPersonalInfoForm(snapshot);
    } catch { /* keep initial values */ }
  }, [employeeId]);

  const fetchGovIds = useCallback(async () => {
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/gov-ids`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: { sss: string | null; pagibig: string | null; philhealth: string | null; tin: string | null } };
      setGovernmentIds({
        sss: json.data.sss ?? '',
        pagibig: json.data.pagibig ?? '',
        philhealth: json.data.philhealth ?? '',
        tin: json.data.tin ?? '',
      });
    } catch { /* keep initial values from mapped employee */ }
  }, [employeeId]);

  const fetchEmployments = useCallback(async () => {
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/employment`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: ApiEmployment[] };
      setEmploymentRecords((json.data ?? []).map((e) => ({
        id: e.id,
        clientId: e.client?.id ?? 1,
        clientName: e.client?.businessName ?? `Client #${e.client?.id ?? '?'}`,
        departmentId: e.department?.id ?? null,
        department: e.department?.name ?? '',
        positionId: e.position?.id ?? null,
        position: e.position?.title ?? '',
        employmentType: e.employmentType ?? '',
        employeeLevelId: e.employeeLevelId ?? null,
        reportingManagerId: e.reportingManager?.id ?? null,
        hireDate: e.hireDate ?? '',
        regularizationDate: e.regularizationDate ?? null,
        endDate: e.endDate ?? null,
        status: e.employmentStatus,
      })));
    } catch { /* ignore */ }
  }, [employeeId]);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/contract`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: ApiContract[] };
      setContracts((json.data ?? []).map((c) => ({
        id: c.id,
        employmentId: c.employmentId,
        departmentName: c.employment?.department?.name ?? '—',
        positionTitle: c.employment?.position?.title ?? '—',
        contractType: c.contractType,
        startDate: c.contractStart,
        endDate: c.contractEnd,
        monthlyRate: c.monthlyRate,
        dailyRate: c.dailyRate,
        hourlyRate: c.hourlyRate,
        disbursedMethod: c.disbursedMethod,
        status: c.status,
        scheduleId: c.scheduleId,
        workingHoursPerWeek: c.workingHoursPerWeek,
        bankDetails: c.bankDetails,
        notes: c.notes,
      })));
    } catch { /* ignore */ }
  }, [employeeId]);

  const fetchOptions = useCallback(async () => {
    try {
      const [deptRes, levelRes, empRes, schedRes] = await Promise.all([
        fetch('/api/hr/departments'),
        fetch('/api/admin/employee-levels'),
        fetch('/api/hr/employees'),
        fetch('/api/hr/work-schedules'),
      ]);

      if (deptRes.ok) {
        const deptData = (await deptRes.json()) as { data: { id: number; name: string }[] };
        setDeptOptions((deptData.data ?? []).map((d) => ({ id: d.id, name: d.name })));
      } else {
        error('Departments unavailable', 'Could not load department list. Check that the ATMS client is set up correctly.');
      }

      if (levelRes.ok) {
        const levelData = (await levelRes.json()) as { data: { id: number; name: string }[] };
        setLevelOptions((levelData.data ?? []).map((l) => ({ id: l.id, name: l.name })));
      }

      if (empRes.ok) {
        const empData = (await empRes.json()) as { data: { id: number; fullName: string }[] };
        setManagerOptions(
          empData.data
            .filter((e) => e.id !== employeeId)
            .map((e) => ({ id: e.id, fullName: e.fullName })),
        );
      }
      if (schedRes.ok) {
        const schedData = (await schedRes.json()) as { data: { id: number; name: string }[] };
        setScheduleOptions((schedData.data ?? []).map((s) => ({ id: s.id, name: s.name })));
      }
    } catch {
      error('Network error', 'Failed to load form options. Please refresh the page.');
    }
  }, [employeeId, error]);

  const fetchPositionsForDept = useCallback(async (deptId: string) => {
    if (!deptId) { setPositionOptions([]); return; }
    try {
      const res = await fetch(`/api/hr/positions?departmentId=${deptId}`);
      const data = (await res.json()) as { data: { id: number; title: string }[] };
      setPositionOptions(data.data ?? []);
    } catch { setPositionOptions([]); }
  }, []);

  useEffect(() => {
    void fetchPersonalData();
    void fetchGovIds();
    void fetchOptions();
    void Promise.all([fetchEmployments(), fetchContracts()]).then(() => { setDataLoaded(true); });
  }, [fetchPersonalData, fetchGovIds, fetchEmployments, fetchContracts, fetchOptions]);

  /* ── Handlers ─────────────────────────────────────────────────── */

  const updateGovernmentId = <K extends keyof GovernmentIdsState>(key: K, value: GovernmentIdsState[K]) => {
    setGovernmentIds((prev) => ({ ...prev, [key]: value }));
  };

  const updatePersonalInfoForm = <K extends keyof PersonalInfoFormState>(key: K, value: PersonalInfoFormState[K]) => {
    setPersonalInfoForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetPersonalInfoForm = () => {
    if (personalDataSnapshot.current) {
      setPersonalInfoForm(personalDataSnapshot.current);
    } else {
      setPersonalInfoForm({
        employeeNo: employee.employeeNo,
        firstName: employee.firstName,
        middleName: '',
        lastName: employee.lastName,
        nameExtension: '',
        department: employee.department,
        position: employee.position,
        phone: employee.phone,
        hireDate: employee.dateHired,
        employmentType: employee.status === 'Probationary' ? 'Probationary' : 'Regular',
        employmentStatus: employee.status,
        birthDate: '',
        placeOfBirth: '',
        gender: '',
        civilStatus: '',
        personalEmail: '',
        address: '',
        email: employee.email,
        educationalBackground: '',
        school: '',
        course: '',
        yearGraduated: '',
        certifications: '',
      });
    }
  };

  const handleSavePersonalInfo = async () => {
    if (!personalInfoForm.firstName || !personalInfoForm.lastName) {
      error('Validation error', 'First name and last name are required.');
      return;
    }
    setPersonalSaving(true);
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: personalInfoForm.firstName,
          middleName: personalInfoForm.middleName || null,
          lastName: personalInfoForm.lastName,
          nameExtension: personalInfoForm.nameExtension || null,
          phone: personalInfoForm.phone || null,
          birthDate: personalInfoForm.birthDate || undefined,
          placeOfBirth: personalInfoForm.placeOfBirth || null,
          gender: personalInfoForm.gender || undefined,
          civilStatus: personalInfoForm.civilStatus || null,
          personalEmail: personalInfoForm.personalEmail || null,
          address: personalInfoForm.address || undefined,
          employeeNo: personalInfoForm.employeeNo || null,
          educationalBackground: personalInfoForm.educationalBackground || null,
          school: personalInfoForm.school || null,
          course: personalInfoForm.course || null,
          yearGraduated: personalInfoForm.yearGraduated || null,
          certifications: personalInfoForm.certifications || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error('Failed to save', data.error ?? 'Could not update employee information.');
        return;
      }
      success('Employee updated', `${personalInfoForm.firstName} ${personalInfoForm.lastName}'s information has been saved.`);
      personalDataSnapshot.current = { ...personalInfoForm };
      setIsEditingPersonal(false);
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setPersonalSaving(false);
    }
  };

  const handleCancelPersonalInfoEdit = () => {
    resetPersonalInfoForm();
    setIsEditingPersonal(false);
  };

  const handleSaveGovernmentIds = async () => {
    setGovIdsSaving(true);
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/gov-ids`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sss: governmentIds.sss || null,
          pagibig: governmentIds.pagibig || null,
          philhealth: governmentIds.philhealth || null,
          tin: governmentIds.tin || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { error('Failed to save', data.error ?? 'Could not save government IDs.'); return; }
      success('Government IDs saved', 'Government ID information has been updated.');
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setGovIdsSaving(false);
    }
  };

  const handleDocumentUpload = (label: DocumentLabel, fileName?: string) => {
    setDocuments((prev) => ({
      ...prev,
      [label]: fileName ?? `${label.toLowerCase().replace(/ /g, '_')}_upload.pdf`,
    }));
    success('Document uploaded', `${label} has been uploaded.`);
  };

  /* ── Render ───────────────────────────────────────────────────── */

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
        {TABS.map(({ key, label, icon: Icon }) => {
          const hasAlert = dataLoaded && (
            (key === 'employment' && employmentRecords.length === 0) ||
            (key === 'contracts' && contracts.length === 0)
          );
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
              {hasAlert && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'personal' && (
        <PersonalInfoTab
          isEditingPersonal={isEditingPersonal}
          personalInfoForm={personalInfoForm}
          onStartEdit={() => setIsEditingPersonal(true)}
          onCancelEdit={handleCancelPersonalInfoEdit}
          onSave={() => { void handleSavePersonalInfo(); }}
          onFieldChange={updatePersonalInfoForm}
          personalInputClass={personalInputClass}
          personalSelectClass={personalSelectClass}
          disabled={personalSaving}
        />
      )}

      {activeTab === 'government-ids' && (
        <GovernmentIdsTab
          governmentIds={governmentIds}
          inputClass={inputClass}
          disabled={govIdsSaving}
          onFieldChange={updateGovernmentId}
          onSave={() => { void handleSaveGovernmentIds(); }}
        />
      )}

      {activeTab === 'documents' && <DocumentsTab documents={documents} onUpload={handleDocumentUpload} />}

      {activeTab === 'employment' && (
        <EmploymentTab
          employmentRecords={employmentRecords}
          contracts={contracts}
          employeeId={employeeId}
          departmentOptions={deptOptions}
          levelOptions={levelOptions}
          managerOptions={managerOptions}
          onEmploymentSaved={() => { void fetchEmployments(); }}
        />
      )}

      {activeTab === 'contracts' && (
        <ContractsTab
          contracts={contracts}
          employmentRecords={employmentRecords}
          scheduleOptions={scheduleOptions}
          employeeId={employeeId}
          onContractSaved={() => { void fetchContracts(); }}
        />
      )}
    </div>
  );
}
