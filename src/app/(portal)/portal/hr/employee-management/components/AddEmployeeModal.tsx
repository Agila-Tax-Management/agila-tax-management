// src/app/(portal)/portal/hr/employee-management/components/AddEmployeeModal.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Check, ChevronRight, Loader2, Search, SkipForward, UserPlus, X } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

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

interface ClientOption {
  id: number;
  businessName: string | null;
  portalName: string | null;
}

interface EmployeeLevelOption {
  id: number;
  name: string;
  position: number;
}

interface WorkScheduleOption {
  id: number;
  name: string;
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
  workingHoursPerWeek: string;
  notes: string;
}

type RateType = 'DAILY' | 'MONTHLY';
type SalaryFrequency = 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
type PayType = 'FIXED_PAY' | 'VARIABLE_PAY';
type DisbursementType = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'E_WALLET';

interface Step3CompensationData {
  baseRate: string;
  allowanceRate: string;
  rateType: RateType;
  frequency: SalaryFrequency;
  payType: PayType;
  disbursementType: DisbursementType;
  bankDetails: string;
  isPaidRestDays: boolean;
  restDaysPerWeek: number;
  deductSss: boolean;
  deductPhilhealth: boolean;
  deductPagibig: boolean;
  pagibigType: 'REGULAR' | 'MINIMUM';
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

const WEEK_DAYS = [
  { dayOfWeek: 1, label: 'Monday' },
  { dayOfWeek: 2, label: 'Tuesday' },
  { dayOfWeek: 3, label: 'Wednesday' },
  { dayOfWeek: 4, label: 'Thursday' },
  { dayOfWeek: 5, label: 'Friday' },
  { dayOfWeek: 6, label: 'Saturday' },
  { dayOfWeek: 0, label: 'Sunday' },
];

function getDoleFactor(isPaidRestDays: boolean, restDaysPerWeek: number): number {
  if (isPaidRestDays) return 365;
  if (restDaysPerWeek === 2) return 261;
  if (restDaysPerWeek === 1) return 313;
  return 393.8;
}

const DEFAULT_S3C: Step3CompensationData = {
  baseRate: '',
  allowanceRate: '',
  rateType: 'DAILY',
  frequency: 'TWICE_A_MONTH',
  payType: 'VARIABLE_PAY',
  disbursementType: 'CASH',
  bankDetails: '',
  isPaidRestDays: false,
  restDaysPerWeek: 1,
  deductSss: false,
  deductPhilhealth: false,
  deductPagibig: false,
  pagibigType: 'REGULAR',
};

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

/* ─── Props ──────────────────────────────────────────────────────── */

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ─── Component ─────────────────────────────────────────────────── */

export function AddEmployeeModal({ isOpen, onClose, onCreated }: AddEmployeeModalProps): React.ReactNode {
  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Created IDs to pass between steps
  const [createdEmployeeId, setCreatedEmployeeId] = useState<number | null>(null);
  const [createdEmploymentId, setCreatedEmploymentId] = useState<number | null>(null);
  const [createdContractId, setCreatedContractId] = useState<number | null>(null);

  // Options fetched from API
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [levels, setLevels] = useState<EmployeeLevelOption[]>([]);
  const [schedules, setSchedules] = useState<WorkScheduleOption[]>([]);
  const [empNoConflict, setEmpNoConflict] = useState(false);
  const [empNoChecking, setEmpNoChecking] = useState(false);

  // Step form states
  const [s1, setS1] = useState<Step1Data>({
    firstName: '', middleName: '', lastName: '', birthDate: '', gender: '',
    phone: '', address: '', email: '', employeeNo: '',
    userLinkMode: 'none', selectedUserId: '',
    newUserName: '', newUserEmail: '', newUserPassword: '', newUserRole: 'EMPLOYEE',
  });

  const [s2, setS2] = useState<Step2Data>({
    clientId: '', departmentId: '', positionId: '',
    employmentType: '', employeeLevelId: '', hireDate: '', regularizationDate: '',
  });

  const [s3, setS3] = useState<Step3Data>({
    contractType: '', status: 'DRAFT', contractStart: '', contractEnd: '',
    workingHoursPerWeek: '', notes: '',
  });

  const [s3c, setS3c] = useState<Step3CompensationData>(DEFAULT_S3C);

  const [s4, setS4] = useState<Step4Data>(DEFAULT_STEP4);

  /* ─── Fetch helpers ────────────────────────────────────────────── */

  const fetchOptions = useCallback(async () => {
    try {
      const [deptRes, clientRes, levelRes, scheduleRes] = await Promise.all([
        fetch('/api/hr/departments'),
        fetch('/api/hr/users').then((r) => r.json()).catch(() => ({ data: [] })), // unlinked users
        fetch('/api/admin/employee-levels'),
        fetch('/api/hr/work-schedules'),
      ]);

      const [deptData, clientData, levelData, schedData] = await Promise.all([
        deptRes.json().catch(() => ({ data: [] })),
        clientRes,
        levelRes.json().catch(() => ({ data: [] })),
        scheduleRes.json().catch(() => ({ data: [] })),
      ]);

      setDepartments(deptData.data ?? []);
      setUserOptions(clientData.data ?? []);
      setLevels((levelData.data ?? []).sort((a: EmployeeLevelOption, b: EmployeeLevelOption) => a.position - b.position));
      setSchedules(schedData.data ?? []);

      // Fetch ATMS client inline
      const clientsRaw = await fetch('/api/admin/users').then((r) => r.json()).catch(() => ({ data: [] }));
      void clientsRaw; // For now, we'll just always use ATMS — fetched separately

      // Get the ATMS client from a dedicated search
      const atmsRes = await fetch('/api/hr/clients').catch(() => null);
      if (atmsRes?.ok) {
        const atmsData = (await atmsRes.json()) as { data: ClientOption[] };
        setClients(atmsData.data ?? []);
      }
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

  /* ─── Prev open state to trigger fetch ────────────────────────── */
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep(1);
      setCreatedEmployeeId(null);
      setCreatedEmploymentId(null);
      setCreatedContractId(null);
      setS1({ firstName: '', middleName: '', lastName: '', birthDate: '', gender: '',
               phone: '', address: '', email: '', employeeNo: '',
               userLinkMode: 'none', selectedUserId: '',
               newUserName: '', newUserEmail: '', newUserPassword: '', newUserRole: 'EMPLOYEE' });
      setS2({ clientId: '', departmentId: '', positionId: '', employmentType: '',
               employeeLevelId: '', hireDate: '', regularizationDate: '' });
      setS3({ contractType: '', status: 'DRAFT', contractStart: '', contractEnd: '',
               workingHoursPerWeek: '', notes: '' });
      setS3c(DEFAULT_S3C);
      setS4(DEFAULT_STEP4);
      setEmpNoConflict(false);
      setUserSearch('');
      void fetchOptions();
    }
  }

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
      // ── 1. Create the contract ──────────────────────────────────
      const contractRes = await fetch(`/api/hr/employees/${createdEmployeeId}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employmentId: createdEmploymentId,
          contractType: s3.contractType,
          status: s3.status,
          contractStart: s3.contractStart,
          contractEnd: s3.contractEnd || null,
          workingHoursPerWeek: s3.workingHoursPerWeek ? parseInt(s3.workingHoursPerWeek, 10) : null,
          notes: s3.notes || null,
        }),
      });

      const contractData = (await contractRes.json()) as { data?: { id: number }; error?: string };
      if (!contractRes.ok) {
        error('Failed to save contract', contractData.error ?? 'An error occurred.');
        setLoading(false);
        return;
      }

      const newContractId = contractData.data!.id;
      setCreatedContractId(newContractId);

      // ── 2. Create the compensation (if baseRate is provided) ────
      if (s3c.baseRate.trim()) {
        const compRes = await fetch(`/api/hr/employees/${createdEmployeeId}/compensation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractId: newContractId,
            baseRate: s3c.baseRate,
            allowanceRate: s3c.allowanceRate || '0',
            rateType: s3c.rateType,
            frequency: s3c.frequency,
            payType: s3c.payType,
            disbursementType: s3c.disbursementType,
            bankDetails: s3c.bankDetails || null,
            isPaidRestDays: s3c.isPaidRestDays,
            restDaysPerWeek: s3c.restDaysPerWeek,
            deductSss: s3c.deductSss,
            deductPhilhealth: s3c.deductPhilhealth,
            deductPagibig: s3c.deductPagibig,
            pagibigType: s3c.pagibigType,
            deductTax: false,
          }),
        });

        const compData = (await compRes.json()) as { data?: unknown; error?: string };
        if (!compRes.ok) {
          error('Failed to save compensation', compData.error ?? 'An error occurred.');
          setLoading(false);
          return;
        }
      }

      success('Contract saved', 'Employee contract and compensation have been recorded.');
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

      // Link schedule to contract if both exist
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
      onCreated();
      onClose();
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (step < 4) setStep((s) => s + 1);
    else { onCreated(); onClose(); }
  };

  const filteredUsers = userOptions.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  /* ─── Step indicators ───────────────────────────────────────────── */

  const STEPS = [
    { num: 1, label: 'Identity' },
    { num: 2, label: 'Employment' },
    { num: 3, label: 'Contract' },
    { num: 4, label: 'Schedule' },
  ];

  /* ─── Render ────────────────────────────────────────────────────── */

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" size="2xl">
      <div className="p-6 space-y-6">

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
                  <option value="Other">Other</option>
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
                            s1.selectedUserId === u.id ? 'bg-blue-50' : ''
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

            {clients.length > 0 && (
              <div>
                <label className={labelCls}>Client / Company <span className="text-red-500">*</span></label>
                <select className={selectCls} value={s2.clientId}
                  onChange={(e) => setS2((p) => ({ ...p, clientId: e.target.value }))}>
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.businessName ?? c.portalName ?? `Client #${c.id}`}</option>
                  ))}
                </select>
              </div>
            )}

            {clients.length === 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Client/company options not available. Employment will be linked to ATMS by default.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Contract & Compensation ──────────────────── */}
        {step === 3 && (() => {
          /** Live-computed compensation values */
          const baseRateNum = parseFloat(s3c.baseRate) || 0;
          const allowanceRateNum = parseFloat(s3c.allowanceRate) || 0;
          const doleFactor = getDoleFactor(s3c.isPaidRestDays, s3c.restDaysPerWeek);
          const calcDailyRate = baseRateNum === 0 ? 0
            : s3c.rateType === 'DAILY' ? baseRateNum : (baseRateNum * 12) / doleFactor;
          const calcMonthlyRate = baseRateNum === 0 ? 0
            : s3c.rateType === 'MONTHLY' ? baseRateNum : (baseRateNum * doleFactor) / 12;
          const fmtRate = (v: number) =>
            `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Contract &amp; Compensation</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This step is optional — you can skip and add it later.</p>
              </div>

              {!createdEmploymentId && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 dark:border-amber-800 px-4 py-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    No employment record found. Go back to step 2 to add employment, or skip this step.
                  </p>
                </div>
              )}

              {/* ── Contract Details ──────────────────────────────── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">Contract Details</p>
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
                    <label className={labelCls}>Working Hours / Week</label>
                    <input type="number" className={inputCls} value={s3.workingHoursPerWeek}
                      onChange={(e) => setS3((p) => ({ ...p, workingHoursPerWeek: e.target.value }))} placeholder="40" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Notes</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={s3.notes}
                      onChange={(e) => setS3((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* ── Basic Compensation ──────────────────────────────── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">Basic Compensation</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Salary Rate (Contract Based) ₱</label>
                    <input type="number" className={inputCls} value={s3c.baseRate}
                      onChange={(e) => setS3c((p) => ({ ...p, baseRate: e.target.value }))}
                      placeholder="e.g. 540.00" min="0" step="0.01" />
                  </div>
                  <div>
                    <label className={labelCls}>Total Allowance (Contract Based) ₱</label>
                    <input type="number" className={inputCls} value={s3c.allowanceRate}
                      onChange={(e) => setS3c((p) => ({ ...p, allowanceRate: e.target.value }))}
                      placeholder="0.00" min="0" step="0.01" />
                  </div>
                </div>
              </div>

              {/* ── Salary Configuration ────────────────────────────── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">Salary Configuration</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Agreed Salary Rate</label>
                    <select className={selectCls} value={s3c.rateType}
                      onChange={(e) => setS3c((p) => ({ ...p, rateType: e.target.value as RateType }))}>
                      <option value="DAILY">Daily Rate</option>
                      <option value="MONTHLY">Monthly Rate</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Salary Frequency</label>
                    <select className={selectCls} value={s3c.frequency}
                      onChange={(e) => setS3c((p) => ({ ...p, frequency: e.target.value as SalaryFrequency }))}>
                      <option value="ONCE_A_MONTH">Once a Month</option>
                      <option value="TWICE_A_MONTH">Twice a Month</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pay Type</label>
                    <select className={selectCls} value={s3c.payType}
                      onChange={(e) => setS3c((p) => ({ ...p, payType: e.target.value as PayType }))}>
                      <option value="VARIABLE_PAY">Variable Pay (Timesheet-based)</option>
                      <option value="FIXED_PAY">Fixed Pay (No timesheet needed)</option>
                    </select>
                    {s3c.payType === 'VARIABLE_PAY' && (
                      <p className="text-[11px] text-muted-foreground mt-1">Pay is computed from actual timesheet hours.</p>
                    )}
                    {s3c.payType === 'FIXED_PAY' && (
                      <p className="text-[11px] text-muted-foreground mt-1">Pay is the fixed rate regardless of attendance.</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Disbursement Type</label>
                    <select className={selectCls} value={s3c.disbursementType}
                      onChange={(e) => setS3c((p) => ({ ...p, disbursementType: e.target.value as DisbursementType }))}>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="E_WALLET">E-Wallet</option>
                    </select>
                  </div>
                  {(s3c.disbursementType === 'BANK_TRANSFER' || s3c.disbursementType === 'CHEQUE' || s3c.disbursementType === 'E_WALLET') && (
                    <div className="md:col-span-2">
                      <label className={labelCls}>Bank / Account Details</label>
                      <input className={inputCls} value={s3c.bankDetails}
                        onChange={(e) => setS3c((p) => ({ ...p, bankDetails: e.target.value }))}
                        placeholder="Bank name, account number" />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Rest Days Configuration ──────────────────────────── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">Rest Days Configuration</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Paid on Rest Days</label>
                    <div className="flex gap-4 mt-1">
                      {[{ value: true, label: 'Yes' }, { value: false, label: 'No (Default)' }].map(({ value, label }) => (
                        <label key={label} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="isPaidRestDays"
                            checked={s3c.isPaidRestDays === value}
                            onChange={() => setS3c((p) => ({ ...p, isPaidRestDays: value }))}
                            className="h-4 w-4 accent-blue-600"
                          />
                          <span className="text-sm text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Rest Days per Week</label>
                    <select className={selectCls} value={s3c.restDaysPerWeek}
                      onChange={(e) => setS3c((p) => ({ ...p, restDaysPerWeek: parseInt(e.target.value, 10) }))}>
                      <option value={0}>0 rest days</option>
                      <option value={1}>1 rest day</option>
                      <option value={2}>2 rest days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Government Benefits Registration ─────────────────── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">Government Benefits Registration</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SSS */}
                  <div>
                    <label className={labelCls}>SSS Registration</label>
                    <div className="flex gap-4 mt-1">
                      {([{ value: true, label: 'Yes' }, { value: false, label: 'No' }] as const).map(({ value, label: l }) => (
                        <label key={l} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="aem-deductSss" checked={s3c.deductSss === value} onChange={() => setS3c((p) => ({ ...p, deductSss: value }))} className="h-4 w-4 accent-blue-600" />
                          <span className="text-sm text-foreground">{l}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* PhilHealth */}
                  <div>
                    <label className={labelCls}>PhilHealth Registration</label>
                    <div className="flex gap-4 mt-1">
                      {([{ value: true, label: 'Yes' }, { value: false, label: 'No' }] as const).map(({ value, label: l }) => (
                        <label key={l} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="aem-deductPhilhealth" checked={s3c.deductPhilhealth === value} onChange={() => setS3c((p) => ({ ...p, deductPhilhealth: value }))} className="h-4 w-4 accent-blue-600" />
                          <span className="text-sm text-foreground">{l}</span>
                        </label>
                      ))}
                    </div>
                    {s3c.deductPhilhealth && (
                      <p className="mt-1 text-[11px] text-muted-foreground">2.5% of monthly salary</p>
                    )}
                  </div>

                  {/* Pag-IBIG */}
                  <div>
                    <label className={labelCls}>Pag-IBIG Registration</label>
                    <div className="flex gap-4 mt-1">
                      {([{ value: true, label: 'Yes' }, { value: false, label: 'No' }] as const).map(({ value, label: l }) => (
                        <label key={l} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="aem-deductPagibig" checked={s3c.deductPagibig === value} onChange={() => setS3c((p) => ({ ...p, deductPagibig: value }))} className="h-4 w-4 accent-blue-600" />
                          <span className="text-sm text-foreground">{l}</span>
                        </label>
                      ))}
                    </div>
                    {s3c.deductPagibig && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] font-semibold text-muted-foreground">Contribution type:</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="aem-pagibigType" checked={s3c.pagibigType === 'REGULAR'} onChange={() => setS3c((p) => ({ ...p, pagibigType: 'REGULAR' }))} className="h-4 w-4 accent-blue-600" />
                          <span className="text-sm text-foreground">Regular (2%)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="aem-pagibigType" checked={s3c.pagibigType === 'MINIMUM'} onChange={() => setS3c((p) => ({ ...p, pagibigType: 'MINIMUM' }))} className="h-4 w-4 accent-blue-600" />
                          <span className="text-sm text-foreground">Minimum (₱200)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Calculated Rates (read-only) ──────────────────────── */}
              {baseRateNum > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">Calculated Rates</p>
                  <div className="rounded-xl bg-blue-50 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Salary Basis</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{s3c.rateType === 'DAILY' ? 'Daily Rate' : 'Monthly Rate'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">DOLE Factor</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{doleFactor}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Daily Rate</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">{fmtRate(calcDailyRate)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Monthly Rate (EEMR)</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">{fmtRate(calcMonthlyRate)}</p>
                      </div>
                    </div>
                    {allowanceRateNum > 0 && (
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Allowance Rate</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{fmtRate(allowanceRateNum)}</p>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Formula: {s3c.rateType === 'DAILY'
                        ? `Monthly = (${fmtRate(calcDailyRate)} × ${doleFactor}) ÷ 12`
                        : `Daily = (${fmtRate(calcMonthlyRate)} × 12) ÷ ${doleFactor}`}
                    </p>
                  </div>
                  {s3c.baseRate.trim() && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      Note: Saving will activate this compensation and deactivate any previous active compensation for this contract.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Skip — only steps 2-4 */}
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

            {/* Primary action */}
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
    </Modal>
  );
}
