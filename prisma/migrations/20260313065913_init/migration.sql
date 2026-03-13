-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'VIEWED', 'EXPORTED', 'IMPORTED', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'PERMISSION_CHANGE', 'ASSIGNED', 'UNASSIGNED', 'APPROVED', 'REJECTED', 'SUBMITTED', 'CANCELLED', 'ARCHIVED', 'RESTORED');

-- CreateEnum
CREATE TYPE "AppPortal" AS ENUM ('SALES', 'COMPLIANCE', 'LIAISON', 'ACCOUNTING', 'ACCOUNT_OFFICER', 'HR', 'TASK_MANAGEMENT');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('INDIVIDUAL', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'CORPORATION', 'COOPERATIVE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('REGULAR', 'PROBATIONARY', 'CONTRACTUAL', 'PROJECT_BASED', 'PART_TIME', 'INTERN');

-- CreateEnum
CREATE TYPE "EmployeeLevel" AS ENUM ('STAFF', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'SUPERVISOR', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'TERMINATED', 'ON_LEAVE', 'SUSPENDED', 'RETIRED');

-- CreateEnum
CREATE TYPE "DisbursedMethod" AS ENUM ('CASH_SALARY', 'FUND_TRANSFER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

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
    "active" BOOLEAN NOT NULL DEFAULT false,
    "businessType" "BusinessType",
    "businessCategoryId" INTEGER,
    "portalName" TEXT,
    "businessName" TEXT,
    "branchType" TEXT,
    "mainBranchId" INTEGER,
    "logo" TEXT,
    "clientIpAddress" TEXT,
    "dayResetTime" TIME,
    "workingDayStarts" TIME,
    "timezone" TEXT DEFAULT 'Asia/Manila',
    "created_at" TIMESTAMP(3),

    CONSTRAINT "atms_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientUser" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "clientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atms_professional" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "residentialAddress" TEXT,
    "businessType" TEXT,
    "tradeName" TEXT,
    "civilStatus" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "gender" TEXT,
    "tinNumber" TEXT,
    "citizenship" TEXT,
    "placeOfBirth" TEXT,
    "prcLicense" TEXT,
    "contactNumber" TEXT,
    "contactEmail" TEXT,
    "contactPerson" TEXT,
    "idType" TEXT,
    "idNumber" TEXT,
    "spouseTinNumber" TEXT,
    "spouseEmployerName" TEXT,
    "spouseEmployerTin" TEXT,
    "spouseFirstName" TEXT,
    "spouseMiddleName" TEXT,
    "spouseLastName" TEXT,
    "spouseEmploymentStatus" TEXT,
    "motherFirstName" TEXT,
    "motherMiddleName" TEXT,
    "motherLastName" TEXT,
    "fatherFirstName" TEXT,
    "fatherMiddleName" TEXT,
    "fatherLastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atms_professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atms_sole_proprietorship" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "businessName" TEXT,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "residentialAddress" TEXT,
    "businessAddress" TEXT,
    "businessType" TEXT,
    "tradeName" TEXT,
    "civilStatus" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "gender" TEXT,
    "tinNumber" TEXT,
    "citizenship" TEXT,
    "placeOfBirth" TEXT,
    "businessArea" TEXT,
    "numberOfEmployees" INTEGER,
    "beginningCapital" TEXT,
    "landlineNumber" TEXT,
    "faxNumber" TEXT,
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
    "spouseTinNumber" TEXT,
    "spouseEmployerName" TEXT,
    "spouseEmployerTin" TEXT,
    "businessPlace" TEXT,
    "ownedDocs" TEXT,
    "ownedReason" TEXT,
    "rentedContract" TEXT,
    "rentedNotarized" TEXT,
    "rentedDocStamp" TEXT,
    "rentedMonthlyRent" TEXT,
    "rentedLessorName" TEXT,
    "rentedLessorAddress" TEXT,
    "propertyOwner" TEXT,
    "noRentReason" TEXT,
    "landlordOwnDocs" TEXT,
    "landlordOwnReason" TEXT,
    "landlordLeaseDocs" TEXT,
    "landlordLeaseReason" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactNumber" TEXT,
    "idType" TEXT,
    "idNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atms_sole_proprietorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "username" TEXT,
    "employeeNo" TEXT,
    "email" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
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
    "departmentId" INTEGER,
    "positionId" INTEGER,
    "teamId" INTEGER,
    "employmentType" "EmploymentType",
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "employeeLevel" "EmployeeLevel",
    "hireDate" TIMESTAMP(3),
    "regularizationDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "reportingManagerId" INTEGER,
    "monthlyRate" DECIMAL(10,2),
    "weeklyRate" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "hourlyRate" DECIMAL(10,2),
    "disbursedMethod" "DisbursedMethod",
    "payType" TEXT DEFAULT 'Variable Pay',
    "bankDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_employment_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "BusinessCategory_name_key" ON "BusinessCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClientUser_email_key" ON "ClientUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNo_key" ON "Employee"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "employee_government_ids_employeeId_key" ON "employee_government_ids"("employeeId");

-- CreateIndex
CREATE INDEX "employee_employment_employeeId_employmentStatus_idx" ON "employee_employment"("employeeId", "employmentStatus");

-- CreateIndex
CREATE INDEX "employee_employment_clientId_idx" ON "employee_employment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_clientId_name_key" ON "Department"("clientId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTeam_clientId_name_key" ON "EmployeeTeam"("clientId", "name");

-- CreateIndex
CREATE INDEX "internal_notification_recipientId_isRead_idx" ON "internal_notification"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "internal_notification_recipientId_createdAt_idx" ON "internal_notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "internal_notification_actorId_idx" ON "internal_notification"("actorId");

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

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAppAccess" ADD CONSTRAINT "EmployeeAppAccess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAppAccess" ADD CONSTRAINT "EmployeeAppAccess_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_businessCategoryId_fkey" FOREIGN KEY ("businessCategoryId") REFERENCES "BusinessCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_mainBranchId_fkey" FOREIGN KEY ("mainBranchId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientUser" ADD CONSTRAINT "ClientUser_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_professional" ADD CONSTRAINT "atms_professional_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_sole_proprietorship" ADD CONSTRAINT "atms_sole_proprietorship_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_government_ids" ADD CONSTRAINT "employee_government_ids_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "EmployeeTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_submitted_documents" ADD CONSTRAINT "atms_submitted_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeam" ADD CONSTRAINT "EmployeeTeam_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeam" ADD CONSTRAINT "EmployeeTeam_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notification" ADD CONSTRAINT "internal_notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notification" ADD CONSTRAINT "internal_notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
