// src/components/hr/profile/profile-types.ts

export type ProfileTab = 'personal' | 'government-ids' | 'documents' | 'employment' | 'contracts' | 'app-access';

export type AppAccessKey = 'sales' | 'compliance' | 'liaison' | 'accounting' | 'accountOfficer' | 'hr' | 'taskManagement';

export type EmploymentTypeOption = 'Regular' | 'Probationary' | 'Contractual' | 'Project Based' | 'Part Time' | 'Intern';
export type ContractTypeOption = 'Probationary' | 'Regular' | 'Contractual' | 'Project Based' | 'Consultant' | 'Intern';
export type PayMethodOption = 'Cash Salary' | 'Fund Transfer';

export interface GovernmentIdsState {
  sss: string;
  pagibig: string;
  philhealth: string;
  tin: string;
}

export interface EmploymentRecord {
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

export interface EmploymentFormState {
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

export interface ContractRecord {
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

export interface ContractFormState {
  employmentId: string;
  contractType: ContractTypeOption;
  startDate: string;
  endDate: string;
  salary: string;
  payMethod: PayMethodOption;
  workHours: string;
  notes: string;
}

export interface AppAccessState {
  sales: boolean;
  compliance: boolean;
  liaison: boolean;
  accounting: boolean;
  accountOfficer: boolean;
  hr: boolean;
  taskManagement: boolean;
}

export interface PersonalInfoFormState {
  employeeNo: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  phone: string;
  hireDate: string;
  employmentType: EmploymentTypeOption;
  employmentStatus: string;
  birthDate: string;
  gender: string;
  address: string;
  email: string;
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
