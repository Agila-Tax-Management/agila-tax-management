-- CreateEnum
CREATE TYPE "FinancialStatementGroup" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHECK', 'E_WALLET', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PaymentChangeType" AS ENUM ('PAYMENT_RECORDED', 'PAYMENT_UPDATED', 'ALLOCATION_MODIFIED', 'STATUS_CHANGED', 'PAYMENT_VOIDED');

-- CreateEnum
CREATE TYPE "InvoiceItemCategory" AS ENUM ('SERVICE_FEE', 'TAX_REIMBURSEMENT', 'GOV_FEE_REIMBURSEMENT', 'OUT_OF_POCKET');

-- CreateEnum
CREATE TYPE "InvoiceChangeType" AS ENUM ('INVOICE_CREATED', 'INVOICE_UPDATED', 'STATUS_CHANGED', 'DUE_DATE_CHANGED', 'PAYMENT_ADDED', 'PAYMENT_VOIDED', 'ITEM_ADDED', 'ITEM_REMOVED', 'INVOICE_VOIDED');

-- CreateEnum
CREATE TYPE "SubscriptionChangeType" AS ENUM ('SUBSCRIPTION_CREATED', 'RATE_CHANGED', 'PLAN_CHANGED', 'PAUSED', 'REACTIVATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "JournalTransactionType" AS ENUM ('JOURNAL_ENTRY', 'INVOICE', 'PAYMENT', 'EXPENSE', 'RECEIPT');

-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED');

-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('PENDING', 'PREPARING', 'FOR_REVIEW', 'FILED', 'LATE_FILED');

-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('PENDING', 'AWAITING_VERIFICATION', 'AWAITING_PAYMENT_PROCESS', 'AWAITING_PAYMENT_APPROVAL', 'AWAITING_FINAL_APPROVAL', 'PAID', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ZeroFilingStatus" AS ENUM ('NONE', 'REQUESTED', 'CONFIRMED_ZERO');

-- CreateEnum
CREATE TYPE "ComplianceType" AS ENUM ('NONE', 'EWT', 'COMPENSATION', 'PERCENTAGE', 'VAT', 'INCOME_TAX', 'SSS', 'PHILHEALTH', 'PAGIBIG', 'LGU_RENEWAL');

-- CreateEnum
CREATE TYPE "OvertimeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CoaActionType" AS ENUM ('TIME_IN', 'LUNCH_START', 'LUNCH_END', 'TIME_OUT');

-- CreateEnum
CREATE TYPE "CoaRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'INCOMPLETE', 'PAID_LEAVE', 'UNPAID_LEAVE', 'DAY_OFF', 'REGULAR_HOLIDAY', 'SPECIAL_HOLIDAY');

-- CreateEnum
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('DRAFT', 'PROCESSING', 'APPROVED', 'PAID', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisbursedStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('REGULAR', 'SPECIAL_NON_WORKING', 'SPECIAL_WORKING', 'LOCAL_HOLIDAY');

-- CreateEnum
CREATE TYPE "CashAdvanceStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalaryRateType" AS ENUM ('DAILY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "SalaryFrequency" AS ENUM ('ONCE_A_MONTH', 'TWICE_A_MONTH', 'WEEKLY');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('FIXED_PAY', 'VARIABLE_PAY');

-- CreateEnum
CREATE TYPE "DisbursementType" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'E_WALLET');

-- CreateEnum
CREATE TYPE "PagibigContributionType" AS ENUM ('REGULAR', 'MINIMUM');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'VIEWED', 'EXPORTED', 'IMPORTED', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'PERMISSION_CHANGE', 'ASSIGNED', 'UNASSIGNED', 'APPROVED', 'REJECTED', 'SUBMITTED', 'CANCELLED', 'ARCHIVED', 'RESTORED');

-- CreateEnum
CREATE TYPE "AppPortal" AS ENUM ('SALES', 'COMPLIANCE', 'LIAISON', 'ACCOUNTING', 'OPERATIONS_MANAGEMENT', 'HR', 'TASK_MANAGEMENT', 'CLIENT_RELATIONS');

-- CreateEnum
CREATE TYPE "PortalRole" AS ENUM ('VIEWER', 'USER', 'ADMIN', 'SETTINGS');

-- CreateEnum
CREATE TYPE "ClientUserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ClientPortalRole" AS ENUM ('OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER');

-- CreateEnum
CREATE TYPE "BusinessEntity" AS ENUM ('INDIVIDUAL', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'CORPORATION', 'COOPERATIVE');

-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('MAIN', 'BRANCH');

-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('OWNED', 'RENTED', 'FREE_USE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('REGULAR', 'PROBATIONARY', 'CONTRACTUAL', 'PROJECT_BASED', 'PART_TIME', 'INTERN');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'TERMINATED', 'ON_LEAVE', 'SUSPENDED', 'RETIRED');

-- CreateEnum
CREATE TYPE "DisbursedMethod" AS ENUM ('CASH_SALARY', 'FUND_TRANSFER');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PROBATIONARY', 'REGULAR', 'CONTRACTUAL', 'PROJECT_BASED', 'CONSULTANT', 'INTERN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "GovernmentProvider" AS ENUM ('SSS', 'PAG_IBIG', 'PhilHealth', 'BIR');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'HR', 'PAYROLL', 'TASK', 'DOCUMENT', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskChangeType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'DEPARTMENT_CHANGED', 'ASSIGNEE_CHANGED', 'PRIORITY_CHANGED', 'DUE_DATE_CHANGED', 'DETAILS_UPDATED', 'COMMENT_ADDED', 'JOB_ORDER_CHANGED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "JobOrderStatus" AS ENUM ('DRAFT', 'PENDING_ACCOUNT_ACK', 'PENDING_OPERATIONS_ACK', 'PENDING_EXECUTIVE_ACK', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobOrderItemType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "LeadChangeType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'DETAILS_UPDATED', 'SCHEDULE_UPDATED', 'INVOICE_GENERATED', 'CONTRACT_GENERATED', 'CONTRACT_SIGNED', 'TSA_GENERATED', 'TSA_SIGNED', 'JOB_ORDER_GENERATED', 'ACCOUNT_CREATED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ServiceBillingType" AS ENUM ('RECURRING', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "ServiceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'NONE');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT_TO_CLIENT', 'NEGOTIATING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TsaStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_CLIENT', 'SIGNED', 'VOID');

-- CreateTable
CREATE TABLE "account_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "group" "FinancialStatementGroup" NOT NULL,
    "normalBalance" "NormalBalance" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_detail_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "accountTypeId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_detail_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_account" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "accountCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accountTypeId" INTEGER NOT NULL,
    "accountDetailTypeId" INTEGER NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBankAccount" BOOLEAN NOT NULL DEFAULT false,
    "openingBalance" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gl_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_subscription" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "quoteLineItemId" TEXT,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "nextBillingDate" TIMESTAMP(3),
    "agreedRate" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "inactiveDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientComplianceId" TEXT,

    CONSTRAINT "client_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" INTEGER,
    "leadId" INTEGER,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_item" (
    "id" SERIAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "subscriptionId" INTEGER,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "category" "InvoiceItemCategory" NOT NULL DEFAULT 'SERVICE_FEE',
    "isVatable" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "clientId" INTEGER,
    "recordedById" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL,
    "unusedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "referenceNumber" TEXT,
    "proofOfPaymentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountApplied" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_history" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "actorId" TEXT,
    "changeType" "PaymentChangeType" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_history" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "actorId" TEXT,
    "changeType" "InvoiceChangeType" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" TEXT NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "actorId" TEXT,
    "changeType" "SubscriptionChangeType" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry" (
    "id" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "transactionDate" DATE NOT NULL,
    "transactionType" "JournalTransactionType" NOT NULL DEFAULT 'JOURNAL_ENTRY',
    "status" "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientId" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_line" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "debit" DECIMAL(15,2),
    "credit" DECIMAL(15,2),
    "description" TEXT,
    "name" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_compliance" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "processorId" TEXT,
    "verifierId" TEXT,
    "paymentProcessorId" TEXT,
    "paymentApproverId" TEXT,
    "finalApproverId" TEXT,
    "salesOfficerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_record" (
    "id" TEXT NOT NULL,
    "clientComplianceId" TEXT NOT NULL,
    "coverageDate" DATE NOT NULL,
    "deadline" DATE NOT NULL,
    "isZeroFiling" "ZeroFilingStatus" NOT NULL DEFAULT 'NONE',
    "amendmentVersion" INTEGER NOT NULL DEFAULT 0,
    "originalRecordId" TEXT,
    "clientSubscriptionId" INTEGER,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "invoiceId" TEXT,
    "assignedProcessorId" TEXT,
    "actualProcessorId" TEXT,
    "processedAt" TIMESTAMP(3),
    "assignedVerifierId" TEXT,
    "actualVerifierId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "assignedPaymentProcessorId" TEXT,
    "actualPaymentProcessorId" TEXT,
    "paymentProcessedAt" TIMESTAMP(3),
    "assignedPaymentApproverId" TEXT,
    "actualPaymentApproverId" TEXT,
    "paymentApprovedAt" TIMESTAMP(3),
    "assignedFinalApproverId" TEXT,
    "actualFinalApproverId" TEXT,
    "finalApprovedAt" TIMESTAMP(3),
    "salesOfficerId" TEXT,
    "filingStatus" "FilingStatus" NOT NULL DEFAULT 'PENDING',
    "processStatus" "ProcessStatus" NOT NULL DEFAULT 'PENDING',
    "completionRate" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_setting" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "defaultProcessorId" TEXT,
    "defaultVerifierId" TEXT,
    "defaultPaymentProcessorId" TEXT,
    "defaultPaymentApproverId" TEXT,
    "defaultFinalApproverId" TEXT,
    "defaultSalesOfficerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_document" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrls" TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_note" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ewt_item" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "invoiceItemId" INTEGER,
    "name" TEXT NOT NULL,
    "isVatable" BOOLEAN NOT NULL DEFAULT true,
    "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "netOfVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "expandedTaxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "effectiveMonth" TEXT NOT NULL,
    "fileUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ewt_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ewt_item_history" (
    "id" TEXT NOT NULL,
    "ewtItemId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "changeNotes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ewt_item_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_type" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "defaultDays" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "carryOverLimit" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "resetMonth" INTEGER,
    "resetDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_leave_credit" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "leaveTypeId" INTEGER NOT NULL,
    "allocated" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "used" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "validFrom" DATE NOT NULL,
    "expiresAt" DATE NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_leave_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_request" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "leaveTypeId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    "creditUsed" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "attachmentUrl" TEXT,
    "approvedById" TEXT,
    "approvedByClientUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtime_request" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "timeFrom" TIME NOT NULL,
    "timeTo" TIME NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "OvertimeStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedByClientUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coa_request" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "dateAffected" DATE NOT NULL,
    "actionType" "CoaActionType" NOT NULL,
    "timeValue" TIME NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "CoaRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedByClientUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coa_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_setting" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "employeeNumberPrefix" TEXT NOT NULL DEFAULT 'EMP',
    "strictOvertimeApproval" BOOLEAN NOT NULL DEFAULT true,
    "disableLateUndertimeGlobal" BOOLEAN NOT NULL DEFAULT true,
    "enableAutoTimeOut" BOOLEAN NOT NULL DEFAULT false,
    "autoTimeOutTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "HolidayType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_override" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheet" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "timeIn" TIMESTAMP(3),
    "lunchStart" TIMESTAMP(3),
    "lunchEnd" TIMESTAMP(3),
    "timeOut" TIMESTAMP(3),
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "undertimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "regularHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "regOtHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "rdHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "rdOtHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "shHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "shOtHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "shRdHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "shRdOtHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "rhHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "rhOtHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "rhRdHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "rhRdOtHours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "dailyGrossPay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_compensation" (
    "id" TEXT NOT NULL,
    "contractId" INTEGER NOT NULL,
    "baseRate" DECIMAL(10,2) NOT NULL,
    "allowanceRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "allowanceOnFirstCutoffOnly" BOOLEAN NOT NULL DEFAULT true,
    "rateType" "SalaryRateType" NOT NULL DEFAULT 'DAILY',
    "frequency" "SalaryFrequency" NOT NULL DEFAULT 'TWICE_A_MONTH',
    "payType" "PayType" NOT NULL DEFAULT 'VARIABLE_PAY',
    "disbursementType" "DisbursementType" NOT NULL DEFAULT 'CASH',
    "bankDetails" TEXT,
    "isPaidRestDays" BOOLEAN NOT NULL DEFAULT false,
    "restDaysPerWeek" INTEGER NOT NULL DEFAULT 1,
    "doleFactor" DECIMAL(5,2) NOT NULL,
    "deductSss" BOOLEAN NOT NULL DEFAULT false,
    "deductPhilhealth" BOOLEAN NOT NULL DEFAULT false,
    "deductPagibig" BOOLEAN NOT NULL DEFAULT false,
    "pagibigType" "PagibigContributionType" NOT NULL DEFAULT 'REGULAR',
    "deductTax" BOOLEAN NOT NULL DEFAULT false,
    "calculatedDailyRate" DECIMAL(10,2) NOT NULL,
    "calculatedMonthlyRate" DECIMAL(10,2) NOT NULL,
    "payrollScheduleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_compensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_period" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "payrollScheduleId" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "payoutDate" DATE NOT NULL,
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_schedule" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "SalaryFrequency" NOT NULL DEFAULT 'TWICE_A_MONTH',
    "firstPeriodStartDay" INTEGER NOT NULL,
    "firstPeriodEndDay" INTEGER NOT NULL,
    "firstPayoutDay" INTEGER NOT NULL,
    "secondPeriodStartDay" INTEGER,
    "secondPeriodEndDay" INTEGER,
    "secondPayoutDay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "totalRegularDays" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "totalRegularHours" DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    "totalOvertimeHours" DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    "totalNightDiffHours" DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    "totalHolidayHours" DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    "totalLateMins" INTEGER NOT NULL DEFAULT 0,
    "totalUndertimeMins" INTEGER NOT NULL DEFAULT 0,
    "basicPay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "holidayPay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "overtimePay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paidLeavePay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "allowance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "grossPay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "sssDeduction" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "philhealthDeduction" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "pagibigDeduction" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "withholdingTax" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "lateUndertimeDeduction" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "pagibigLoan" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "sssLoan" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "cashAdvanceRepayment" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "netPay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "preparedById" TEXT,
    "preparedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedByClientUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "acknowledgedByClientUserId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "disbursedStatus" "DisbursedStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_advance" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "principalAmount" DECIMAL(10,2) NOT NULL,
    "installmentCount" INTEGER NOT NULL,
    "installmentAmount" DECIMAL(10,2) NOT NULL,
    "remainingBalance" DECIMAL(10,2) NOT NULL,
    "grantedDate" DATE,
    "deductionStartDate" DATE,
    "remarks" TEXT,
    "status" "CashAdvanceStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedByClientUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_advance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_advance_deduction" (
    "id" TEXT NOT NULL,
    "cashAdvanceId" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "amountDeducted" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_advance_deduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER,
    "userId" TEXT,
    "clientUserId" TEXT,
    "isSystemAction" BOOLEAN NOT NULL DEFAULT false,
    "action" "LogAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app" (
    "id" TEXT NOT NULL,
    "name" "AppPortal" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_app_access" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "appId" TEXT NOT NULL,
    "role" "PortalRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_app_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atms_clients" (
    "id" SERIAL NOT NULL,
    "companyCode" TEXT,
    "clientNo" TEXT,
    "portalName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "businessEntity" "BusinessEntity" NOT NULL,
    "branchType" "BranchType" NOT NULL DEFAULT 'MAIN',
    "mainBranchId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "clientRelationOfficerId" TEXT,
    "operationsManagerId" TEXT,
    "dayResetTime" TEXT NOT NULL DEFAULT '00:00:00',
    "workingDayStarts" TEXT NOT NULL DEFAULT '09:00:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atms_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bir_information" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "tin" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL DEFAULT '0000',
    "rdoCode" TEXT NOT NULL,
    "registeredAddress" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "contactNumber" TEXT,
    "isWithholdingAgent" BOOLEAN NOT NULL DEFAULT false,
    "withholdingCategory" TEXT,
    "corUrl" TEXT,

    CONSTRAINT "bir_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_operations" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "tradeName" TEXT,
    "industry" TEXT,
    "lineOfBusiness" TEXT,
    "psicCode" TEXT,
    "businessAreaSqm" DECIMAL(10,2),
    "noOfManagers" INTEGER NOT NULL DEFAULT 0,
    "noOfSupervisors" INTEGER NOT NULL DEFAULT 0,
    "noOfRankAndFile" INTEGER NOT NULL DEFAULT 0,
    "noOfElevators" INTEGER NOT NULL DEFAULT 0,
    "noOfEscalators" INTEGER NOT NULL DEFAULT 0,
    "noOfAircons" INTEGER NOT NULL DEFAULT 0,
    "hasCctv" BOOLEAN NOT NULL DEFAULT false,
    "signboardLength" TEXT,
    "hasSignboardLight" BOOLEAN NOT NULL DEFAULT false,
    "landlineNumber" TEXT,
    "faxNumber" TEXT,
    "placeType" "PlaceType" NOT NULL DEFAULT 'RENTED',
    "lessorName" TEXT,
    "lessorAddress" TEXT,
    "monthlyRent" DECIMAL(15,2),
    "rentContractUrl" TEXT,
    "isNotarized" BOOLEAN NOT NULL DEFAULT false,
    "hasDocStamp" BOOLEAN NOT NULL DEFAULT false,
    "propertyOwner" TEXT,
    "ownedDocsUrl" TEXT,
    "ownedReason" TEXT,
    "noRentReason" TEXT,

    CONSTRAINT "business_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_details" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "secRegistrationNo" TEXT,
    "acronym" TEXT,
    "suffix" TEXT,
    "companyClassification" TEXT,
    "companySubclass" TEXT,
    "dateOfIncorporation" DATE,
    "termOfExistence" TEXT,
    "primaryPurpose" TEXT,
    "annualMeetingDate" DATE,
    "numberOfIncorporators" INTEGER,
    "hasBoardOfDirectors" BOOLEAN NOT NULL DEFAULT true,
    "authorizedCapital" DECIMAL(15,2),
    "subscribedCapital" DECIMAL(15,2),
    "paidUpCapital" DECIMAL(15,2),
    "primaryEmail" TEXT,
    "secondaryEmail" TEXT,
    "primaryContactNo" TEXT,
    "secondaryContactNo" TEXT,
    "contactPerson" TEXT,
    "authRepFirstName" TEXT,
    "authRepMiddleName" TEXT,
    "authRepLastName" TEXT,
    "authRepPosition" TEXT,
    "authRepTin" TEXT,
    "authRepDob" DATE,
    "presidentFirstName" TEXT,
    "presidentMiddleName" TEXT,
    "presidentLastName" TEXT,
    "presidentGender" TEXT,
    "presidentNationality" TEXT,
    "presidentAddress" TEXT,
    "presidentTin" TEXT,
    "presidentEmail" TEXT,
    "presidentDob" DATE,
    "treasurerFirstName" TEXT,
    "treasurerMiddleName" TEXT,
    "treasurerLastName" TEXT,
    "treasurerGender" TEXT,
    "treasurerNationality" TEXT,
    "treasurerAddress" TEXT,
    "treasurerTin" TEXT,
    "treasurerEmail" TEXT,
    "treasurerDob" DATE,
    "secretaryFirstName" TEXT,
    "secretaryMiddleName" TEXT,
    "secretaryLastName" TEXT,
    "secretaryGender" TEXT,
    "secretaryNationality" TEXT,
    "secretaryAddress" TEXT,
    "secretaryTin" TEXT,
    "secretaryEmail" TEXT,
    "secretaryDob" DATE,

    CONSTRAINT "corporate_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_shareholder" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dob" DATE,
    "nationality" TEXT,
    "gender" TEXT,
    "tin" TEXT,
    "numberOfShares" DECIMAL(15,2) NOT NULL,
    "paidUpCapital" DECIMAL(15,2) NOT NULL,
    "methodOfPayment" TEXT NOT NULL DEFAULT 'CASH',
    "orderSequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "corporate_shareholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_details" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "civilStatus" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "citizenship" TEXT NOT NULL DEFAULT 'Filipino',
    "placeOfBirth" TEXT,
    "residentialAddress" TEXT,
    "prcLicenseNo" TEXT,
    "primaryIdType" TEXT,
    "primaryIdNumber" TEXT,
    "personalEmail" TEXT,
    "mobileNumber" TEXT,
    "telephoneNumber" TEXT,
    "motherFirstName" TEXT,
    "motherMiddleName" TEXT,
    "motherLastName" TEXT,
    "fatherFirstName" TEXT,
    "fatherMiddleName" TEXT,
    "fatherLastName" TEXT,
    "spouseFirstName" TEXT,
    "spouseMiddleName" TEXT,
    "spouseLastName" TEXT,
    "spouseEmploymentStatus" TEXT,
    "spouseTin" TEXT,
    "spouseEmployerName" TEXT,
    "spouseEmployerTin" TEXT,

    CONSTRAINT "individual_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "clientUserId" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "nameExtension" TEXT,
    "username" TEXT,
    "employeeNo" TEXT,
    "email" TEXT,
    "personalEmail" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "placeOfBirth" TEXT,
    "gender" TEXT NOT NULL,
    "civilStatus" TEXT,
    "citizenship" TEXT,
    "phone" TEXT NOT NULL,
    "currentStreet" TEXT,
    "currentBarangay" TEXT,
    "currentCity" TEXT,
    "currentProvince" TEXT,
    "currentZip" TEXT,
    "permanentStreet" TEXT,
    "permanentBarangay" TEXT,
    "permanentCity" TEXT,
    "permanentProvince" TEXT,
    "permanentZip" TEXT,
    "educationalBackground" TEXT,
    "school" TEXT,
    "course" TEXT,
    "yearGraduated" TEXT,
    "certifications" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_government_ids" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "sss" TEXT,
    "pagibig" TEXT,
    "philhealth" TEXT,
    "tin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_government_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_employment" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "workEmail" TEXT,
    "workPhone" TEXT,
    "departmentId" INTEGER,
    "positionId" INTEGER,
    "teamId" INTEGER,
    "reportingManagerId" INTEGER,
    "employmentType" "EmploymentType",
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "employeeLevelId" INTEGER,
    "hireDate" TIMESTAMP(3),
    "regularizationDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isPastRole" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_employment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_contract" (
    "id" SERIAL NOT NULL,
    "employmentId" INTEGER NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3),
    "scheduleId" INTEGER,
    "workingHoursPerWeek" INTEGER,
    "signedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_day" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_schedule_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atms_submitted_documents" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "resume" TEXT,
    "birthCertificate" TEXT,
    "validId" TEXT,
    "nbiClearance" TEXT,
    "barangayClearance" TEXT,
    "medicalResults" TEXT,
    "bankQr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atms_submitted_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTeam" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "leaderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_level" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_loan" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "provider" "GovernmentProvider" NOT NULL,
    "loanType" TEXT NOT NULL,
    "principalAmount" DECIMAL(10,2) NOT NULL,
    "paymentTermsMonths" INTEGER NOT NULL,
    "installmentAmount" DECIMAL(10,2) NOT NULL,
    "remainingBalance" DECIMAL(10,2) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "grantedDate" DATE,
    "deductionStartDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_loan_deduction" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "amountDeducted" DECIMAL(10,2) NOT NULL,
    "dateDeducted" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_loan_deduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "clientUserId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daysDue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template_route" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "routeOrder" INTEGER NOT NULL DEFAULT 1,
    "daysDue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_template_route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template_subtask" (
    "id" SERIAL NOT NULL,
    "routeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subtaskOrder" INTEGER NOT NULL DEFAULT 1,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "daysDue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_template_subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_task_status" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "departmentId" INTEGER NOT NULL,
    "statusOrder" INTEGER NOT NULL DEFAULT 1,
    "isEntryStep" BOOLEAN NOT NULL DEFAULT false,
    "isExitStep" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_task_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" INTEGER,
    "templateId" INTEGER,
    "departmentId" INTEGER,
    "statusId" INTEGER,
    "assignedToId" INTEGER,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "daysDue" INTEGER,
    "dueDate" TIMESTAMP(3),
    "jobOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_subtask" (
    "id" SERIAL NOT NULL,
    "parentTaskId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "daysDue" INTEGER,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" INTEGER,

    CONSTRAINT "task_subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_history" (
    "id" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "changeType" "TaskChangeType" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_subtask_history" (
    "id" TEXT NOT NULL,
    "subtaskId" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_subtask_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_conversation" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ClientUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "clientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_user_assignment" (
    "id" SERIAL NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "role" "ClientPortalRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_user_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_order" (
    "id" TEXT NOT NULL,
    "jobOrderNumber" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "JobOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "preparedById" TEXT,
    "datePrepared" TIMESTAMP(3),
    "assignedAccountManagerId" TEXT,
    "actualAccountManagerId" TEXT,
    "dateAccountManagerAck" TIMESTAMP(3),
    "assignedOperationsManagerId" TEXT,
    "actualOperationsManagerId" TEXT,
    "dateOperationsManagerAck" TIMESTAMP(3),
    "assignedExecutiveId" TEXT,
    "actualExecutiveId" TEXT,
    "dateExecutiveAck" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_order_item" (
    "id" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "itemType" "JobOrderItemType" NOT NULL,
    "serviceId" INTEGER,
    "serviceName" TEXT NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total" DECIMAL(10,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "businessName" TEXT,
    "contactNumber" TEXT,
    "businessType" TEXT NOT NULL DEFAULT 'Not Specified',
    "leadSource" TEXT NOT NULL DEFAULT 'Facebook',
    "address" TEXT,
    "notes" TEXT,
    "facebookSenderId" TEXT,
    "facebookUrl" TEXT,
    "facebookName" TEXT,
    "statusId" INTEGER NOT NULL,
    "isCallRequest" BOOLEAN NOT NULL DEFAULT false,
    "phoneCallSchedule" TIMESTAMP(3),
    "isOfficeVisit" BOOLEAN NOT NULL DEFAULT false,
    "officeVisitSchedule" TIMESTAMP(3),
    "isClientVisit" BOOLEAN NOT NULL DEFAULT false,
    "clientVisitSchedule" TIMESTAMP(3),
    "clientVisitLocation" TEXT,
    "isVirtualMeeting" BOOLEAN NOT NULL DEFAULT false,
    "virtualMeetingSchedule" TIMESTAMP(3),
    "onboardingSchedule" TIMESTAMP(3),
    "isCreatedInvoice" BOOLEAN NOT NULL DEFAULT false,
    "isCreatedContract" BOOLEAN NOT NULL DEFAULT false,
    "isSignedTSA" BOOLEAN NOT NULL DEFAULT false,
    "isCreatedJobOrder" BOOLEAN NOT NULL DEFAULT false,
    "isAccountCreated" BOOLEAN NOT NULL DEFAULT false,
    "signedContractUrl" TEXT,
    "signedTsaUrl" TEXT,
    "signedJobOrderUrl" TEXT,
    "convertedClientId" INTEGER,
    "assignedAgentId" TEXT,
    "promoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_comment" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_history" (
    "id" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "changeType" "LeadChangeType" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_setting" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "defaultJoProcessApproverId" TEXT,
    "defaultJoOperationsApproverId" TEXT,
    "defaultJoAccountApproverId" TEXT,
    "defaultJoGeneralApproverId" TEXT,
    "defaultTsaApproverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_office" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "government_office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT,
    "region" TEXT,
    "zipCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_inclusion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_inclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "billingType" "ServiceBillingType" NOT NULL,
    "frequency" "ServiceFrequency" NOT NULL DEFAULT 'NONE',
    "serviceRate" DECIMAL(10,2) NOT NULL,
    "isVatable" BOOLEAN NOT NULL DEFAULT true,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "complianceType" "ComplianceType" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_task_template" (
    "serviceId" INTEGER NOT NULL,
    "taskTemplateId" INTEGER NOT NULL,

    CONSTRAINT "service_task_template_pkey" PRIMARY KEY ("serviceId","taskTemplateId")
);

-- CreateTable
CREATE TABLE "service_package" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "packageRate" DECIMAL(10,2) NOT NULL,
    "isVatable" BOOLEAN NOT NULL DEFAULT true,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_package_item" (
    "id" SERIAL NOT NULL,
    "packageId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "overrideRate" DECIMAL(10,2),

    CONSTRAINT "service_package_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "subTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "grandTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "validUntil" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_line_item" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "sourcePackageId" INTEGER,
    "customName" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "negotiatedRate" DECIMAL(10,2) NOT NULL,
    "isVatable" BOOLEAN NOT NULL DEFAULT true,
    "billingCycle" "BillingCycle",
    "commitmentMonths" INTEGER DEFAULT 6,

    CONSTRAINT "quote_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountRate" DECIMAL(10,2) NOT NULL,
    "minimumRate" DECIMAL(10,2),
    "maxUsage" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tsa_contract" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "leadId" INTEGER,
    "clientId" INTEGER,
    "quoteId" TEXT,
    "status" "TsaStatus" NOT NULL DEFAULT 'DRAFT',
    "documentDate" DATE NOT NULL,
    "clientNo" TEXT,
    "businessName" TEXT NOT NULL,
    "authorizedRep" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tin" TEXT,
    "civilStatus" TEXT,
    "businessAddress" TEXT,
    "residenceAddress" TEXT,
    "isBusinessRegistered" BOOLEAN NOT NULL DEFAULT true,
    "pdfUrl" TEXT,
    "lockInMonths" INTEGER NOT NULL DEFAULT 6,
    "billingCycleStart" INTEGER NOT NULL DEFAULT 1,
    "preparedById" TEXT,
    "preparedAt" TIMESTAMP(3),
    "assignedApproverId" TEXT,
    "actualApproverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "clientSignedAt" TIMESTAMP(3),
    "clientSignerName" TEXT,
    "clientSignatureIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tsa_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AutoOvertimeEmployees" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AutoOvertimeEmployees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExemptLateUndertimeEmployees" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExemptLateUndertimeEmployees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceGovOffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceGovOffices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceCities" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceCities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceInclusions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceInclusions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicePromos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePromos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_type_name_key" ON "account_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "account_detail_type_accountTypeId_name_key" ON "account_detail_type"("accountTypeId", "name");

-- CreateIndex
CREATE INDEX "gl_account_clientId_idx" ON "gl_account"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "gl_account_clientId_accountCode_key" ON "gl_account"("clientId", "accountCode");

-- CreateIndex
CREATE UNIQUE INDEX "client_subscription_quoteLineItemId_key" ON "client_subscription"("quoteLineItemId");

-- CreateIndex
CREATE INDEX "client_subscription_clientId_isActive_idx" ON "client_subscription"("clientId", "isActive");

-- CreateIndex
CREATE INDEX "client_subscription_nextBillingDate_idx" ON "client_subscription"("nextBillingDate");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_invoiceNumber_key" ON "invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_clientId_idx" ON "invoice"("clientId");

-- CreateIndex
CREATE INDEX "invoice_leadId_idx" ON "invoice"("leadId");

-- CreateIndex
CREATE INDEX "invoice_status_idx" ON "invoice"("status");

-- CreateIndex
CREATE INDEX "invoice_item_invoiceId_idx" ON "invoice_item"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_item_subscriptionId_idx" ON "invoice_item"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_paymentNumber_key" ON "payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "payment_clientId_idx" ON "payment"("clientId");

-- CreateIndex
CREATE INDEX "payment_allocation_paymentId_idx" ON "payment_allocation"("paymentId");

-- CreateIndex
CREATE INDEX "payment_allocation_invoiceId_idx" ON "payment_allocation"("invoiceId");

-- CreateIndex
CREATE INDEX "payment_history_paymentId_idx" ON "payment_history"("paymentId");

-- CreateIndex
CREATE INDEX "payment_history_paymentId_createdAt_idx" ON "payment_history"("paymentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "invoice_history_invoiceId_idx" ON "invoice_history"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_history_invoiceId_createdAt_idx" ON "invoice_history"("invoiceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "subscription_history_subscriptionId_idx" ON "subscription_history"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_history_subscriptionId_createdAt_idx" ON "subscription_history"("subscriptionId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "journal_entry_referenceNo_key" ON "journal_entry"("referenceNo");

-- CreateIndex
CREATE INDEX "journal_entry_transactionDate_idx" ON "journal_entry"("transactionDate");

-- CreateIndex
CREATE INDEX "journal_entry_clientId_idx" ON "journal_entry"("clientId");

-- CreateIndex
CREATE INDEX "journal_entry_status_idx" ON "journal_entry"("status");

-- CreateIndex
CREATE INDEX "journal_line_journalEntryId_idx" ON "journal_line"("journalEntryId");

-- CreateIndex
CREATE INDEX "journal_line_glAccountId_idx" ON "journal_line"("glAccountId");

-- CreateIndex
CREATE INDEX "client_compliance_clientId_idx" ON "client_compliance"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_compliance_clientId_serviceId_key" ON "client_compliance"("clientId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_record_clientSubscriptionId_key" ON "compliance_record"("clientSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_record_clientComplianceId_coverageDate_amendment_key" ON "compliance_record"("clientComplianceId", "coverageDate", "amendmentVersion");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_setting_clientId_key" ON "compliance_setting"("clientId");

-- CreateIndex
CREATE INDEX "compliance_document_complianceRecordId_idx" ON "compliance_document"("complianceRecordId");

-- CreateIndex
CREATE INDEX "compliance_note_complianceRecordId_idx" ON "compliance_note"("complianceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "ewt_item_invoiceItemId_key" ON "ewt_item"("invoiceItemId");

-- CreateIndex
CREATE INDEX "ewt_item_complianceRecordId_idx" ON "ewt_item"("complianceRecordId");

-- CreateIndex
CREATE INDEX "ewt_item_history_ewtItemId_idx" ON "ewt_item_history"("ewtItemId");

-- CreateIndex
CREATE INDEX "leave_type_clientId_idx" ON "leave_type"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_clientId_name_key" ON "leave_type"("clientId", "name");

-- CreateIndex
CREATE INDEX "employee_leave_credit_employeeId_idx" ON "employee_leave_credit"("employeeId");

-- CreateIndex
CREATE INDEX "employee_leave_credit_expiresAt_idx" ON "employee_leave_credit"("expiresAt");

-- CreateIndex
CREATE INDEX "leave_request_employeeId_idx" ON "leave_request"("employeeId");

-- CreateIndex
CREATE INDEX "leave_request_clientId_idx" ON "leave_request"("clientId");

-- CreateIndex
CREATE INDEX "overtime_request_employeeId_idx" ON "overtime_request"("employeeId");

-- CreateIndex
CREATE INDEX "overtime_request_clientId_idx" ON "overtime_request"("clientId");

-- CreateIndex
CREATE INDEX "coa_request_employeeId_idx" ON "coa_request"("employeeId");

-- CreateIndex
CREATE INDEX "coa_request_clientId_idx" ON "coa_request"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_setting_clientId_key" ON "hr_setting"("clientId");

-- CreateIndex
CREATE INDEX "holiday_clientId_idx" ON "holiday"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_clientId_date_key" ON "holiday"("clientId", "date");

-- CreateIndex
CREATE INDEX "schedule_override_employeeId_idx" ON "schedule_override"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_override_employeeId_date_key" ON "schedule_override"("employeeId", "date");

-- CreateIndex
CREATE INDEX "timesheet_clientId_idx" ON "timesheet"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "timesheet_employeeId_date_key" ON "timesheet"("employeeId", "date");

-- CreateIndex
CREATE INDEX "employee_compensation_contractId_isActive_idx" ON "employee_compensation"("contractId", "isActive");

-- CreateIndex
CREATE INDEX "payroll_period_clientId_idx" ON "payroll_period"("clientId");

-- CreateIndex
CREATE INDEX "payroll_period_payrollScheduleId_idx" ON "payroll_period"("payrollScheduleId");

-- CreateIndex
CREATE INDEX "payroll_schedule_clientId_idx" ON "payroll_schedule"("clientId");

-- CreateIndex
CREATE INDEX "payslip_employeeId_idx" ON "payslip"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payslip_payrollPeriodId_employeeId_key" ON "payslip"("payrollPeriodId", "employeeId");

-- CreateIndex
CREATE INDEX "cash_advance_employeeId_idx" ON "cash_advance"("employeeId");

-- CreateIndex
CREATE INDEX "cash_advance_clientId_idx" ON "cash_advance"("clientId");

-- CreateIndex
CREATE INDEX "cash_advance_deduction_cashAdvanceId_idx" ON "cash_advance_deduction"("cashAdvanceId");

-- CreateIndex
CREATE INDEX "cash_advance_deduction_payslipId_idx" ON "cash_advance_deduction"("payslipId");

-- CreateIndex
CREATE INDEX "activity_log_clientId_idx" ON "activity_log"("clientId");

-- CreateIndex
CREATE INDEX "activity_log_userId_idx" ON "activity_log"("userId");

-- CreateIndex
CREATE INDEX "activity_log_clientUserId_idx" ON "activity_log"("clientUserId");

-- CreateIndex
CREATE INDEX "activity_log_entity_entityId_idx" ON "activity_log"("entity", "entityId");

-- CreateIndex
CREATE INDEX "activity_log_action_idx" ON "activity_log"("action");

-- CreateIndex
CREATE INDEX "activity_log_createdAt_idx" ON "activity_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_name_key" ON "app"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_app_access_employeeId_appId_key" ON "employee_app_access"("employeeId", "appId");

-- CreateIndex
CREATE UNIQUE INDEX "atms_clients_companyCode_key" ON "atms_clients"("companyCode");

-- CreateIndex
CREATE UNIQUE INDEX "atms_clients_clientNo_key" ON "atms_clients"("clientNo");

-- CreateIndex
CREATE UNIQUE INDEX "bir_information_clientId_key" ON "bir_information"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "business_operations_clientId_key" ON "business_operations"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_details_clientId_key" ON "corporate_details"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "individual_details_clientId_key" ON "individual_details"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_userId_key" ON "employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_clientUserId_key" ON "employee"("clientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_employeeNo_key" ON "employee"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "employee_government_ids_employeeId_key" ON "employee_government_ids"("employeeId");

-- CreateIndex
CREATE INDEX "employee_employment_employeeId_employmentStatus_idx" ON "employee_employment"("employeeId", "employmentStatus");

-- CreateIndex
CREATE INDEX "employee_employment_clientId_idx" ON "employee_employment"("clientId");

-- CreateIndex
CREATE INDEX "employee_contract_employmentId_idx" ON "employee_contract"("employmentId");

-- CreateIndex
CREATE INDEX "work_schedule_clientId_idx" ON "work_schedule"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedule_clientId_name_key" ON "work_schedule"("clientId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_clientId_name_key" ON "Department"("clientId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTeam_clientId_name_key" ON "EmployeeTeam"("clientId", "name");

-- CreateIndex
CREATE INDEX "employee_level_clientId_idx" ON "employee_level"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_level_clientId_name_key" ON "employee_level"("clientId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_level_clientId_position_key" ON "employee_level"("clientId", "position");

-- CreateIndex
CREATE INDEX "government_loan_employeeId_idx" ON "government_loan"("employeeId");

-- CreateIndex
CREATE INDEX "government_loan_clientId_idx" ON "government_loan"("clientId");

-- CreateIndex
CREATE INDEX "government_loan_deduction_loanId_idx" ON "government_loan_deduction"("loanId");

-- CreateIndex
CREATE INDEX "government_loan_deduction_payslipId_idx" ON "government_loan_deduction"("payslipId");

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "notification_clientUserId_idx" ON "notification"("clientUserId");

-- CreateIndex
CREATE INDEX "notification_isRead_priority_idx" ON "notification"("isRead", "priority");

-- CreateIndex
CREATE INDEX "task_template_route_templateId_idx" ON "task_template_route"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "task_template_route_templateId_departmentId_key" ON "task_template_route"("templateId", "departmentId");

-- CreateIndex
CREATE INDEX "task_template_subtask_routeId_idx" ON "task_template_subtask"("routeId");

-- CreateIndex
CREATE INDEX "department_task_status_departmentId_idx" ON "department_task_status"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "department_task_status_departmentId_name_key" ON "department_task_status"("departmentId", "name");

-- CreateIndex
CREATE INDEX "task_clientId_idx" ON "task"("clientId");

-- CreateIndex
CREATE INDEX "task_jobOrderId_idx" ON "task"("jobOrderId");

-- CreateIndex
CREATE INDEX "task_departmentId_statusId_idx" ON "task"("departmentId", "statusId");

-- CreateIndex
CREATE INDEX "task_subtask_parentTaskId_idx" ON "task_subtask"("parentTaskId");

-- CreateIndex
CREATE INDEX "task_history_taskId_idx" ON "task_history"("taskId");

-- CreateIndex
CREATE INDEX "task_history_taskId_createdAt_idx" ON "task_history"("taskId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "task_subtask_history_subtaskId_idx" ON "task_subtask_history"("subtaskId");

-- CreateIndex
CREATE INDEX "task_subtask_history_subtaskId_createdAt_idx" ON "task_subtask_history"("subtaskId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "task_conversation_taskId_idx" ON "task_conversation"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "client_session_token_key" ON "client_session"("token");

-- CreateIndex
CREATE INDEX "client_session_userId_idx" ON "client_session"("userId");

-- CreateIndex
CREATE INDEX "client_account_userId_idx" ON "client_account"("userId");

-- CreateIndex
CREATE INDEX "client_verification_identifier_idx" ON "client_verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "client_user_email_key" ON "client_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_user_assignment_clientUserId_clientId_key" ON "client_user_assignment"("clientUserId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "job_order_jobOrderNumber_key" ON "job_order"("jobOrderNumber");

-- CreateIndex
CREATE INDEX "job_order_leadId_idx" ON "job_order"("leadId");

-- CreateIndex
CREATE INDEX "job_order_clientId_idx" ON "job_order"("clientId");

-- CreateIndex
CREATE INDEX "job_order_item_jobOrderId_idx" ON "job_order_item"("jobOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_convertedClientId_key" ON "lead"("convertedClientId");

-- CreateIndex
CREATE INDEX "lead_statusId_idx" ON "lead"("statusId");

-- CreateIndex
CREATE INDEX "lead_comment_leadId_idx" ON "lead_comment"("leadId");

-- CreateIndex
CREATE INDEX "lead_history_leadId_idx" ON "lead_history"("leadId");

-- CreateIndex
CREATE INDEX "lead_history_leadId_createdAt_idx" ON "lead_history"("leadId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sales_setting_clientId_key" ON "sales_setting"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "government_office_code_key" ON "government_office"("code");

-- CreateIndex
CREATE UNIQUE INDEX "city_name_key" ON "city"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_inclusion_name_key" ON "service_inclusion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_code_key" ON "service"("code");

-- CreateIndex
CREATE INDEX "service_task_template_taskTemplateId_idx" ON "service_task_template"("taskTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "service_package_code_key" ON "service_package"("code");

-- CreateIndex
CREATE UNIQUE INDEX "service_package_item_packageId_serviceId_key" ON "service_package_item"("packageId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "quote_quoteNumber_key" ON "quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "quote_line_item_quoteId_idx" ON "quote_line_item"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_key" ON "promo"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tsa_contract_referenceNumber_key" ON "tsa_contract"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tsa_contract_quoteId_key" ON "tsa_contract"("quoteId");

-- CreateIndex
CREATE INDEX "tsa_contract_leadId_idx" ON "tsa_contract"("leadId");

-- CreateIndex
CREATE INDEX "tsa_contract_clientId_idx" ON "tsa_contract"("clientId");

-- CreateIndex
CREATE INDEX "_AutoOvertimeEmployees_B_index" ON "_AutoOvertimeEmployees"("B");

-- CreateIndex
CREATE INDEX "_ExemptLateUndertimeEmployees_B_index" ON "_ExemptLateUndertimeEmployees"("B");

-- CreateIndex
CREATE INDEX "_ServiceGovOffices_B_index" ON "_ServiceGovOffices"("B");

-- CreateIndex
CREATE INDEX "_ServiceCities_B_index" ON "_ServiceCities"("B");

-- CreateIndex
CREATE INDEX "_ServiceInclusions_B_index" ON "_ServiceInclusions"("B");

-- CreateIndex
CREATE INDEX "_ServicePromos_B_index" ON "_ServicePromos"("B");

-- AddForeignKey
ALTER TABLE "account_detail_type" ADD CONSTRAINT "account_detail_type_accountTypeId_fkey" FOREIGN KEY ("accountTypeId") REFERENCES "account_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_accountTypeId_fkey" FOREIGN KEY ("accountTypeId") REFERENCES "account_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_accountDetailTypeId_fkey" FOREIGN KEY ("accountDetailTypeId") REFERENCES "account_detail_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "gl_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_subscription" ADD CONSTRAINT "client_subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_subscription" ADD CONSTRAINT "client_subscription_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_subscription" ADD CONSTRAINT "client_subscription_quoteLineItemId_fkey" FOREIGN KEY ("quoteLineItemId") REFERENCES "quote_line_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_subscription" ADD CONSTRAINT "client_subscription_clientComplianceId_fkey" FOREIGN KEY ("clientComplianceId") REFERENCES "client_compliance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_history" ADD CONSTRAINT "invoice_history_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_history" ADD CONSTRAINT "invoice_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "client_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "gl_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compliance" ADD CONSTRAINT "client_compliance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compliance" ADD CONSTRAINT "client_compliance_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compliance" ADD CONSTRAINT "client_compliance_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compliance" ADD CONSTRAINT "client_compliance_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compliance" ADD CONSTRAINT "client_compliance_paymentProcessorId_fkey" FOREIGN KEY ("paymentProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compliance" ADD CONSTRAINT "client_compliance_paymentApproverId_fkey" FOREIGN KEY ("paymentApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compliance" ADD CONSTRAINT "client_compliance_finalApproverId_fkey" FOREIGN KEY ("finalApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compliance" ADD CONSTRAINT "client_compliance_salesOfficerId_fkey" FOREIGN KEY ("salesOfficerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_clientComplianceId_fkey" FOREIGN KEY ("clientComplianceId") REFERENCES "client_compliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_originalRecordId_fkey" FOREIGN KEY ("originalRecordId") REFERENCES "compliance_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_clientSubscriptionId_fkey" FOREIGN KEY ("clientSubscriptionId") REFERENCES "client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedProcessorId_fkey" FOREIGN KEY ("assignedProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualProcessorId_fkey" FOREIGN KEY ("actualProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedVerifierId_fkey" FOREIGN KEY ("assignedVerifierId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualVerifierId_fkey" FOREIGN KEY ("actualVerifierId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedPaymentProcessorId_fkey" FOREIGN KEY ("assignedPaymentProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualPaymentProcessorId_fkey" FOREIGN KEY ("actualPaymentProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedPaymentApproverId_fkey" FOREIGN KEY ("assignedPaymentApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualPaymentApproverId_fkey" FOREIGN KEY ("actualPaymentApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedFinalApproverId_fkey" FOREIGN KEY ("assignedFinalApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualFinalApproverId_fkey" FOREIGN KEY ("actualFinalApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_salesOfficerId_fkey" FOREIGN KEY ("salesOfficerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultProcessorId_fkey" FOREIGN KEY ("defaultProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultVerifierId_fkey" FOREIGN KEY ("defaultVerifierId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultPaymentProcessorId_fkey" FOREIGN KEY ("defaultPaymentProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultPaymentApproverId_fkey" FOREIGN KEY ("defaultPaymentApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultFinalApproverId_fkey" FOREIGN KEY ("defaultFinalApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultSalesOfficerId_fkey" FOREIGN KEY ("defaultSalesOfficerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_document" ADD CONSTRAINT "compliance_document_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_note" ADD CONSTRAINT "compliance_note_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_note" ADD CONSTRAINT "compliance_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item" ADD CONSTRAINT "ewt_item_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item" ADD CONSTRAINT "ewt_item_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "invoice_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item_history" ADD CONSTRAINT "ewt_item_history_ewtItemId_fkey" FOREIGN KEY ("ewtItemId") REFERENCES "ewt_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item_history" ADD CONSTRAINT "ewt_item_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_type" ADD CONSTRAINT "leave_type_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_credit" ADD CONSTRAINT "employee_leave_credit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_credit" ADD CONSTRAINT "employee_leave_credit_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_approvedByClientUserId_fkey" FOREIGN KEY ("approvedByClientUserId") REFERENCES "client_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_request" ADD CONSTRAINT "overtime_request_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_request" ADD CONSTRAINT "overtime_request_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_request" ADD CONSTRAINT "overtime_request_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_request" ADD CONSTRAINT "overtime_request_approvedByClientUserId_fkey" FOREIGN KEY ("approvedByClientUserId") REFERENCES "client_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coa_request" ADD CONSTRAINT "coa_request_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coa_request" ADD CONSTRAINT "coa_request_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coa_request" ADD CONSTRAINT "coa_request_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coa_request" ADD CONSTRAINT "coa_request_approvedByClientUserId_fkey" FOREIGN KEY ("approvedByClientUserId") REFERENCES "client_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_setting" ADD CONSTRAINT "hr_setting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday" ADD CONSTRAINT "holiday_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_override" ADD CONSTRAINT "schedule_override_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet" ADD CONSTRAINT "timesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet" ADD CONSTRAINT "timesheet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "employee_contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_payrollScheduleId_fkey" FOREIGN KEY ("payrollScheduleId") REFERENCES "payroll_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_period" ADD CONSTRAINT "payroll_period_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_period" ADD CONSTRAINT "payroll_period_payrollScheduleId_fkey" FOREIGN KEY ("payrollScheduleId") REFERENCES "payroll_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_schedule" ADD CONSTRAINT "payroll_schedule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_approvedByClientUserId_fkey" FOREIGN KEY ("approvedByClientUserId") REFERENCES "client_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_acknowledgedByClientUserId_fkey" FOREIGN KEY ("acknowledgedByClientUserId") REFERENCES "client_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_advance" ADD CONSTRAINT "cash_advance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_advance" ADD CONSTRAINT "cash_advance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_advance" ADD CONSTRAINT "cash_advance_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_advance" ADD CONSTRAINT "cash_advance_approvedByClientUserId_fkey" FOREIGN KEY ("approvedByClientUserId") REFERENCES "client_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_advance_deduction" ADD CONSTRAINT "cash_advance_deduction_cashAdvanceId_fkey" FOREIGN KEY ("cashAdvanceId") REFERENCES "cash_advance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_advance_deduction" ADD CONSTRAINT "cash_advance_deduction_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "client_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_app_access" ADD CONSTRAINT "employee_app_access_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_app_access" ADD CONSTRAINT "employee_app_access_appId_fkey" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_mainBranchId_fkey" FOREIGN KEY ("mainBranchId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_clientRelationOfficerId_fkey" FOREIGN KEY ("clientRelationOfficerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_operationsManagerId_fkey" FOREIGN KEY ("operationsManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bir_information" ADD CONSTRAINT "bir_information_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_operations" ADD CONSTRAINT "business_operations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_details" ADD CONSTRAINT "corporate_details_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_shareholder" ADD CONSTRAINT "corporate_shareholder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_details" ADD CONSTRAINT "individual_details_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "client_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_government_ids" ADD CONSTRAINT "employee_government_ids_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "EmployeeTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_employeeLevelId_fkey" FOREIGN KEY ("employeeLevelId") REFERENCES "employee_level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contract" ADD CONSTRAINT "employee_contract_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "employee_employment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contract" ADD CONSTRAINT "employee_contract_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "work_schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule" ADD CONSTRAINT "work_schedule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_day" ADD CONSTRAINT "work_schedule_day_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "work_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_submitted_documents" ADD CONSTRAINT "atms_submitted_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeam" ADD CONSTRAINT "EmployeeTeam_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeam" ADD CONSTRAINT "EmployeeTeam_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_level" ADD CONSTRAINT "employee_level_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_loan" ADD CONSTRAINT "government_loan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_loan" ADD CONSTRAINT "government_loan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_loan_deduction" ADD CONSTRAINT "government_loan_deduction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "government_loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_loan_deduction" ADD CONSTRAINT "government_loan_deduction_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "client_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_route" ADD CONSTRAINT "task_template_route_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_route" ADD CONSTRAINT "task_template_route_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_subtask" ADD CONSTRAINT "task_template_subtask_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "task_template_route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_task_status" ADD CONSTRAINT "department_task_status_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "department_task_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "job_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask_history" ADD CONSTRAINT "task_subtask_history_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "task_subtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask_history" ADD CONSTRAINT "task_subtask_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_conversation" ADD CONSTRAINT "task_conversation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_conversation" ADD CONSTRAINT "task_conversation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_session" ADD CONSTRAINT "client_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "client_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_account" ADD CONSTRAINT "client_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "client_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_user" ADD CONSTRAINT "client_user_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_user_assignment" ADD CONSTRAINT "client_user_assignment_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "client_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_user_assignment" ADD CONSTRAINT "client_user_assignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_assignedAccountManagerId_fkey" FOREIGN KEY ("assignedAccountManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_actualAccountManagerId_fkey" FOREIGN KEY ("actualAccountManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_assignedOperationsManagerId_fkey" FOREIGN KEY ("assignedOperationsManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_actualOperationsManagerId_fkey" FOREIGN KEY ("actualOperationsManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_assignedExecutiveId_fkey" FOREIGN KEY ("assignedExecutiveId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_actualExecutiveId_fkey" FOREIGN KEY ("actualExecutiveId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order_item" ADD CONSTRAINT "job_order_item_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "job_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order_item" ADD CONSTRAINT "job_order_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "lead_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_convertedClientId_fkey" FOREIGN KEY ("convertedClientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "promo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comment" ADD CONSTRAINT "lead_comment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comment" ADD CONSTRAINT "lead_comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_setting" ADD CONSTRAINT "sales_setting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_setting" ADD CONSTRAINT "sales_setting_defaultJoProcessApproverId_fkey" FOREIGN KEY ("defaultJoProcessApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_setting" ADD CONSTRAINT "sales_setting_defaultJoOperationsApproverId_fkey" FOREIGN KEY ("defaultJoOperationsApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_setting" ADD CONSTRAINT "sales_setting_defaultJoAccountApproverId_fkey" FOREIGN KEY ("defaultJoAccountApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_setting" ADD CONSTRAINT "sales_setting_defaultJoGeneralApproverId_fkey" FOREIGN KEY ("defaultJoGeneralApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_setting" ADD CONSTRAINT "sales_setting_defaultTsaApproverId_fkey" FOREIGN KEY ("defaultTsaApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_task_template" ADD CONSTRAINT "service_task_template_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_task_template" ADD CONSTRAINT "service_task_template_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "task_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_item" ADD CONSTRAINT "service_package_item_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "service_package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_item" ADD CONSTRAINT "service_package_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_item" ADD CONSTRAINT "quote_line_item_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_item" ADD CONSTRAINT "quote_line_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_item" ADD CONSTRAINT "quote_line_item_sourcePackageId_fkey" FOREIGN KEY ("sourcePackageId") REFERENCES "service_package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_assignedApproverId_fkey" FOREIGN KEY ("assignedApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_actualApproverId_fkey" FOREIGN KEY ("actualApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutoOvertimeEmployees" ADD CONSTRAINT "_AutoOvertimeEmployees_A_fkey" FOREIGN KEY ("A") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutoOvertimeEmployees" ADD CONSTRAINT "_AutoOvertimeEmployees_B_fkey" FOREIGN KEY ("B") REFERENCES "hr_setting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExemptLateUndertimeEmployees" ADD CONSTRAINT "_ExemptLateUndertimeEmployees_A_fkey" FOREIGN KEY ("A") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExemptLateUndertimeEmployees" ADD CONSTRAINT "_ExemptLateUndertimeEmployees_B_fkey" FOREIGN KEY ("B") REFERENCES "hr_setting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceGovOffices" ADD CONSTRAINT "_ServiceGovOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "government_office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceGovOffices" ADD CONSTRAINT "_ServiceGovOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceCities" ADD CONSTRAINT "_ServiceCities_A_fkey" FOREIGN KEY ("A") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceCities" ADD CONSTRAINT "_ServiceCities_B_fkey" FOREIGN KEY ("B") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceInclusions" ADD CONSTRAINT "_ServiceInclusions_A_fkey" FOREIGN KEY ("A") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceInclusions" ADD CONSTRAINT "_ServiceInclusions_B_fkey" FOREIGN KEY ("B") REFERENCES "service_inclusion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePromos" ADD CONSTRAINT "_ServicePromos_A_fkey" FOREIGN KEY ("A") REFERENCES "promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePromos" ADD CONSTRAINT "_ServicePromos_B_fkey" FOREIGN KEY ("B") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
