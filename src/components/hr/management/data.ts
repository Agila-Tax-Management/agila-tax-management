import type { Department } from '@/lib/mock-hr-data';

export const HR_DEPARTMENTS: Department[] = [
  'Sales',
  'Accounting',
  'Compliance',
  'Liaison',
  'Account Officer',
  'HR',
  'IT',
  'Admin',
];

export interface MockDepartment {
  id: number;
  name: string;
  head: string;
  employeeCount: number;
  description: string;
}

export interface MockTeam {
  id: number;
  name: string;
  department: string;
  leader: string;
  memberCount: number;
}

export interface MockPosition {
  id: number;
  title: string;
  department: string;
  level: string;
  employeeCount: number;
}

export const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: 1, name: 'Sales', head: 'Maria Santos', employeeCount: 5, description: 'Handles client acquisition and service plans' },
  { id: 2, name: 'Accounting', head: 'Juan Cruz', employeeCount: 4, description: 'Financial reporting, billing, and invoicing' },
  { id: 3, name: 'Compliance', head: 'Ana Reyes', employeeCount: 6, description: 'Tax compliance and regulatory filings' },
  { id: 4, name: 'Liaison', head: 'Carlos Garcia', employeeCount: 3, description: 'Field operations and government liaising' },
  { id: 5, name: 'Account Officer', head: 'Patricia Lim', employeeCount: 4, description: 'Client account management and coordination' },
  { id: 6, name: 'HR', head: 'Rosa Mendoza', employeeCount: 3, description: 'Human resources and employee welfare' },
  { id: 7, name: 'IT', head: 'Mark Villanueva', employeeCount: 3, description: 'Systems development and technical support' },
  { id: 8, name: 'Admin', head: 'Elena Torres', employeeCount: 2, description: 'Administrative support and office management' },
];

export const MOCK_TEAMS: MockTeam[] = [
  { id: 1, name: 'Sales Team Alpha', department: 'Sales', leader: 'Maria Santos', memberCount: 3 },
  { id: 2, name: 'Sales Team Beta', department: 'Sales', leader: 'Roberto Tan', memberCount: 2 },
  { id: 3, name: 'Compliance Core', department: 'Compliance', leader: 'Ana Reyes', memberCount: 4 },
  { id: 4, name: 'Compliance Support', department: 'Compliance', leader: 'David Aquino', memberCount: 2 },
  { id: 5, name: 'Field Ops', department: 'Liaison', leader: 'Carlos Garcia', memberCount: 3 },
  { id: 6, name: 'Finance Team', department: 'Accounting', leader: 'Juan Cruz', memberCount: 4 },
  { id: 7, name: 'Dev Team', department: 'IT', leader: 'Mark Villanueva', memberCount: 3 },
  { id: 8, name: 'Client Services', department: 'Account Officer', leader: 'Patricia Lim', memberCount: 4 },
];

export const MOCK_POSITIONS: MockPosition[] = [
  { id: 1, title: 'Sales Manager', department: 'Sales', level: 'Manager', employeeCount: 1 },
  { id: 2, title: 'Sales Associate', department: 'Sales', level: 'Staff', employeeCount: 4 },
  { id: 3, title: 'Senior Accountant', department: 'Accounting', level: 'Senior', employeeCount: 1 },
  { id: 4, title: 'Junior Accountant', department: 'Accounting', level: 'Junior', employeeCount: 3 },
  { id: 5, title: 'Compliance Officer', department: 'Compliance', level: 'Staff', employeeCount: 4 },
  { id: 6, title: 'Compliance Manager', department: 'Compliance', level: 'Manager', employeeCount: 1 },
  { id: 7, title: 'Liaison Officer', department: 'Liaison', level: 'Staff', employeeCount: 2 },
  { id: 8, title: 'Liaison Supervisor', department: 'Liaison', level: 'Supervisor', employeeCount: 1 },
  { id: 9, title: 'Account Officer', department: 'Account Officer', level: 'Staff', employeeCount: 3 },
  { id: 10, title: 'Account Manager', department: 'Account Officer', level: 'Manager', employeeCount: 1 },
  { id: 11, title: 'HR Officer', department: 'HR', level: 'Staff', employeeCount: 2 },
  { id: 12, title: 'HR Manager', department: 'HR', level: 'Manager', employeeCount: 1 },
  { id: 13, title: 'Jr. Website Developer', department: 'IT', level: 'Junior', employeeCount: 1 },
  { id: 14, title: 'Sr. Systems Developer', department: 'IT', level: 'Senior', employeeCount: 1 },
  { id: 15, title: 'IT Manager', department: 'IT', level: 'Manager', employeeCount: 1 },
  { id: 16, title: 'Admin Assistant', department: 'Admin', level: 'Staff', employeeCount: 2 },
];
