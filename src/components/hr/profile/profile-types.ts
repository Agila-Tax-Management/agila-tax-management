// src/components/hr/profile/profile-types.ts

export type ProfileTab = 'personal' | 'government-ids' | 'documents' | 'employment' | 'contracts' | 'leave-credits';

export type EmploymentTypeOption = 'Regular' | 'Probationary' | 'Contractual' | 'Project Based' | 'Part Time' | 'Intern';
export type ContractTypeOption = 'Probationary' | 'Regular' | 'Contractual' | 'Project Based' | 'Consultant' | 'Intern';
export type PayMethodOption = 'Cash Salary' | 'Fund Transfer';

export interface GovernmentIdsState {
  sss: string;
  pagibig: string;
  philhealth: string;
  tin: string;
}

// ─── Employment ──────────────────────────────────────────────────

export interface EmploymentRecord {
  id: number;
  clientId: number;
  clientName: string;
  departmentId: number | null;
  department: string;
  positionId: number | null;
  position: string;
  employmentType: string;
  employeeLevelId: number | null;
  reportingManagerId: number | null;
  hireDate: string;
  regularizationDate: string | null;
  endDate: string | null;
  status: string;
}

export interface EmploymentFormState {
  clientId: string;
  departmentId: string;
  positionId: string;
  employeeLevelId: string;
  employmentType: string;
  employmentStatus: string;
  hireDate: string;
  regularizationDate: string;
  endDate: string;
  reportingManagerId: string;
}

// ─── Schedule ───────────────────────────────────────────────────

export interface ScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  isWorkingDay: boolean;
}

export interface ScheduleOption {
  id: number;
  name: string;
  timezone: string;
  days: ScheduleDay[];
}

// ─── Contracts ───────────────────────────────────────────────────

export interface ContractRecord {
  id: number;
  employmentId: number;
  departmentName: string;
  positionTitle: string;
  contractType: string;
  startDate: string;
  endDate: string | null;
  status: string;
  scheduleId: number | null;
  workingHoursPerWeek: number | null;
  notes: string | null;
}

export interface CompensationRecord {
  id: string;
  contractId: number;
  baseRate: string;
  allowanceRate: string;
  rateType: 'DAILY' | 'MONTHLY';
  frequency: 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
  payType: 'FIXED_PAY' | 'VARIABLE_PAY';
  disbursementType: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'E_WALLET';
  bankDetails: string | null;
  isPaidRestDays: boolean;
  restDaysPerWeek: number;
  doleFactor: string;
  deductSss: boolean;
  deductPhilhealth: boolean;
  deductPagibig: boolean;
  pagibigType: 'REGULAR' | 'MINIMUM';
  deductTax: boolean;
  calculatedDailyRate: string;
  calculatedMonthlyRate: string;
  allowanceOnFirstCutoffOnly: boolean;
  payrollScheduleId: string | null;
  isActive: boolean;
  effectiveDate: string;
  createdAt: string;
}

export interface ContractFormState {
  employmentId: string;
  contractType: string;
  startDate: string;
  endDate: string;
  monthlyRate: string;
  dailyRate: string;
  hourlyRate: string;
  disbursedMethod: string;
  workingHoursPerWeek: string;
  scheduleId: string;
  bankDetails: string;
  notes: string;
}

export interface PersonalInfoFormState {
  // Name
  employeeNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  // Personal
  birthDate: string;
  placeOfBirth: string;
  gender: string;
  civilStatus: string;
  phone: string;
  personalEmail: string;
  email: string;
  // Employment (display only)
  department: string;
  position: string;
  hireDate: string;
  employmentType: string;
  employmentStatus: string;
  // Current Address
  currentStreet: string;
  currentBarangay: string;
  currentCity: string;
  currentProvince: string;
  currentZip: string;
  // Permanent Address
  permanentStreet: string;
  permanentBarangay: string;
  permanentCity: string;
  permanentProvince: string;
  permanentZip: string;
  // Education
  educationalBackground: string;
  school: string;
  course: string;
  yearGraduated: string;
  certifications: string;
}

export const DOCUMENT_LABELS = [
  'Resume',
  'Birth Certificate',
  'Valid ID',
  'NBI Clearance',
  'Barangay Clearance',
  'Medical Results',
  'Bank QR',
] as const;

export type DocumentLabel = (typeof DOCUMENT_LABELS)[number];

export type DocumentState = Record<DocumentLabel, string | null>;
