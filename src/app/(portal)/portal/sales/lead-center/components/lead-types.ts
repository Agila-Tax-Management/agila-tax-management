// src/app/(portal)/portal/sales/lead-center/components/lead-types.ts
// Shared Lead-related interfaces used across lead-center components.
// Kept in a separate file to break circular import cycles.

export interface LeadStatus {
  id: number;
  name: string;
  color: string | null;
  sequence: number;
  isOnboarding: boolean;
  isConverted: boolean;
}

export interface AssignedAgent {
  id: string;
  name: string;
  email: string;
}

export interface LeadServicePlan {
  id: number;
  name: string;
  serviceRate: string;
  recurring: string;
}

export interface LeadServiceOneTime {
  id: number;
  name: string;
  serviceRate: string;
}

export interface LeadPromo {
  id: number;
  name: string;
  code: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountRate: string;
  promoFor: 'SERVICE_PLAN' | 'SERVICE_ONE_TIME' | 'BOTH';
}

export interface Lead {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  businessName: string | null;
  contactNumber: string | null;
  businessType: string;
  leadSource: string;
  address: string | null;
  notes: string | null;
  statusId: number;
  status: LeadStatus;
  assignedAgentId: string | null;
  assignedAgent: AssignedAgent | null;
  isAccountCreated: boolean;
  isSignedTSA: boolean;
  signedTsaUrl: string | null;
  isCreatedJobOrder: boolean;
  isCallRequest: boolean;
  phoneCallSchedule: string | null;
  isOfficeVisit: boolean;
  officeVisitSchedule: string | null;
  isClientVisit: boolean;
  clientVisitSchedule: string | null;
  clientVisitLocation: string | null;
  isVirtualMeeting: boolean;
  virtualMeetingSchedule: string | null;
  onboardingSchedule: string | null;
  servicePlans: LeadServicePlan[];
  serviceOneTimePlans: LeadServiceOneTime[];
  promo: LeadPromo | null;
  invoices: { id: string; invoiceNumber: string; status: string }[];
  createdAt: string;
  updatedAt: string;
}
