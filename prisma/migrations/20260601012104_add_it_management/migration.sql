-- CreateEnum
CREATE TYPE "ItTicketType" AS ENUM ('BUG', 'SYSTEM_ISSUE', 'DOWNTIME', 'CREATE_USER', 'REVOKE_ACCESS', 'HARDWARE_REQUEST', 'SOFTWARE_REQUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "ItTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ItTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ItAssetType" AS ENUM ('LAPTOP', 'DESKTOP', 'MONITOR', 'PHONE', 'PRINTER', 'PERIPHERAL', 'NETWORKING', 'OTHER');

-- CreateEnum
CREATE TYPE "ItAssetStatus" AS ENUM ('ACTIVE', 'IN_REPAIR', 'RETIRED', 'UNASSIGNED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "ItPortalAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ItSystemStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'OUTAGE', 'MAINTENANCE');

-- AlterEnum
ALTER TYPE "AppPortal" ADD VALUE 'IT_MANAGEMENT';

-- CreateTable
CREATE TABLE "it_ticket" (
    "id" SERIAL NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "clientId" INTEGER,
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "type" "ItTicketType" NOT NULL,
    "status" "ItTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ItTicketPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "it_asset" (
    "id" SERIAL NOT NULL,
    "assetTag" TEXT NOT NULL,
    "clientId" INTEGER,
    "name" TEXT NOT NULL,
    "type" "ItAssetType" NOT NULL,
    "status" "ItAssetStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "assignedToId" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "warrantyUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "it_portal_access_request" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER,
    "requestedById" INTEGER NOT NULL,
    "reviewedById" TEXT,
    "requestedPortal" "AppPortal" NOT NULL,
    "requestedRole" "PortalRole" NOT NULL,
    "status" "ItPortalAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_portal_access_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "it_system_status_entry" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER,
    "systemName" TEXT NOT NULL,
    "status" "ItSystemStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "description" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_system_status_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "it_ticket_ticketNumber_key" ON "it_ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "it_ticket_clientId_idx" ON "it_ticket"("clientId");

-- CreateIndex
CREATE INDEX "it_ticket_reportedById_idx" ON "it_ticket"("reportedById");

-- CreateIndex
CREATE INDEX "it_ticket_assignedToId_idx" ON "it_ticket"("assignedToId");

-- CreateIndex
CREATE INDEX "it_ticket_status_idx" ON "it_ticket"("status");

-- CreateIndex
CREATE UNIQUE INDEX "it_asset_assetTag_key" ON "it_asset"("assetTag");

-- CreateIndex
CREATE INDEX "it_asset_clientId_idx" ON "it_asset"("clientId");

-- CreateIndex
CREATE INDEX "it_asset_assignedToId_idx" ON "it_asset"("assignedToId");

-- CreateIndex
CREATE INDEX "it_asset_status_idx" ON "it_asset"("status");

-- CreateIndex
CREATE INDEX "it_portal_access_request_clientId_idx" ON "it_portal_access_request"("clientId");

-- CreateIndex
CREATE INDEX "it_portal_access_request_requestedById_idx" ON "it_portal_access_request"("requestedById");

-- CreateIndex
CREATE INDEX "it_portal_access_request_status_idx" ON "it_portal_access_request"("status");

-- CreateIndex
CREATE INDEX "it_system_status_entry_clientId_idx" ON "it_system_status_entry"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "it_system_status_entry_clientId_systemName_key" ON "it_system_status_entry"("clientId", "systemName");

-- AddForeignKey
ALTER TABLE "it_ticket" ADD CONSTRAINT "it_ticket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_ticket" ADD CONSTRAINT "it_ticket_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_ticket" ADD CONSTRAINT "it_ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_asset" ADD CONSTRAINT "it_asset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_asset" ADD CONSTRAINT "it_asset_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_portal_access_request" ADD CONSTRAINT "it_portal_access_request_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_portal_access_request" ADD CONSTRAINT "it_portal_access_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_portal_access_request" ADD CONSTRAINT "it_portal_access_request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_system_status_entry" ADD CONSTRAINT "it_system_status_entry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_system_status_entry" ADD CONSTRAINT "it_system_status_entry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
