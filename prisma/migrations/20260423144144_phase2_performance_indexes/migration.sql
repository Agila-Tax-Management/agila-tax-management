-- CreateIndex
CREATE INDEX "coa_request_clientId_status_idx" ON "coa_request"("clientId", "status");

-- CreateIndex
CREATE INDEX "compliance_record_clientComplianceId_idx" ON "compliance_record"("clientComplianceId");

-- CreateIndex
CREATE INDEX "compliance_record_filingStatus_processStatus_idx" ON "compliance_record"("filingStatus", "processStatus");

-- CreateIndex
CREATE INDEX "compliance_record_coverageDate_idx" ON "compliance_record"("coverageDate");

-- CreateIndex
CREATE INDEX "invoice_clientId_status_idx" ON "invoice"("clientId", "status");

-- CreateIndex
CREATE INDEX "invoice_issueDate_idx" ON "invoice"("issueDate" DESC);

-- CreateIndex
CREATE INDEX "leave_request_clientId_status_idx" ON "leave_request"("clientId", "status");

-- CreateIndex
CREATE INDEX "overtime_request_clientId_status_idx" ON "overtime_request"("clientId", "status");

-- CreateIndex
CREATE INDEX "payment_paymentDate_idx" ON "payment"("paymentDate" DESC);

-- CreateIndex
CREATE INDEX "timesheet_clientId_date_idx" ON "timesheet"("clientId", "date" DESC);
