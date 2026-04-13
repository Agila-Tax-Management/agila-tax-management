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

-- CreateIndex
CREATE UNIQUE INDEX "sales_setting_clientId_key" ON "sales_setting"("clientId");

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
