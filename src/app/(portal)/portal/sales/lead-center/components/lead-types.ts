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

export interface LeadPromo {
  id: number;
  name: string;
  code: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountRate: string;
}

export interface QuoteLineItemService {
  id: number;
  name: string;
  billingType: 'RECURRING' | 'ONE_TIME';
  frequency: string;
}

export interface QuoteLineItem {
  id: string;
  serviceId: number;
  service: QuoteLineItemService;
  sourcePackageId: number | null;
  sourcePackage: { id: number; name: string } | null;
  customName: string | null;
  quantity: number;
  negotiatedRate: string;
  isVatable: boolean;
}

export interface LeadQuote {
  id: string;
  quoteNumber: string;
  status: 'DRAFT' | 'SENT_TO_CLIENT' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED';
  lineItems: QuoteLineItem[];
  subTotal: string;
  totalDiscount: string;
  grandTotal: string;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadTsaInfo {
  id: string;
  referenceNumber: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_CLIENT' | 'SIGNED' | 'VOID';
  documentDate: string;
  businessName: string;
  quoteId: string | null;
  pdfUrl: string | null;
  clientSignedAt: string | null;
  assignedApproverId: string | null;
  assignedApprover: { id: string; name: string; email: string; image: string | null } | null;
  actualApproverId: string | null;
  actualApprover: { id: string; name: string; email: string; image: string | null } | null;
  approvedAt: string | null;
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
  isCreatedInvoice: boolean;
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
  quotes: LeadQuote[];
  tsaContracts: LeadTsaInfo[];
  promo: LeadPromo | null;
  invoices: { id: string; invoiceNumber: string; status: string }[];
  jobOrders: { id: string; jobOrderNumber: string }[];
  createdAt: string;
  updatedAt: string;
}
