// src/types/accounting.types.ts

export type InvoiceStatus =
  | 'DRAFT'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID';

export type PaymentMethodType =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CHECK'
  | 'E_WALLET'
  | 'CREDIT_CARD';

export type InvoiceChangeType =
  | 'INVOICE_CREATED'
  | 'INVOICE_UPDATED'
  | 'STATUS_CHANGED'
  | 'DUE_DATE_CHANGED'
  | 'PAYMENT_ADDED'
  | 'PAYMENT_VOIDED'
  | 'ITEM_ADDED'
  | 'ITEM_REMOVED'
  | 'INVOICE_VOIDED';

export interface InvoiceItemRecord {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  remarks: string | null;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  unusedAmount: number;
  paymentDate: string;
  method: PaymentMethodType;
  referenceNumber: string | null;
  proofOfPaymentUrl: string | null;
  notes: string | null;
  recordedBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface InvoiceHistoryRecord {
  id: string;
  actorId: string | null;
  actor: { id: string; name: string } | null;
  changeType: InvoiceChangeType;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  clientId: number | null;
  client: {
    id: number;
    businessName: string;
    clientNo: string | null;
    businessEntity: string;
  } | null;
  leadId: number | null;
  lead: {
    id: number;
    firstName: string;
    middleName: string | null;
    lastName: string;
    businessName: string | null;
    businessType: string;
  } | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  balanceDue: number;
  notes: string | null;
  terms: string | null;
  items: InvoiceItemRecord[];
  payments: PaymentRecord[];
  historyLogs: InvoiceHistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListRecord
  extends Omit<InvoiceRecord, 'items' | 'payments' | 'historyLogs'> {
  items?: never;
  payments?: never;
  historyLogs?: never;
}

export interface InvoiceStats {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueCount: number;
}

export interface ClientOption {
  type: 'client' | 'lead';
  id: number;
  label: string;
  subLabel: string;
  fullName: string;
  businessName: string | null;
  businessType: string | null;
}

export interface ServiceOption {
  id: number;
  type: 'plan' | 'one-time';
  name: string;
  rate: number;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  remarks: string;
}

export interface CreateInvoiceInput {
  clientId?: number;
  leadId?: number;
  dueDate: string;
  notes?: string;
  terms?: string;
  items: InvoiceItemInput[];
}

export interface UpdateInvoiceInput {
  dueDate?: string;
  notes?: string | null;
  terms?: string | null;
  status?: InvoiceStatus;
  items?: InvoiceItemInput[];
}

export interface RecordPaymentInput {
  amount: number;
  paymentDate: string;
  method: PaymentMethodType;
  referenceNumber?: string;
  notes?: string;
}
