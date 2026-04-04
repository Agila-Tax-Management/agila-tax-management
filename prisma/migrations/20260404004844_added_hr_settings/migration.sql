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

-- CreateIndex
CREATE UNIQUE INDEX "hr_setting_clientId_key" ON "hr_setting"("clientId");

-- CreateIndex
CREATE INDEX "_AutoOvertimeEmployees_B_index" ON "_AutoOvertimeEmployees"("B");

-- CreateIndex
CREATE INDEX "_ExemptLateUndertimeEmployees_B_index" ON "_ExemptLateUndertimeEmployees"("B");

-- AddForeignKey
ALTER TABLE "hr_setting" ADD CONSTRAINT "hr_setting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutoOvertimeEmployees" ADD CONSTRAINT "_AutoOvertimeEmployees_A_fkey" FOREIGN KEY ("A") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutoOvertimeEmployees" ADD CONSTRAINT "_AutoOvertimeEmployees_B_fkey" FOREIGN KEY ("B") REFERENCES "hr_setting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExemptLateUndertimeEmployees" ADD CONSTRAINT "_ExemptLateUndertimeEmployees_A_fkey" FOREIGN KEY ("A") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExemptLateUndertimeEmployees" ADD CONSTRAINT "_ExemptLateUndertimeEmployees_B_fkey" FOREIGN KEY ("B") REFERENCES "hr_setting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
