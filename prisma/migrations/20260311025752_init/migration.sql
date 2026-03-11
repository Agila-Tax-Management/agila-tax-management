-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('REGULAR', 'PROBATIONARY', 'CONTRACTUAL', 'PROJECT_BASED', 'PART_TIME', 'INTERN');

-- CreateEnum
CREATE TYPE "DisbursedMethod" AS ENUM ('CASH_SALARY', 'FUND_TRANSFER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CLIENT');

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAppAccess" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "appId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAppAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atms_professional" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
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
    "clientId" TEXT NOT NULL,
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
    "departmentId" INTEGER,
    "positionId" INTEGER,
    "teamId" INTEGER,
    "employmentType" "EmploymentType",
    "pcfRole" TEXT,
    "hierarchy" TEXT,
    "startDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "monthlyRate" DECIMAL(10,2),
    "weeklyRate" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "hourlyRate" DECIMAL(10,2),
    "sss" DECIMAL(11,2),
    "pagibig" DECIMAL(11,2),
    "philhealth" DECIMAL(11,2),
    "disbursedMethod" "DisbursedMethod",
    "payType" TEXT DEFAULT 'Variable Pay',
    "bankDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
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
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTeam" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "leaderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" INTEGER,

    CONSTRAINT "EmployeeTeam_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "App_name_key" ON "App"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAppAccess_employeeId_appId_key" ON "EmployeeAppAccess"("employeeId", "appId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientUser_email_key" ON "ClientUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNo_key" ON "Employee"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

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
ALTER TABLE "EmployeeAppAccess" ADD CONSTRAINT "EmployeeAppAccess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAppAccess" ADD CONSTRAINT "EmployeeAppAccess_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientUser" ADD CONSTRAINT "ClientUser_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_professional" ADD CONSTRAINT "atms_professional_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_sole_proprietorship" ADD CONSTRAINT "atms_sole_proprietorship_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "EmployeeTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_submitted_documents" ADD CONSTRAINT "atms_submitted_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeam" ADD CONSTRAINT "EmployeeTeam_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeam" ADD CONSTRAINT "EmployeeTeam_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
