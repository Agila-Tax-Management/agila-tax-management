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
}
