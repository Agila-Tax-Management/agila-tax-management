// src/types/sales-client-list.types.ts

export interface ClientSubscriptionInfo {
  id: number;
  servicePlanId: number;
  servicePlanName: string;
  agreedRate: number;
  billingCycle: string;
  inclusions: { id: number; name: string; category: string | null }[];
}

export interface ClientListRecord {
  id: number;
  clientNo: string | null;
  businessName: string;
  companyCode: string | null;
  businessEntity: string;
  active: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  authorizedRep: string | null;
  activeSubscription: ClientSubscriptionInfo | null;
}

export interface ClientDetailRecord extends ClientListRecord {
  lead: {
    id: number;
    firstName: string;
    lastName: string;
    businessName: string | null;
  } | null;
  recentJobOrders: {
    id: string;
    jobOrderNumber: string;
    status: string;
    date: string;
    items: {
      id: string;
      itemType: string;
      serviceName: string;
      rate: number;
      total: number;
    }[];
  }[];
}

export interface ServicePlanOption {
  id: number;
  name: string;
  serviceRate: number;
  inclusions: { id: number; name: string; category: string | null }[];
}

export interface OneTimeServiceOption {
  id: number;
  name: string;
  serviceRate: number;
  governmentOffices: { id: number; code: string; name: string }[];
  inclusions: { id: number; name: string; category: string | null }[];
}
