-- CreateEnum
CREATE TYPE "TsaStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_CLIENT', 'SIGNED', 'VOID');

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
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "clientSignedAt" TIMESTAMP(3),
    "clientSignerName" TEXT,
    "clientSignatureIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tsa_contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tsa_contract_referenceNumber_key" ON "tsa_contract"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tsa_contract_quoteId_key" ON "tsa_contract"("quoteId");

-- CreateIndex
CREATE INDEX "tsa_contract_leadId_idx" ON "tsa_contract"("leadId");

-- CreateIndex
CREATE INDEX "tsa_contract_clientId_idx" ON "tsa_contract"("clientId");

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
