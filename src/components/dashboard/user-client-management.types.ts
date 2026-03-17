export type AccountStatus = 'Active' | 'Inactive' | 'Suspended';

export type StatusFilter = 'All' | AccountStatus;

export interface ClientOption {
  id: number;
  clientNo: string;
  businessName: string;
  companyCode: string;
  portalName: string;
  active: boolean;
}

export interface ClientUserRecord {
  id: string;
  name: string;
  email: string;
  active: boolean;
  accountStatus: AccountStatus;
  assignedClientIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientUserFormValues {
  name: string;
  email: string;
  accountStatus: AccountStatus;
  assignedClientIds: number[];
}