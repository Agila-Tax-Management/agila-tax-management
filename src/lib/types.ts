export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  businessType: string;
  leadSource: string;
  statusId: string;
  assignedAgentId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  // Backend-ready fields for pipeline flow
  accountCreated?: boolean;   // Account created (inactive) during Waiting for Payment
  isPaid?: boolean;           // Payment confirmed — gates Turnover transition
  clientNo?: string;          // Generated client number after account creation
}

// ── Portal Access Types ───────────────────────────────────
export type AppPortalName =
  | 'SALES'
  | 'COMPLIANCE'
  | 'LIAISON'
  | 'ACCOUNTING'
  | 'ACCOUNT_OFFICER'
  | 'HR';

export interface PortalPermissions {
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SessionEmployee {
  id: number;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
}

export interface SessionWithAccessResponse {
  user: SessionUser;
  employee: SessionEmployee | null;
  portalAccess: Record<AppPortalName, PortalPermissions>;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Generated when lead reaches Turnover (id 10)
export interface TurnoverDocuments {
  jobOrderNo: string;
  invoiceNo: string;
  tosNo: string;
  generatedAt: string;
}

// Service plan types
export interface ServiceItem {
  id: string;
  name: string;
  teamInCharge: string;
  government: string;
  rate: number;
}

// ── Client Types ──────────────────────────────────────────
export interface ClientService {
  id: string;
  serviceId: string;
  serviceName: string;
  rate: number;
}

export interface ClientPlanDetails {
  basePlan: string;
  displayName: string;
  customFeaturesIncluded: string[];
  customFeaturesMore: string[];
  customFreebies: string[];
  customPrice: string;
  selectedServiceIds: string[];
  _compliance?: {
    bir?: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
    sec?: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
    mayorsPermit?: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
    dti?: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
    birDeadline?: string;
    secDeadline?: string;
    mayorsPermitDeadline?: string;
    dtiDeadline?: string;
  };
}

export interface Client {
  id: string;
  clientNo: string;
  businessName: string;
  companyCode: string;
  authorizedRep: string;
  email: string;
  phone: string;
  status: string;
  agentId: string;
  planDetails: ClientPlanDetails | null;
  clientServices: ClientService[];
  isPaid: boolean;
  commissionPaid: boolean;
  finalAmount: number;
  hasUpsell: boolean;
  upsellAmount: number;
  createdAt: string;
}

// ── Account Officer Types ─────────────────────────────────
export type AOTaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';
export type AOTaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface AOTeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string; // initials
  department: string;
}

export interface AOTaskComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AOTaskSubtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface AOTask {
  id: string;
  title: string;
  description: string;
  status: AOTaskStatus;
  priority: AOTaskPriority;
  clientId: string;
  assigneeId: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  comments: AOTaskComment[];
  tags: string[];
  subtasks?: AOTaskSubtask[];
}

export interface AONotification {
  id: string;
  type: 'status_change' | 'comment' | 'assignment' | 'message';
  title: string;
  message: string;
  taskId?: string;
  clientId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AODiscussionMessage {
  id: string;
  clientId: string;
  senderId: string;
  senderName: string;
  senderRole: 'account-officer' | 'client';
  content: string;
  createdAt: string;
}
