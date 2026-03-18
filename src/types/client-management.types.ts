// src/components/dashboard/client-management.types.ts

export type ClientBusinessType =
  | 'INDIVIDUAL'
  | 'SOLE_PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'CORPORATION'
  | 'COOPERATIVE';

export type ClientStatusFilter = 'All' | 'Active' | 'Inactive';

export interface ClientOwner {
  id: string;
  name: string | null;
  email: string;
  status: string;
}

export interface ClientRecord {
  id: number;
  companyCode: string | null;
  clientNo: string | null;
  businessName: string | null;
  portalName: string | null;
  businessType: string | null;
  branchType: string | null;
  active: boolean;
  timezone: string | null;
  createdAt: string | null;
  owner: ClientOwner | null;
  userCount: number;
}

export interface ClientUserEmployment {
  id: number;
  employmentType: string | null;
  department: { id: number; name: string } | null;
  position: { id: number; title: string } | null;
}

export interface ClientUserMember {
  id: string;
  name: string | null;
  email: string;
  status: string;
  active: boolean;
  role: string;
  createdAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employment: ClientUserEmployment | null;
  } | null;
}

export interface ClientFormValues {
  companyCode: string;
  clientNo: string;
  businessName: string;
  portalName: string;
  businessType: ClientBusinessType;
  branchType: string;
  timezone: string;
}
