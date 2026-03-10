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
