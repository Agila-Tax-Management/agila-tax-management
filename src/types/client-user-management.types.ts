export type AccountStatus = 'Active' | 'Inactive' | 'Suspended';
export type ClientUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type StatusFilter = 'All' | AccountStatus;

export const STATUS_UI_MAP: Record<ClientUserStatus, AccountStatus> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
} as const;

export const STATUS_DB_MAP: Record<AccountStatus, ClientUserStatus> = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Suspended: 'SUSPENDED',
} as const;

export interface ApiAssignment {
  clientId: number;
  clientNo: string | null;
  businessName: string | null;
  companyCode: string | null;
  portalName: string | null;
  active: boolean;
  role: string;
}

export interface ClientOption {
  id: number;
  businessName: string | null;
  companyCode: string | null;
  portalName: string | null;
  clientNo?: string | null;
}

export interface ClientUserRecord {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  status: ClientUserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  assignments: ApiAssignment[];
}

export interface ClientUserFormValues {
  name: string;
  email: string;
  accountStatus: AccountStatus;
  assignedClientIds: number[];
  password?: string;
}