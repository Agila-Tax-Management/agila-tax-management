// src/app/(portal)/portal/hr/add-new-employee/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Check, ChevronRight, Loader2, Search, SkipForward, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

/* ─── Types ─────────────────────────────────────────────────────── */

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DepartmentOption {
  id: number;
  name: string;
}

interface PositionOption {
  id: number;
  title: string;
  departmentId: number;
}

interface EmployeeLevelOption {
  id: number;
  name: string;
  position: number;
}

interface WorkScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  isWorkingDay: boolean;
}

interface WorkScheduleOption {
  id: number;
  name: string;
  days: WorkScheduleDay[];
}

type UserLinkMode = 'none' | 'existing' | 'create';

interface Step1Data {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
  email: string;
  employeeNo: string;
  userLinkMode: UserLinkMode;
  selectedUserId: string;
  newUserName: string;
  newUserEmail: string;
  newUserPassword: string;
  newUserRole: string;
}

interface Step2Data {
  clientId: string;
  departmentId: string;
  positionId: string;
  employmentType: string;
  employeeLevelId: string;
  hireDate: string;
  regularizationDate: string;
}

interface Step3Data {
  contractType: string;
  status: string;
  contractStart: string;
  contractEnd: string;
  monthlyRate: string;
  dailyRate: string;
  hourlyRate: string;
  disbursedMethod: string;
  payType: string;
  bankDetails: string;
  workingHoursPerWeek: string;
  notes: string;
}

interface Step4Data {
  scheduleMode: 'existing' | 'new';
  existingScheduleId: string;
  newScheduleName: string;
  newScheduleDays: {
    dayOfWeek: number;
    label: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
    breakStart: string;
    breakEnd: string;
  }[];
}

/* ─── Constants ─────────────────────────────────────────────────── */

const WEEK_DAYS = [
  { dayOfWeek: 1, label: 'Monday' },
  { dayOfWeek: 2, label: 'Tuesday' },
  { dayOfWeek: 3, label: 'Wednesday' },
  { dayOfWeek: 4, label: 'Thursday' },
  { dayOfWeek: 5, label: 'Friday' },
  { dayOfWeek: 6, label: 'Saturday' },
  { dayOfWeek: 0, label: 'Sunday' },
];

const DEFAULT_STEP4: Step4Data = {
  scheduleMode: 'new',
  existingScheduleId: '',
  newScheduleName: '',
  newScheduleDays: WEEK_DAYS.map((d) => ({
    ...d,
    enabled: d.dayOfWeek >= 1 && d.dayOfWeek <= 5,
    startTime: '08:00',
    endTime: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
  })),
};

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
const selectCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none';
const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1.5';

const STEPS = [
  { num: 1, label: 'Identity' },
  { num: 2, label: 'Employment' },
  { num: 3, label: 'Contract' },
  { num: 4, label: 'Schedule' },
];

/* ─── Page Component ─────────────────────────────────────────────── */

export default function AddNewEmployeePage(): React.ReactNode {
  const router = useRouter();
  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [createdEmployeeId, setCreatedEmployeeId] = useState<number | null>(null);
  const [createdEmploymentId, setCreatedEmploymentId] = useState<number | null>(null);
  const [createdContractId, setCreatedContractId] = useState<number | null>(null);

  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [levels, setLevels] = useState<EmployeeLevelOption[]>([]);
  const [schedules, setSchedules] = useState<WorkScheduleOption[]>([]);
  const [empNoConflict, setEmpNoConflict] = useState(false);
  const [empNoChecking, setEmpNoChecking] = useState(false);

  const [s1, setS1] = useState<Step1Data>({
    firstName: '', middleName: '', lastName: '', birthDate: '', gender: '',
    phone: '', address: '', email: '', employeeNo: '',
    userLinkMode: 'none', selectedUserId: '',
    newUserName: '', newUserEmail: '', newUserPassword: '', newUserRole: 'EMPLOYEE',
  });

  const [s2, setS2] = useState<Step2Data>({
    clientId: '1', departmentId: '', positionId: '',
    employmentType: '', employeeLevelId: '', hireDate: '', regularizationDate: '',
  });

  const [s3, setS3] = useState<Step3Data>({
    contractType: '', status: 'DRAFT', contractStart: '', contractEnd: '',
    monthlyRate: '', dailyRate: '', hourlyRate: '', disbursedMethod: '',
    payType: 'Variable Pay', bankDetails: '', workingHoursPerWeek: '', notes: '',
  });

  const [s4, setS4] = useState<Step4Data>(DEFAULT_STEP4);

  /* ─── Fetch helpers ────────────────────────────────────────────── */

  const fetchOptions = useCallback(async () => {
    try {
      const [deptRes, levelRes, scheduleRes] = await Promise.all([
        fetch('/api/hr/departments'),
        fetch('/api/admin/employee-levels'),
        fetch('/api/hr/work-schedules'),
      ]);
      const unlinkedUsers = await fetch('/api/hr/users').then((r) => r.json()).catch(() => ({ data: [] }));

      const [deptData, levelData, schedData] = await Promise.all([
        deptRes.json().catch(() => ({ data: [] })),
        levelRes.json().catch(() => ({ data: [] })),
        scheduleRes.json().catch(() => ({ data: [] })),
      ]);

      setDepartments(deptData.data ?? []);
      setUserOptions((unlinkedUsers as { data: UserOption[] }).data ?? []);
      setLevels((levelData.data ?? []).sort((a: EmployeeLevelOption, b: EmployeeLevelOption) => a.position - b.position));
      setSchedules(schedData.data ?? []);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchPositionsForDept = useCallback(async (deptId: string) => {
    if (!deptId) { setPositions([]); return; }
    try {
      const res = await fetch(`/api/hr/positions?departmentId=${deptId}`);
      const data = (await res.json()) as { data: PositionOption[] };
      setPositions(data.data ?? []);
    } catch { setPositions([]); }
  }, []);

  useEffect(() => {
    void fetchOptions();
  }, [fetchOptions]);

  /* ─── Employee number uniqueness check ────────────────────────── */

  const checkEmployeeNo = async (value: string) => {
    if (!value.trim()) { setEmpNoConflict(false); return; }
    setEmpNoChecking(true);
    try {
      const res = await fetch('/api/hr/employees');
      const data = (await res.json()) as { data: { employeeNo: string | null }[] };
      const taken = (data.data ?? []).some((e) => e.employeeNo === value.trim());
      setEmpNoConflict(taken);
    } catch { setEmpNoConflict(false); }
    setEmpNoChecking(false);
  };

  /* ─── Step 1 Submit ─────────────────────────────────────────────── */

  const handleStep1 = async () => {
    if (!s1.firstName.trim() || !s1.lastName.trim()) {
      error('Missing fields', 'First name and last name are required.');
      return;
    }
    if (!s1.birthDate || !s1.gender || !s1.phone.trim() || !s1.address.trim()) {
      error('Missing fields', 'Birth date, gender, phone, and address are required.');
      return;
    }
    if (empNoConflict) {
      error('Duplicate employee number', 'Please enter a unique employee number.');
      return;
    }

    setLoading(true);
    try {
      let resolvedUserId: string | null = null;

      if (s1.userLinkMode === 'create') {
        if (!s1.newUserEmail || !s1.newUserPassword || !s1.newUserName) {
          error('Missing fields', 'Name, email, and password are required to create a user account.');
          setLoading(false);
          return;
        }
        const userRes = await fetch('/api/hr/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: s1.newUserName,
            email: s1.newUserEmail,
            password: s1.newUserPassword,
            role: s1.newUserRole,
          }),
        });
        const userData = (await userRes.json()) as { data?: { id: string }; error?: string };
        if (!userRes.ok) {
          error('Failed to create user', userData.error ?? 'An error occurred.');
          setLoading(false);
          return;
        }
        resolvedUserId = userData.data!.id;
      } else if (s1.userLinkMode === 'existing') {
        resolvedUserId = s1.selectedUserId || null;
      }

      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: s1.firstName.trim(),
          middleName: s1.middleName.trim() || null,
          lastName: s1.lastName.trim(),
          birthDate: s1.birthDate,
          gender: s1.gender,
          phone: s1.phone.trim(),
          address: s1.address.trim(),
          email: s1.email.trim() || null,
          employeeNo: s1.employeeNo.trim() || null,
          userId: resolvedUserId,
        }),
      });

      const data = (await res.json()) as { data?: { id: number }; error?: string };
      if (!res.ok) {
        error('Failed to create employee', data.error ?? 'An error occurred.');
        setLoading(false);
        return;
      }

      setCreatedEmployeeId(data.data!.id);
      success('Employee created', `${s1.firstName} ${s1.lastName} has been added successfully.`);
      setStep(2);
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Step 2 Submit ─────────────────────────────────────────────── */

  const handleStep2 = async () => {
    if (!s2.clientId) {
      error('Missing field', 'Please select a client/company for this employment.');
      return;
    }
    if (!createdEmployeeId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employees/${createdEmployeeId}/employment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: parseInt(s2.clientId, 10),
          departmentId: s2.departmentId ? parseInt(s2.departmentId, 10) : null,
          positionId: s2.positionId ? parseInt(s2.positionId, 10) : null,
          employmentType: s2.employmentType || null,
          employeeLevelId: s2.employeeLevelId ? parseInt(s2.employeeLevelId, 10) : null,
          hireDate: s2.hireDate || null,
          regularizationDate: s2.regularizationDate || null,
        }),
      });

      const data = (await res.json()) as { data?: { id: number }; error?: string };
      if (!res.ok) {
        error('Failed to save employment', data.error ?? 'An error occurred.');
        setLoading(false);
        return;
      }

      setCreatedEmploymentId(data.data!.id);
      success('Employment saved', 'Employment assignment has been recorded.');
      setStep(3);
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Step 3 Submit ─────────────────────────────────────────────── */

  const handleStep3 = async () => {
    if (!s3.contractType) {
      error('Missing field', 'Please select a contract type.');
      return;
    }
    if (!s3.contractStart) {
      error('Missing field', 'Contract start date is required.');
      return;
    }
    if (!createdEmployeeId || !createdEmploymentId) {
      error('Missing employment', 'Please complete employment assignment first or go back to step 2.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employees/${createdEmployeeId}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employmentId: createdEmploymentId,
          contractType: s3.contractType,
          status: s3.status,
          contractStart: s3.contractStart,
          contractEnd: s3.contractEnd || null,
          monthlyRate: s3.monthlyRate || null,
          dailyRate: s3.dailyRate || null,
          hourlyRate: s3.hourlyRate || null,
          disbursedMethod: s3.disbursedMethod || null,
          payType: s3.payType || null,
          bankDetails: s3.bankDetails || null,
          workingHoursPerWeek: s3.workingHoursPerWeek ? parseInt(s3.workingHoursPerWeek, 10) : null,
          notes: s3.notes || null,
        }),
      });

      const data = (await res.json()) as { data?: { id: number }; error?: string };
      if (!res.ok) {
        error('Failed to save contract', data.error ?? 'An error occurred.');
        setLoading(false);
        return;
      }

      setCreatedContractId(data.data!.id);
      success('Contract saved', 'Employee contract has been recorded.');
      setStep(4);
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Step 4 Submit ─────────────────────────────────────────────── */

  const handleStep4 = async () => {
    setLoading(true);
    try {
      let scheduleId: number | null = null;

      if (s4.scheduleMode === 'existing' && s4.existingScheduleId) {
        scheduleId = parseInt(s4.existingScheduleId, 10);
      } else if (s4.scheduleMode === 'new' && s4.newScheduleName.trim()) {
        const workingDays = s4.newScheduleDays.filter((d) => d.enabled);
        if (workingDays.length === 0) {
          error('No working days', 'Please enable at least one working day.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/hr/work-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: s4.newScheduleName.trim(),
            timezone: 'Asia/Manila',
            days: workingDays.map((d) => ({
              dayOfWeek: d.dayOfWeek,
              startTime: d.startTime,
              endTime: d.endTime,
              breakStart: d.breakStart || null,
              breakEnd: d.breakEnd || null,
              isWorkingDay: true,
            })),
          }),
        });

        const data = (await res.json()) as { data?: { id: number }; error?: string };
        if (!res.ok) {
          error('Failed to save schedule', data.error ?? 'An error occurred.');
          setLoading(false);
          return;
        }
        scheduleId = data.data!.id;
      }

      if (scheduleId && createdContractId && createdEmployeeId) {
        await fetch(`/api/hr/employees/${createdEmployeeId}/contract?contractId=${createdContractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId }),
        });
      }

      if (scheduleId) {
        success('Schedule saved', 'Work schedule has been linked to the contract.');
      } else {
        success('Employee created', 'Employee has been set up successfully.');
      }
      router.push('/portal/hr/employee-management');
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (step < 4) setStep((s) => s + 1);
    else router.push('/portal/hr/employee-management');
  };

  const handleCancel = () => router.push('/portal/hr/employee-management');

  const filteredUsers = userOptions.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  /* ─── Render ────────────────────────────────────────────────────── */

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">Add New Employee</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Complete the 4-step onboarding form</p>
        </div>
      </div>

      {/* Card container */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">

        {/* Step indicators */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > s.num
                      ? 'bg-emerald-500 text-white'
                      : step === s.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s.num ? <Check size={14} /> : s.num}
                </div>
                <span className={`text-[10px] font-medium ${step === s.num ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mb-5 transition-colors ${step > s.num ? 'bg-emerald-400' : 'bg-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: Employee Identity ──────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Employee Identity</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                <input className={inputCls} value={s1.firstName}
                  onChange={(e) => setS1((p) => ({ ...p, firstName: e.target.value }))} placeholder="Juan" />
              </div>
              <div>
                <label className={labelCls}>Middle Name</label>
                <input className={inputCls} value={s1.middleName}
                  onChange={(e) => setS1((p) => ({ ...p, middleName: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                <input className={inputCls} value={s1.lastName}
                  onChange={(e) => setS1((p) => ({ ...p, lastName: e.target.value }))} placeholder="Dela Cruz" />
              </div>
              <div>
                <label className={labelCls}>Birth Date <span className="text-red-500">*</span></label>
                <input type="date" className={inputCls} value={s1.birthDate}
                  onChange={(e) => setS1((p) => ({ ...p, birthDate: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
                <select className={selectCls} value={s1.gender}
                  onChange={(e) => setS1((p) => ({ ...p, gender: e.target.value }))}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                <input className={inputCls} value={s1.phone}
                  onChange={(e) => setS1((p) => ({ ...p, phone: e.target.value }))} placeholder="09xxxxxxxxx" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address <span className="text-red-500">*</span></label>
                <input className={inputCls} value={s1.address}
                  onChange={(e) => setS1((p) => ({ ...p, address: e.target.value }))} placeholder="City, Province" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={s1.email}
                  onChange={(e) => setS1((p) => ({ ...p, email: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <label className={labelCls}>Employee No.</label>
                <div className="relative">
                  <input
                    className={`${inputCls} pr-8 ${empNoConflict ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : ''}`}
                    value={s1.employeeNo}
                    onChange={(e) => {
                      setS1((p) => ({ ...p, employeeNo: e.target.value }));
                      setEmpNoConflict(false);
                    }}
                    onBlur={() => checkEmployeeNo(s1.employeeNo)}
                    placeholder="Auto-generated if blank"
                  />
                  {empNoChecking && (
                    <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                  )}
                </div>
                {empNoConflict && (
                  <p className="text-xs text-red-500 mt-1">This employee number is already in use.</p>
                )}
              </div>
            </div>

            {/* User Linkage */}
            <div className="border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Portal Account Linkage</p>
              <div className="flex flex-wrap gap-2">
                {(['none', 'existing', 'create'] as UserLinkMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setS1((p) => ({ ...p, userLinkMode: mode }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      s1.userLinkMode === mode
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-border text-muted-foreground hover:border-blue-400'
                    }`}
                  >
                    {mode === 'none' && 'No portal access'}
                    {mode === 'existing' && 'Link existing user'}
                    {mode === 'create' && 'Create & link new user'}
                  </button>
                ))}
              </div>

              {s1.userLinkMode === 'existing' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className={`${inputCls} pl-9`}
                      placeholder="Search user by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3 text-center">No unlinked users found</p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setS1((p) => ({ ...p, selectedUserId: u.id }))}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors ${
                            s1.selectedUserId === u.id ? 'bg-blue-50 dark:bg-blue-950' : ''
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          {s1.selectedUserId === u.id && <Check size={14} className="text-blue-600 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {s1.userLinkMode === 'create' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={s1.newUserName}
                      onChange={(e) => setS1((p) => ({ ...p, newUserName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                    <input type="email" className={inputCls} value={s1.newUserEmail}
                      onChange={(e) => setS1((p) => ({ ...p, newUserEmail: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                    <input type="password" className={inputCls} value={s1.newUserPassword}
                      onChange={(e) => setS1((p) => ({ ...p, newUserPassword: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Role</label>
                    <select className={selectCls} value={s1.newUserRole}
                      onChange={(e) => setS1((p) => ({ ...p, newUserRole: e.target.value }))}>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Employment Assignment ──────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Employment Assignment</h3>
            <p className="text-xs text-muted-foreground -mt-3">This step is optional — you can skip and add it later.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Department</label>
                <select
                  className={selectCls}
                  value={s2.departmentId}
                  onChange={(e) => {
                    setS2((p) => ({ ...p, departmentId: e.target.value, positionId: '' }));
                    void fetchPositionsForDept(e.target.value);
                  }}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Position</label>
                <select className={selectCls} value={s2.positionId}
                  onChange={(e) => setS2((p) => ({ ...p, positionId: e.target.value }))}>
                  <option value="">Select position</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Employment Type</label>
                <select className={selectCls} value={s2.employmentType}
                  onChange={(e) => setS2((p) => ({ ...p, employmentType: e.target.value }))}>
                  <option value="">Select type</option>
                  <option value="REGULAR">Regular</option>
                  <option value="PROBATIONARY">Probationary</option>
                  <option value="CONTRACTUAL">Contractual</option>
                  <option value="PROJECT_BASED">Project Based</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Employee Level</label>
                <select className={selectCls} value={s2.employeeLevelId}
                  onChange={(e) => setS2((p) => ({ ...p, employeeLevelId: e.target.value }))}>
                  <option value="">Select level</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Hire Date</label>
                <input type="date" className={inputCls} value={s2.hireDate}
                  onChange={(e) => setS2((p) => ({ ...p, hireDate: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Regularization Date</label>
                <input type="date" className={inputCls} value={s2.regularizationDate}
                  onChange={(e) => setS2((p) => ({ ...p, regularizationDate: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Client / Company</label>
              <div className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground select-none">
                Agila Tax Management Services (ATMS)
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Contract ────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Contract</h3>
            <p className="text-xs text-muted-foreground -mt-3">This step is optional — you can skip and add it later.</p>

            {!createdEmploymentId && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  No employment record found. Go back to step 2 to add employment, or skip this step.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Contract Type <span className="text-red-500">*</span></label>
                <select className={selectCls} value={s3.contractType}
                  onChange={(e) => setS3((p) => ({ ...p, contractType: e.target.value }))}>
                  <option value="">Select type</option>
                  <option value="PROBATIONARY">Probationary</option>
                  <option value="REGULAR">Regular</option>
                  <option value="CONTRACTUAL">Contractual</option>
                  <option value="PROJECT_BASED">Project Based</option>
                  <option value="CONSULTANT">Consultant</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={selectCls} value={s3.status}
                  onChange={(e) => setS3((p) => ({ ...p, status: e.target.value }))}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Start Date <span className="text-red-500">*</span></label>
                <input type="date" className={inputCls} value={s3.contractStart}
                  onChange={(e) => setS3((p) => ({ ...p, contractStart: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" className={inputCls} value={s3.contractEnd}
                  onChange={(e) => setS3((p) => ({ ...p, contractEnd: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Monthly Rate (₱)</label>
                <input type="number" className={inputCls} value={s3.monthlyRate}
                  onChange={(e) => setS3((p) => ({ ...p, monthlyRate: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Daily Rate (₱)</label>
                <input type="number" className={inputCls} value={s3.dailyRate}
                  onChange={(e) => setS3((p) => ({ ...p, dailyRate: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Disbursement Method</label>
                <select className={selectCls} value={s3.disbursedMethod}
                  onChange={(e) => setS3((p) => ({ ...p, disbursedMethod: e.target.value }))}>
                  <option value="">Select method</option>
                  <option value="CASH_SALARY">Cash Salary</option>
                  <option value="FUND_TRANSFER">Fund Transfer</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Working Hours/Week</label>
                <input type="number" className={inputCls} value={s3.workingHoursPerWeek}
                  onChange={(e) => setS3((p) => ({ ...p, workingHoursPerWeek: e.target.value }))} placeholder="40" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Bank Details</label>
                <input className={inputCls} value={s3.bankDetails}
                  onChange={(e) => setS3((p) => ({ ...p, bankDetails: e.target.value }))} placeholder="Bank name, account number" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={2} value={s3.notes}
                  onChange={(e) => setS3((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Work Schedule ────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Work Schedule</h3>
            <p className="text-xs text-muted-foreground -mt-3">This step is optional — you can skip and add it later.</p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setS4((p) => ({ ...p, scheduleMode: 'existing' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  s4.scheduleMode === 'existing' ? 'bg-blue-600 border-blue-600 text-white' : 'border-border text-muted-foreground'
                }`}
              >
                Use existing template
              </button>
              <button
                type="button"
                onClick={() => setS4((p) => ({ ...p, scheduleMode: 'new' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  s4.scheduleMode === 'new' ? 'bg-blue-600 border-blue-600 text-white' : 'border-border text-muted-foreground'
                }`}
              >
                Create new schedule
              </button>
            </div>

            {s4.scheduleMode === 'existing' && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Select Schedule Template</label>
                  <select className={selectCls} value={s4.existingScheduleId}
                    onChange={(e) => setS4((p) => ({ ...p, existingScheduleId: e.target.value }))}>
                    <option value="">Select template</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {schedules.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">No schedule templates found. Switch to &quot;Create new schedule&quot;.</p>
                  )}
                </div>

                {s4.existingScheduleId && (() => {
                  const DAY_LABELS: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
                  const selectedSchedule = schedules.find((s) => String(s.id) === s4.existingScheduleId);
                  const workingDays = selectedSchedule?.days.filter((d) => d.isWorkingDay) ?? [];
                  if (!selectedSchedule) return null;
                  return (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-2.5 bg-muted/60 border-b border-border">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Working Days — {selectedSchedule.name}</p>
                      </div>
                      {workingDays.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground">No working days configured.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Day</th>
                              <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Hours</th>
                              <th className="text-left px-4 py-2 font-semibold text-muted-foreground hidden sm:table-cell">Break</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workingDays.map((d) => (
                              <tr key={d.dayOfWeek} className="border-b border-border/60 last:border-0">
                                <td className="px-4 py-2 font-medium text-foreground">{DAY_LABELS[d.dayOfWeek] ?? `Day ${d.dayOfWeek}`}</td>
                                <td className="px-4 py-2 text-muted-foreground">{d.startTime} – {d.endTime}</td>
                                <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">
                                  {d.breakStart && d.breakEnd ? `${d.breakStart} – ${d.breakEnd}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {s4.scheduleMode === 'new' && (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Schedule Name <span className="text-red-500">*</span></label>
                  <input className={inputCls} value={s4.newScheduleName}
                    onChange={(e) => setS4((p) => ({ ...p, newScheduleName: e.target.value }))}
                    placeholder="e.g. Standard Office Hours" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Weekly Schedule</p>
                  {s4.newScheduleDays.map((day, idx) => (
                    <div key={day.dayOfWeek} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={(e) => {
                            const updated = [...s4.newScheduleDays];
                            updated[idx] = { ...day, enabled: e.target.checked };
                            setS4((p) => ({ ...p, newScheduleDays: updated }));
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className={`text-xs font-medium ${day.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {day.label}
                        </span>
                      </div>
                      {day.enabled && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="time" value={day.startTime}
                            onChange={(e) => {
                              const updated = [...s4.newScheduleDays];
                              updated[idx] = { ...day, startTime: e.target.value };
                              setS4((p) => ({ ...p, newScheduleDays: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                          <span className="text-xs text-muted-foreground">to</span>
                          <input type="time" value={day.endTime}
                            onChange={(e) => {
                              const updated = [...s4.newScheduleDays];
                              updated[idx] = { ...day, endTime: e.target.value };
                              setS4((p) => ({ ...p, newScheduleDays: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                          <span className="text-xs text-muted-foreground ml-2">Break:</span>
                          <input type="time" value={day.breakStart}
                            onChange={(e) => {
                              const updated = [...s4.newScheduleDays];
                              updated[idx] = { ...day, breakStart: e.target.value };
                              setS4((p) => ({ ...p, newScheduleDays: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                          <span className="text-xs text-muted-foreground">–</span>
                          <input type="time" value={day.breakEnd}
                            onChange={(e) => {
                              const updated = [...s4.newScheduleDays];
                              updated[idx] = { ...day, breakEnd: e.target.value };
                              setS4((p) => ({ ...p, newScheduleDays: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Action buttons ─────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={loading} className="gap-1.5">
                <X size={14} /> Back
              </Button>
            )}
            {step === 1 && (
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step > 1 && step < 4 && (
              <Button variant="outline" onClick={handleSkip} disabled={loading} className="gap-1.5">
                <SkipForward size={14} /> Skip
              </Button>
            )}
            {step === 4 && (
              <Button variant="outline" onClick={handleSkip} disabled={loading} className="gap-1.5">
                <SkipForward size={14} /> Skip & Finish
              </Button>
            )}

            {step === 1 && (
              <Button onClick={handleStep1} disabled={loading || empNoConflict} className="gap-1.5">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Save & Next</>}
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleStep2} disabled={loading} className="gap-1.5">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <><ChevronRight size={14} /> Save & Next</>}
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleStep3} disabled={loading || !createdEmploymentId} className="gap-1.5">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <><ChevronRight size={14} /> Save & Next</>}
              </Button>
            )}
            {step === 4 && (
              <Button onClick={handleStep4} disabled={loading} className="gap-1.5">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Save & Finish</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
