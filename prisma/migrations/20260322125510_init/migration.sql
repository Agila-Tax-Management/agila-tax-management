-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'VIEWED', 'EXPORTED', 'IMPORTED', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'PERMISSION_CHANGE', 'ASSIGNED', 'UNASSIGNED', 'APPROVED', 'REJECTED', 'SUBMITTED', 'CANCELLED', 'ARCHIVED', 'RESTORED');

-- CreateEnum
CREATE TYPE "AppPortal" AS ENUM ('SALES', 'COMPLIANCE', 'LIAISON', 'ACCOUNTING', 'ACCOUNT_OFFICER', 'HR', 'TASK_MANAGEMENT');

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
CREATE TYPE "OvertimeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CoaActionType" AS ENUM ('TIME_IN', 'LUNCH_START', 'LUNCH_END', 'TIME_OUT');

-- CreateEnum
CREATE TYPE "CoaRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHECK', 'E_WALLET', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "InvoiceChangeType" AS ENUM ('INVOICE_CREATED', 'INVOICE_UPDATED', 'STATUS_CHANGED', 'DUE_DATE_CHANGED', 'PAYMENT_ADDED', 'PAYMENT_VOIDED', 'ITEM_ADDED', 'ITEM_REMOVED', 'INVOICE_VOIDED');

-- CreateEnum
CREATE TYPE "SubscriptionChangeType" AS ENUM ('SUBSCRIPTION_CREATED', 'RATE_CHANGED', 'PLAN_CHANGED', 'PAUSED', 'REACTIVATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadChangeType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'DETAILS_UPDATED', 'SCHEDULE_UPDATED', 'INVOICE_GENERATED', 'CONTRACT_GENERATED', 'CONTRACT_SIGNED', 'TSA_GENERATED', 'TSA_SIGNED', 'JOB_ORDER_GENERATED', 'ACCOUNT_CREATED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ServiceRecurring" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PromoFor" AS ENUM ('SERVICE_PLAN', 'SERVICE_ONE_TIME', 'BOTH');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskChangeType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'DEPARTMENT_CHANGED', 'ASSIGNEE_CHANGED', 'DUE_DATE_CHANGED', 'DETAILS_UPDATED', 'COMMENT_ADDED');

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
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "LogAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "name" "AppPortal" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAppAccess" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "appId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAppAccess_pkey" PRIMARY KEY ("id")
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
    "monthlyRate" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "hourlyRate" DECIMAL(10,2),
    "allowanceRate" DECIMAL(10,2) DEFAULT 0.00,
    "deductSss" BOOLEAN NOT NULL DEFAULT false,
    "deductPagibig" BOOLEAN NOT NULL DEFAULT false,
    "deductPhilhealth" BOOLEAN NOT NULL DEFAULT false,
    "deductTax" BOOLEAN NOT NULL DEFAULT false,
    "disbursedMethod" "DisbursedMethod",
    "payType" TEXT DEFAULT 'Variable Pay',
    "bankDetails" TEXT,
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
CREATE TABLE "internal_notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_subscription" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "servicePlanId" INTEGER NOT NULL,
    "agreedRate" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "inactiveDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "recordedById" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL,
    "referenceNumber" TEXT,
    "proofOfPaymentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
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
    "contactNumber" TEXT,
    "businessType" TEXT NOT NULL DEFAULT 'Not Specified',
    "leadSource" TEXT NOT NULL DEFAULT 'Facebook',
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
CREATE TABLE "service_plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "recurring" "ServiceRecurring" NOT NULL DEFAULT 'MONTHLY',
    "serviceRate" DECIMAL(10,2) NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "taskTemplateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_one_time" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceRate" DECIMAL(10,2) NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "taskTemplateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_one_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "promoFor" "PromoFor" NOT NULL DEFAULT 'BOTH',
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
CREATE TABLE "task" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" INTEGER,
    "templateId" INTEGER,
    "currentDepartmentId" INTEGER,
    "currentRouteOrder" INTEGER NOT NULL DEFAULT 1,
    "currentStatusId" INTEGER,
    "assignedToId" INTEGER,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "daysDue" INTEGER,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_subtask" (
    "id" SERIAL NOT NULL,
    "parentTaskId" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" INTEGER,
    "statusId" INTEGER,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "daysDue" INTEGER,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
CREATE TABLE "payroll_period" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
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
    "role" "ClientPortalRole" NOT NULL DEFAULT 'EMPLOYEE',
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
CREATE TABLE "_LeadToServicePlan" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LeadToServicePlan_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LeadToServiceOneTime" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LeadToServiceOneTime_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicePlanGovOffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePlanGovOffices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceOneTimeGovOffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceOneTimeGovOffices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicePlanCities" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePlanCities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceOneTimeCities" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceOneTimeCities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicePlanInclusions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePlanInclusions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceOneTimeInclusions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceOneTimeInclusions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicePlanPromos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePlanPromos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceOneTimePromos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceOneTimePromos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "activity_log_userId_idx" ON "activity_log"("userId");

-- CreateIndex
CREATE INDEX "activity_log_entity_entityId_idx" ON "activity_log"("entity", "entityId");

-- CreateIndex
CREATE INDEX "activity_log_action_idx" ON "activity_log"("action");

-- CreateIndex
CREATE INDEX "activity_log_createdAt_idx" ON "activity_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "App_name_key" ON "App"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAppAccess_employeeId_appId_key" ON "EmployeeAppAccess"("employeeId", "appId");

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
CREATE INDEX "internal_notification_recipientId_isRead_idx" ON "internal_notification"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "internal_notification_recipientId_createdAt_idx" ON "internal_notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "internal_notification_actorId_idx" ON "internal_notification"("actorId");

-- CreateIndex
CREATE INDEX "client_subscription_clientId_isActive_idx" ON "client_subscription"("clientId", "isActive");

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
CREATE INDEX "payment_invoiceId_idx" ON "payment"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_history_invoiceId_idx" ON "invoice_history"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_history_invoiceId_createdAt_idx" ON "invoice_history"("invoiceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "subscription_history_subscriptionId_idx" ON "subscription_history"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_history_subscriptionId_createdAt_idx" ON "subscription_history"("subscriptionId", "createdAt" DESC);

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
CREATE UNIQUE INDEX "government_office_code_key" ON "government_office"("code");

-- CreateIndex
CREATE UNIQUE INDEX "city_name_key" ON "city"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_inclusion_name_key" ON "service_inclusion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_key" ON "promo"("code");

-- CreateIndex
CREATE INDEX "task_clientId_idx" ON "task"("clientId");

-- CreateIndex
CREATE INDEX "task_currentDepartmentId_currentStatusId_idx" ON "task"("currentDepartmentId", "currentStatusId");

-- CreateIndex
CREATE INDEX "task_subtask_parentTaskId_idx" ON "task_subtask"("parentTaskId");

-- CreateIndex
CREATE INDEX "task_subtask_departmentId_idx" ON "task_subtask"("departmentId");

-- CreateIndex
CREATE INDEX "task_history_taskId_idx" ON "task_history"("taskId");

-- CreateIndex
CREATE INDEX "task_history_taskId_createdAt_idx" ON "task_history"("taskId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "task_conversation_taskId_idx" ON "task_conversation"("taskId");

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
CREATE INDEX "payroll_period_clientId_idx" ON "payroll_period"("clientId");

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
CREATE INDEX "_LeadToServicePlan_B_index" ON "_LeadToServicePlan"("B");

-- CreateIndex
CREATE INDEX "_LeadToServiceOneTime_B_index" ON "_LeadToServiceOneTime"("B");

-- CreateIndex
CREATE INDEX "_ServicePlanGovOffices_B_index" ON "_ServicePlanGovOffices"("B");

-- CreateIndex
CREATE INDEX "_ServiceOneTimeGovOffices_B_index" ON "_ServiceOneTimeGovOffices"("B");

-- CreateIndex
CREATE INDEX "_ServicePlanCities_B_index" ON "_ServicePlanCities"("B");

-- CreateIndex
CREATE INDEX "_ServiceOneTimeCities_B_index" ON "_ServiceOneTimeCities"("B");

-- CreateIndex
CREATE INDEX "_ServicePlanInclusions_B_index" ON "_ServicePlanInclusions"("B");

-- CreateIndex
CREATE INDEX "_ServiceOneTimeInclusions_B_index" ON "_ServiceOneTimeInclusions"("B");

-- CreateIndex
CREATE INDEX "_ServicePlanPromos_B_index" ON "_ServicePlanPromos"("B");

-- CreateIndex
CREATE INDEX "_ServiceOneTimePromos_B_index" ON "_ServiceOneTimePromos"("B");

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAppAccess" ADD CONSTRAINT "EmployeeAppAccess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAppAccess" ADD CONSTRAINT "EmployeeAppAccess_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_mainBranchId_fkey" FOREIGN KEY ("mainBranchId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "internal_notification" ADD CONSTRAINT "internal_notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notification" ADD CONSTRAINT "internal_notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_subscription" ADD CONSTRAINT "client_subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_subscription" ADD CONSTRAINT "client_subscription_servicePlanId_fkey" FOREIGN KEY ("servicePlanId") REFERENCES "service_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_history" ADD CONSTRAINT "invoice_history_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_history" ADD CONSTRAINT "invoice_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "client_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "lead_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_convertedClientId_fkey" FOREIGN KEY ("convertedClientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comment" ADD CONSTRAINT "lead_comment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comment" ADD CONSTRAINT "lead_comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_plan" ADD CONSTRAINT "service_plan_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "task_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_one_time" ADD CONSTRAINT "service_one_time_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "task_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_currentDepartmentId_fkey" FOREIGN KEY ("currentDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_currentStatusId_fkey" FOREIGN KEY ("currentStatusId") REFERENCES "department_task_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "department_task_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_conversation" ADD CONSTRAINT "task_conversation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_conversation" ADD CONSTRAINT "task_conversation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_route" ADD CONSTRAINT "task_template_route_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_route" ADD CONSTRAINT "task_template_route_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_subtask" ADD CONSTRAINT "task_template_subtask_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "task_template_route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_task_status" ADD CONSTRAINT "department_task_status_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday" ADD CONSTRAINT "holiday_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_override" ADD CONSTRAINT "schedule_override_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet" ADD CONSTRAINT "timesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet" ADD CONSTRAINT "timesheet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_period" ADD CONSTRAINT "payroll_period_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "_LeadToServicePlan" ADD CONSTRAINT "_LeadToServicePlan_A_fkey" FOREIGN KEY ("A") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeadToServicePlan" ADD CONSTRAINT "_LeadToServicePlan_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeadToServiceOneTime" ADD CONSTRAINT "_LeadToServiceOneTime_A_fkey" FOREIGN KEY ("A") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeadToServiceOneTime" ADD CONSTRAINT "_LeadToServiceOneTime_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanGovOffices" ADD CONSTRAINT "_ServicePlanGovOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "government_office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanGovOffices" ADD CONSTRAINT "_ServicePlanGovOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeGovOffices" ADD CONSTRAINT "_ServiceOneTimeGovOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "government_office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeGovOffices" ADD CONSTRAINT "_ServiceOneTimeGovOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanCities" ADD CONSTRAINT "_ServicePlanCities_A_fkey" FOREIGN KEY ("A") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanCities" ADD CONSTRAINT "_ServicePlanCities_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeCities" ADD CONSTRAINT "_ServiceOneTimeCities_A_fkey" FOREIGN KEY ("A") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeCities" ADD CONSTRAINT "_ServiceOneTimeCities_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanInclusions" ADD CONSTRAINT "_ServicePlanInclusions_A_fkey" FOREIGN KEY ("A") REFERENCES "service_inclusion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanInclusions" ADD CONSTRAINT "_ServicePlanInclusions_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeInclusions" ADD CONSTRAINT "_ServiceOneTimeInclusions_A_fkey" FOREIGN KEY ("A") REFERENCES "service_inclusion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeInclusions" ADD CONSTRAINT "_ServiceOneTimeInclusions_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanPromos" ADD CONSTRAINT "_ServicePlanPromos_A_fkey" FOREIGN KEY ("A") REFERENCES "promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanPromos" ADD CONSTRAINT "_ServicePlanPromos_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimePromos" ADD CONSTRAINT "_ServiceOneTimePromos_A_fkey" FOREIGN KEY ("A") REFERENCES "promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimePromos" ADD CONSTRAINT "_ServiceOneTimePromos_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;
