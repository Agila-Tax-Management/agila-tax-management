/*
  Warnings:

  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmployeeTeam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AutoOvertimeEmployees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ExemptLateUndertimeEmployees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ServiceCities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ServiceGovOffices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ServiceInclusions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ServicePromos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account_detail_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `accounting_setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `activity_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `announcements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `app` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `atms_clients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `atms_submitted_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bir_information` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `business_operations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cash_advance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cash_advance_deduction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `city` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_api_key` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_compliance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_fund_transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_user_assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_verification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coa_request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `compliance_document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `compliance_note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `compliance_record` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `compliance_setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `corporate_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `corporate_shareholder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `department_task_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_app_access` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_compensation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_employment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_government_ids` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_leave_credit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_level` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ewt_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ewt_item_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ewt_item_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ewt_item_template_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `expense_record` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gl_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `government_loan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `government_loan_deduction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `government_office` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `holiday` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hr_setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `individual_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoice_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoice_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `it_access_approver` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `it_asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `it_portal_access_request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `it_ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_order_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `journal_entry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `journal_line` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lead_comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lead_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lead_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `overtime_request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_allocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_method_bank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_method_cash` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_method_ewallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_period` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payslip` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `percentage_tax_month` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `petty_cash` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `petty_cash_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quote_line_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_invoice_counter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_record` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_override` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_inclusion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_package_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_task_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_subtask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_subtask_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_template_route` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_template_subtask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timesheet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tsa_contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vat_month` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_schedule_day` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_clientId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeTeam" DROP CONSTRAINT "EmployeeTeam_clientId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeTeam" DROP CONSTRAINT "EmployeeTeam_leaderId_fkey";

-- DropForeignKey
ALTER TABLE "Position" DROP CONSTRAINT "Position_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "_AutoOvertimeEmployees" DROP CONSTRAINT "_AutoOvertimeEmployees_A_fkey";

-- DropForeignKey
ALTER TABLE "_AutoOvertimeEmployees" DROP CONSTRAINT "_AutoOvertimeEmployees_B_fkey";

-- DropForeignKey
ALTER TABLE "_ExemptLateUndertimeEmployees" DROP CONSTRAINT "_ExemptLateUndertimeEmployees_A_fkey";

-- DropForeignKey
ALTER TABLE "_ExemptLateUndertimeEmployees" DROP CONSTRAINT "_ExemptLateUndertimeEmployees_B_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceCities" DROP CONSTRAINT "_ServiceCities_A_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceCities" DROP CONSTRAINT "_ServiceCities_B_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceGovOffices" DROP CONSTRAINT "_ServiceGovOffices_A_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceGovOffices" DROP CONSTRAINT "_ServiceGovOffices_B_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceInclusions" DROP CONSTRAINT "_ServiceInclusions_A_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceInclusions" DROP CONSTRAINT "_ServiceInclusions_B_fkey";

-- DropForeignKey
ALTER TABLE "_ServicePromos" DROP CONSTRAINT "_ServicePromos_A_fkey";

-- DropForeignKey
ALTER TABLE "_ServicePromos" DROP CONSTRAINT "_ServicePromos_B_fkey";

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "account_detail_type" DROP CONSTRAINT "account_detail_type_accountTypeId_fkey";

-- DropForeignKey
ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_clientId_fkey";

-- DropForeignKey
ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_clientUserId_fkey";

-- DropForeignKey
ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_userId_fkey";

-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_authorId_fkey";

-- DropForeignKey
ALTER TABLE "atms_clients" DROP CONSTRAINT "atms_clients_clientRelationOfficerId_fkey";

-- DropForeignKey
ALTER TABLE "atms_clients" DROP CONSTRAINT "atms_clients_mainBranchId_fkey";

-- DropForeignKey
ALTER TABLE "atms_clients" DROP CONSTRAINT "atms_clients_operationsManagerId_fkey";

-- DropForeignKey
ALTER TABLE "atms_submitted_documents" DROP CONSTRAINT "atms_submitted_documents_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "bir_information" DROP CONSTRAINT "bir_information_clientId_fkey";

-- DropForeignKey
ALTER TABLE "business_operations" DROP CONSTRAINT "business_operations_clientId_fkey";

-- DropForeignKey
ALTER TABLE "cash_advance" DROP CONSTRAINT "cash_advance_approvedByClientUserId_fkey";

-- DropForeignKey
ALTER TABLE "cash_advance" DROP CONSTRAINT "cash_advance_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "cash_advance" DROP CONSTRAINT "cash_advance_clientId_fkey";

-- DropForeignKey
ALTER TABLE "cash_advance" DROP CONSTRAINT "cash_advance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "cash_advance_deduction" DROP CONSTRAINT "cash_advance_deduction_cashAdvanceId_fkey";

-- DropForeignKey
ALTER TABLE "cash_advance_deduction" DROP CONSTRAINT "cash_advance_deduction_payslipId_fkey";

-- DropForeignKey
ALTER TABLE "client_account" DROP CONSTRAINT "client_account_userId_fkey";

-- DropForeignKey
ALTER TABLE "client_api_key" DROP CONSTRAINT "client_api_key_clientUserId_fkey";

-- DropForeignKey
ALTER TABLE "client_compliance" DROP CONSTRAINT "client_compliance_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_compliance" DROP CONSTRAINT "client_compliance_finalApproverId_fkey";

-- DropForeignKey
ALTER TABLE "client_compliance" DROP CONSTRAINT "client_compliance_paymentApproverId_fkey";

-- DropForeignKey
ALTER TABLE "client_compliance" DROP CONSTRAINT "client_compliance_paymentProcessorId_fkey";

-- DropForeignKey
ALTER TABLE "client_compliance" DROP CONSTRAINT "client_compliance_processorId_fkey";

-- DropForeignKey
ALTER TABLE "client_compliance" DROP CONSTRAINT "client_compliance_salesOfficerId_fkey";

-- DropForeignKey
ALTER TABLE "client_compliance" DROP CONSTRAINT "client_compliance_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "client_compliance" DROP CONSTRAINT "client_compliance_verifierId_fkey";

-- DropForeignKey
ALTER TABLE "client_fund_transaction" DROP CONSTRAINT "client_fund_transaction_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_fund_transaction" DROP CONSTRAINT "client_fund_transaction_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "client_fund_transaction" DROP CONSTRAINT "client_fund_transaction_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "client_fund_transaction" DROP CONSTRAINT "client_fund_transaction_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "client_fund_transaction" DROP CONSTRAINT "client_fund_transaction_pettyCashId_fkey";

-- DropForeignKey
ALTER TABLE "client_fund_transaction" DROP CONSTRAINT "client_fund_transaction_processedById_fkey";

-- DropForeignKey
ALTER TABLE "client_session" DROP CONSTRAINT "client_session_userId_fkey";

-- DropForeignKey
ALTER TABLE "client_subscription" DROP CONSTRAINT "client_subscription_clientComplianceId_fkey";

-- DropForeignKey
ALTER TABLE "client_subscription" DROP CONSTRAINT "client_subscription_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_subscription" DROP CONSTRAINT "client_subscription_quoteLineItemId_fkey";

-- DropForeignKey
ALTER TABLE "client_subscription" DROP CONSTRAINT "client_subscription_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "client_user" DROP CONSTRAINT "client_user_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_user_assignment" DROP CONSTRAINT "client_user_assignment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_user_assignment" DROP CONSTRAINT "client_user_assignment_clientUserId_fkey";

-- DropForeignKey
ALTER TABLE "coa_request" DROP CONSTRAINT "coa_request_approvedByClientUserId_fkey";

-- DropForeignKey
ALTER TABLE "coa_request" DROP CONSTRAINT "coa_request_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "coa_request" DROP CONSTRAINT "coa_request_clientId_fkey";

-- DropForeignKey
ALTER TABLE "coa_request" DROP CONSTRAINT "coa_request_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_document" DROP CONSTRAINT "compliance_document_complianceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_note" DROP CONSTRAINT "compliance_note_authorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_note" DROP CONSTRAINT "compliance_note_complianceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_actualFinalApproverId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_actualPaymentApproverId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_actualPaymentProcessorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_actualProcessorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_actualVerifierId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_assignedFinalApproverId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_assignedPaymentApproverId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_assignedPaymentProcessorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_assignedProcessorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_assignedVerifierId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_clientComplianceId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_clientId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_clientSubscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_originalRecordId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_parentRecordId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_salesOfficerId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_setting" DROP CONSTRAINT "compliance_setting_clientId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_setting" DROP CONSTRAINT "compliance_setting_defaultFinalApproverId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_setting" DROP CONSTRAINT "compliance_setting_defaultPaymentApproverId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_setting" DROP CONSTRAINT "compliance_setting_defaultPaymentProcessorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_setting" DROP CONSTRAINT "compliance_setting_defaultProcessorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_setting" DROP CONSTRAINT "compliance_setting_defaultSalesOfficerId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_setting" DROP CONSTRAINT "compliance_setting_defaultVerifierId_fkey";

-- DropForeignKey
ALTER TABLE "contact" DROP CONSTRAINT "contact_clientId_fkey";

-- DropForeignKey
ALTER TABLE "corporate_details" DROP CONSTRAINT "corporate_details_clientId_fkey";

-- DropForeignKey
ALTER TABLE "corporate_shareholder" DROP CONSTRAINT "corporate_shareholder_clientId_fkey";

-- DropForeignKey
ALTER TABLE "department_task_status" DROP CONSTRAINT "department_task_status_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "employee" DROP CONSTRAINT "employee_clientUserId_fkey";

-- DropForeignKey
ALTER TABLE "employee" DROP CONSTRAINT "employee_userId_fkey";

-- DropForeignKey
ALTER TABLE "employee_app_access" DROP CONSTRAINT "employee_app_access_appId_fkey";

-- DropForeignKey
ALTER TABLE "employee_app_access" DROP CONSTRAINT "employee_app_access_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "employee_compensation" DROP CONSTRAINT "employee_compensation_contractId_fkey";

-- DropForeignKey
ALTER TABLE "employee_compensation" DROP CONSTRAINT "employee_compensation_payrollScheduleId_fkey";

-- DropForeignKey
ALTER TABLE "employee_contract" DROP CONSTRAINT "employee_contract_employmentId_fkey";

-- DropForeignKey
ALTER TABLE "employee_contract" DROP CONSTRAINT "employee_contract_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "employee_employment" DROP CONSTRAINT "employee_employment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "employee_employment" DROP CONSTRAINT "employee_employment_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "employee_employment" DROP CONSTRAINT "employee_employment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "employee_employment" DROP CONSTRAINT "employee_employment_employeeLevelId_fkey";

-- DropForeignKey
ALTER TABLE "employee_employment" DROP CONSTRAINT "employee_employment_positionId_fkey";

-- DropForeignKey
ALTER TABLE "employee_employment" DROP CONSTRAINT "employee_employment_reportingManagerId_fkey";

-- DropForeignKey
ALTER TABLE "employee_employment" DROP CONSTRAINT "employee_employment_teamId_fkey";

-- DropForeignKey
ALTER TABLE "employee_government_ids" DROP CONSTRAINT "employee_government_ids_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "employee_leave_credit" DROP CONSTRAINT "employee_leave_credit_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "employee_leave_credit" DROP CONSTRAINT "employee_leave_credit_leaveTypeId_fkey";

-- DropForeignKey
ALTER TABLE "employee_level" DROP CONSTRAINT "employee_level_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ewt_item" DROP CONSTRAINT "ewt_item_complianceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "ewt_item" DROP CONSTRAINT "ewt_item_invoiceItemId_fkey";

-- DropForeignKey
ALTER TABLE "ewt_item" DROP CONSTRAINT "ewt_item_templateId_fkey";

-- DropForeignKey
ALTER TABLE "ewt_item_history" DROP CONSTRAINT "ewt_item_history_actorId_fkey";

-- DropForeignKey
ALTER TABLE "ewt_item_history" DROP CONSTRAINT "ewt_item_history_ewtItemId_fkey";

-- DropForeignKey
ALTER TABLE "ewt_item_template" DROP CONSTRAINT "ewt_item_template_clientComplianceId_fkey";

-- DropForeignKey
ALTER TABLE "ewt_item_template_history" DROP CONSTRAINT "ewt_item_template_history_actorId_fkey";

-- DropForeignKey
ALTER TABLE "ewt_item_template_history" DROP CONSTRAINT "ewt_item_template_history_ewtItemTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "expense_record" DROP CONSTRAINT "expense_record_complianceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "expense_record" DROP CONSTRAINT "expense_record_contactId_fkey";

-- DropForeignKey
ALTER TABLE "expense_record" DROP CONSTRAINT "expense_record_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "gl_account" DROP CONSTRAINT "gl_account_accountDetailTypeId_fkey";

-- DropForeignKey
ALTER TABLE "gl_account" DROP CONSTRAINT "gl_account_accountTypeId_fkey";

-- DropForeignKey
ALTER TABLE "gl_account" DROP CONSTRAINT "gl_account_clientId_fkey";

-- DropForeignKey
ALTER TABLE "gl_account" DROP CONSTRAINT "gl_account_parentId_fkey";

-- DropForeignKey
ALTER TABLE "government_loan" DROP CONSTRAINT "government_loan_clientId_fkey";

-- DropForeignKey
ALTER TABLE "government_loan" DROP CONSTRAINT "government_loan_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "government_loan_deduction" DROP CONSTRAINT "government_loan_deduction_loanId_fkey";

-- DropForeignKey
ALTER TABLE "government_loan_deduction" DROP CONSTRAINT "government_loan_deduction_payslipId_fkey";

-- DropForeignKey
ALTER TABLE "holiday" DROP CONSTRAINT "holiday_clientId_fkey";

-- DropForeignKey
ALTER TABLE "hr_setting" DROP CONSTRAINT "hr_setting_clientId_fkey";

-- DropForeignKey
ALTER TABLE "individual_details" DROP CONSTRAINT "individual_details_clientId_fkey";

-- DropForeignKey
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_clientId_fkey";

-- DropForeignKey
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_leadId_fkey";

-- DropForeignKey
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_history" DROP CONSTRAINT "invoice_history_actorId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_history" DROP CONSTRAINT "invoice_history_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_item" DROP CONSTRAINT "invoice_item_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_item" DROP CONSTRAINT "invoice_item_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "it_access_approver" DROP CONSTRAINT "it_access_approver_addedById_fkey";

-- DropForeignKey
ALTER TABLE "it_access_approver" DROP CONSTRAINT "it_access_approver_userId_fkey";

-- DropForeignKey
ALTER TABLE "it_asset" DROP CONSTRAINT "it_asset_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "it_asset" DROP CONSTRAINT "it_asset_clientId_fkey";

-- DropForeignKey
ALTER TABLE "it_portal_access_request" DROP CONSTRAINT "it_portal_access_request_clientId_fkey";

-- DropForeignKey
ALTER TABLE "it_portal_access_request" DROP CONSTRAINT "it_portal_access_request_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "it_portal_access_request" DROP CONSTRAINT "it_portal_access_request_reviewedById_fkey";

-- DropForeignKey
ALTER TABLE "it_ticket" DROP CONSTRAINT "it_ticket_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "it_ticket" DROP CONSTRAINT "it_ticket_clientId_fkey";

-- DropForeignKey
ALTER TABLE "it_ticket" DROP CONSTRAINT "it_ticket_reportedById_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_actualAccountManagerId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_actualExecutiveId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_actualOperationsManagerId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_assignedAccountManagerId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_assignedExecutiveId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_assignedOperationsManagerId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_clientId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_leadId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_preparedById_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "job_order_item" DROP CONSTRAINT "job_order_item_jobOrderId_fkey";

-- DropForeignKey
ALTER TABLE "job_order_item" DROP CONSTRAINT "job_order_item_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "journal_line" DROP CONSTRAINT "journal_line_glAccountId_fkey";

-- DropForeignKey
ALTER TABLE "journal_line" DROP CONSTRAINT "journal_line_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "lead" DROP CONSTRAINT "lead_assignedAgentId_fkey";

-- DropForeignKey
ALTER TABLE "lead" DROP CONSTRAINT "lead_convertedClientId_fkey";

-- DropForeignKey
ALTER TABLE "lead" DROP CONSTRAINT "lead_promoId_fkey";

-- DropForeignKey
ALTER TABLE "lead" DROP CONSTRAINT "lead_statusId_fkey";

-- DropForeignKey
ALTER TABLE "lead_comment" DROP CONSTRAINT "lead_comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "lead_comment" DROP CONSTRAINT "lead_comment_leadId_fkey";

-- DropForeignKey
ALTER TABLE "lead_history" DROP CONSTRAINT "lead_history_actorId_fkey";

-- DropForeignKey
ALTER TABLE "lead_history" DROP CONSTRAINT "lead_history_leadId_fkey";

-- DropForeignKey
ALTER TABLE "leave_request" DROP CONSTRAINT "leave_request_approvedByClientUserId_fkey";

-- DropForeignKey
ALTER TABLE "leave_request" DROP CONSTRAINT "leave_request_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "leave_request" DROP CONSTRAINT "leave_request_clientId_fkey";

-- DropForeignKey
ALTER TABLE "leave_request" DROP CONSTRAINT "leave_request_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "leave_request" DROP CONSTRAINT "leave_request_leaveTypeId_fkey";

-- DropForeignKey
ALTER TABLE "leave_type" DROP CONSTRAINT "leave_type_clientId_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_clientUserId_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "overtime_request" DROP CONSTRAINT "overtime_request_approvedByClientUserId_fkey";

-- DropForeignKey
ALTER TABLE "overtime_request" DROP CONSTRAINT "overtime_request_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "overtime_request" DROP CONSTRAINT "overtime_request_clientId_fkey";

-- DropForeignKey
ALTER TABLE "overtime_request" DROP CONSTRAINT "overtime_request_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_recordedById_fkey";

-- DropForeignKey
ALTER TABLE "payment_allocation" DROP CONSTRAINT "payment_allocation_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "payment_allocation" DROP CONSTRAINT "payment_allocation_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "payment_history" DROP CONSTRAINT "payment_history_actorId_fkey";

-- DropForeignKey
ALTER TABLE "payment_history" DROP CONSTRAINT "payment_history_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "payroll_period" DROP CONSTRAINT "payroll_period_clientId_fkey";

-- DropForeignKey
ALTER TABLE "payroll_period" DROP CONSTRAINT "payroll_period_payrollScheduleId_fkey";

-- DropForeignKey
ALTER TABLE "payroll_schedule" DROP CONSTRAINT "payroll_schedule_clientId_fkey";

-- DropForeignKey
ALTER TABLE "payslip" DROP CONSTRAINT "payslip_acknowledgedByClientUserId_fkey";

-- DropForeignKey
ALTER TABLE "payslip" DROP CONSTRAINT "payslip_acknowledgedById_fkey";

-- DropForeignKey
ALTER TABLE "payslip" DROP CONSTRAINT "payslip_approvedByClientUserId_fkey";

-- DropForeignKey
ALTER TABLE "payslip" DROP CONSTRAINT "payslip_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "payslip" DROP CONSTRAINT "payslip_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "payslip" DROP CONSTRAINT "payslip_payrollPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "payslip" DROP CONSTRAINT "payslip_preparedById_fkey";

-- DropForeignKey
ALTER TABLE "percentage_tax_month" DROP CONSTRAINT "percentage_tax_month_complianceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "petty_cash" DROP CONSTRAINT "petty_cash_accountingManagerId_fkey";

-- DropForeignKey
ALTER TABLE "petty_cash" DROP CONSTRAINT "petty_cash_clientId_fkey";

-- DropForeignKey
ALTER TABLE "petty_cash" DROP CONSTRAINT "petty_cash_custodianId_fkey";

-- DropForeignKey
ALTER TABLE "petty_cash" DROP CONSTRAINT "petty_cash_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "petty_cash" DROP CONSTRAINT "petty_cash_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "petty_cash_item" DROP CONSTRAINT "petty_cash_item_clientId_fkey";

-- DropForeignKey
ALTER TABLE "petty_cash_item" DROP CONSTRAINT "petty_cash_item_pettyCashId_fkey";

-- DropForeignKey
ALTER TABLE "quote" DROP CONSTRAINT "quote_clientId_fkey";

-- DropForeignKey
ALTER TABLE "quote" DROP CONSTRAINT "quote_leadId_fkey";

-- DropForeignKey
ALTER TABLE "quote_line_item" DROP CONSTRAINT "quote_line_item_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "quote_line_item" DROP CONSTRAINT "quote_line_item_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "quote_line_item" DROP CONSTRAINT "quote_line_item_sourcePackageId_fkey";

-- DropForeignKey
ALTER TABLE "sales_invoice_counter" DROP CONSTRAINT "sales_invoice_counter_clientId_fkey";

-- DropForeignKey
ALTER TABLE "sales_record" DROP CONSTRAINT "sales_record_complianceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "sales_record" DROP CONSTRAINT "sales_record_contactId_fkey";

-- DropForeignKey
ALTER TABLE "sales_record" DROP CONSTRAINT "sales_record_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "sales_setting" DROP CONSTRAINT "sales_setting_clientId_fkey";

-- DropForeignKey
ALTER TABLE "sales_setting" DROP CONSTRAINT "sales_setting_defaultJoAccountApproverId_fkey";

-- DropForeignKey
ALTER TABLE "sales_setting" DROP CONSTRAINT "sales_setting_defaultJoGeneralApproverId_fkey";

-- DropForeignKey
ALTER TABLE "sales_setting" DROP CONSTRAINT "sales_setting_defaultJoOperationsApproverId_fkey";

-- DropForeignKey
ALTER TABLE "sales_setting" DROP CONSTRAINT "sales_setting_defaultJoProcessApproverId_fkey";

-- DropForeignKey
ALTER TABLE "sales_setting" DROP CONSTRAINT "sales_setting_defaultTsaApproverId_fkey";

-- DropForeignKey
ALTER TABLE "schedule_override" DROP CONSTRAINT "schedule_override_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "service_package_item" DROP CONSTRAINT "service_package_item_packageId_fkey";

-- DropForeignKey
ALTER TABLE "service_package_item" DROP CONSTRAINT "service_package_item_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "service_task_template" DROP CONSTRAINT "service_task_template_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "service_task_template" DROP CONSTRAINT "service_task_template_taskTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropForeignKey
ALTER TABLE "subscription_history" DROP CONSTRAINT "subscription_history_actorId_fkey";

-- DropForeignKey
ALTER TABLE "subscription_history" DROP CONSTRAINT "subscription_history_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_clientId_fkey";

-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_jobOrderId_fkey";

-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_statusId_fkey";

-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_templateId_fkey";

-- DropForeignKey
ALTER TABLE "task_conversation" DROP CONSTRAINT "task_conversation_authorId_fkey";

-- DropForeignKey
ALTER TABLE "task_conversation" DROP CONSTRAINT "task_conversation_taskId_fkey";

-- DropForeignKey
ALTER TABLE "task_history" DROP CONSTRAINT "task_history_actorId_fkey";

-- DropForeignKey
ALTER TABLE "task_history" DROP CONSTRAINT "task_history_taskId_fkey";

-- DropForeignKey
ALTER TABLE "task_subtask" DROP CONSTRAINT "task_subtask_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "task_subtask" DROP CONSTRAINT "task_subtask_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "task_subtask" DROP CONSTRAINT "task_subtask_parentTaskId_fkey";

-- DropForeignKey
ALTER TABLE "task_subtask_history" DROP CONSTRAINT "task_subtask_history_actorId_fkey";

-- DropForeignKey
ALTER TABLE "task_subtask_history" DROP CONSTRAINT "task_subtask_history_subtaskId_fkey";

-- DropForeignKey
ALTER TABLE "task_template_route" DROP CONSTRAINT "task_template_route_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "task_template_route" DROP CONSTRAINT "task_template_route_templateId_fkey";

-- DropForeignKey
ALTER TABLE "task_template_subtask" DROP CONSTRAINT "task_template_subtask_routeId_fkey";

-- DropForeignKey
ALTER TABLE "timesheet" DROP CONSTRAINT "timesheet_clientId_fkey";

-- DropForeignKey
ALTER TABLE "timesheet" DROP CONSTRAINT "timesheet_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "tsa_contract" DROP CONSTRAINT "tsa_contract_actualApproverId_fkey";

-- DropForeignKey
ALTER TABLE "tsa_contract" DROP CONSTRAINT "tsa_contract_assignedApproverId_fkey";

-- DropForeignKey
ALTER TABLE "tsa_contract" DROP CONSTRAINT "tsa_contract_clientId_fkey";

-- DropForeignKey
ALTER TABLE "tsa_contract" DROP CONSTRAINT "tsa_contract_leadId_fkey";

-- DropForeignKey
ALTER TABLE "tsa_contract" DROP CONSTRAINT "tsa_contract_preparedById_fkey";

-- DropForeignKey
ALTER TABLE "tsa_contract" DROP CONSTRAINT "tsa_contract_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "vat_month" DROP CONSTRAINT "vat_month_complianceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "work_schedule" DROP CONSTRAINT "work_schedule_clientId_fkey";

-- DropForeignKey
ALTER TABLE "work_schedule_day" DROP CONSTRAINT "work_schedule_day_scheduleId_fkey";

-- DropTable
DROP TABLE "Department";

-- DropTable
DROP TABLE "EmployeeTeam";

-- DropTable
DROP TABLE "Position";

-- DropTable
DROP TABLE "_AutoOvertimeEmployees";

-- DropTable
DROP TABLE "_ExemptLateUndertimeEmployees";

-- DropTable
DROP TABLE "_ServiceCities";

-- DropTable
DROP TABLE "_ServiceGovOffices";

-- DropTable
DROP TABLE "_ServiceInclusions";

-- DropTable
DROP TABLE "_ServicePromos";

-- DropTable
DROP TABLE "account";

-- DropTable
DROP TABLE "account_detail_type";

-- DropTable
DROP TABLE "account_type";

-- DropTable
DROP TABLE "accounting_setting";

-- DropTable
DROP TABLE "activity_log";

-- DropTable
DROP TABLE "announcements";

-- DropTable
DROP TABLE "app";

-- DropTable
DROP TABLE "atms_clients";

-- DropTable
DROP TABLE "atms_submitted_documents";

-- DropTable
DROP TABLE "bir_information";

-- DropTable
DROP TABLE "business_operations";

-- DropTable
DROP TABLE "cash_advance";

-- DropTable
DROP TABLE "cash_advance_deduction";

-- DropTable
DROP TABLE "city";

-- DropTable
DROP TABLE "client_account";

-- DropTable
DROP TABLE "client_api_key";

-- DropTable
DROP TABLE "client_compliance";

-- DropTable
DROP TABLE "client_fund_transaction";

-- DropTable
DROP TABLE "client_session";

-- DropTable
DROP TABLE "client_subscription";

-- DropTable
DROP TABLE "client_user";

-- DropTable
DROP TABLE "client_user_assignment";

-- DropTable
DROP TABLE "client_verification";

-- DropTable
DROP TABLE "coa_request";

-- DropTable
DROP TABLE "compliance_document";

-- DropTable
DROP TABLE "compliance_note";

-- DropTable
DROP TABLE "compliance_record";

-- DropTable
DROP TABLE "compliance_setting";

-- DropTable
DROP TABLE "contact";

-- DropTable
DROP TABLE "corporate_details";

-- DropTable
DROP TABLE "corporate_shareholder";

-- DropTable
DROP TABLE "department_task_status";

-- DropTable
DROP TABLE "employee";

-- DropTable
DROP TABLE "employee_app_access";

-- DropTable
DROP TABLE "employee_compensation";

-- DropTable
DROP TABLE "employee_contract";

-- DropTable
DROP TABLE "employee_employment";

-- DropTable
DROP TABLE "employee_government_ids";

-- DropTable
DROP TABLE "employee_leave_credit";

-- DropTable
DROP TABLE "employee_level";

-- DropTable
DROP TABLE "ewt_item";

-- DropTable
DROP TABLE "ewt_item_history";

-- DropTable
DROP TABLE "ewt_item_template";

-- DropTable
DROP TABLE "ewt_item_template_history";

-- DropTable
DROP TABLE "expense_record";

-- DropTable
DROP TABLE "gl_account";

-- DropTable
DROP TABLE "government_loan";

-- DropTable
DROP TABLE "government_loan_deduction";

-- DropTable
DROP TABLE "government_office";

-- DropTable
DROP TABLE "holiday";

-- DropTable
DROP TABLE "hr_setting";

-- DropTable
DROP TABLE "individual_details";

-- DropTable
DROP TABLE "invoice";

-- DropTable
DROP TABLE "invoice_history";

-- DropTable
DROP TABLE "invoice_item";

-- DropTable
DROP TABLE "it_access_approver";

-- DropTable
DROP TABLE "it_asset";

-- DropTable
DROP TABLE "it_portal_access_request";

-- DropTable
DROP TABLE "it_ticket";

-- DropTable
DROP TABLE "job_order";

-- DropTable
DROP TABLE "job_order_item";

-- DropTable
DROP TABLE "journal_entry";

-- DropTable
DROP TABLE "journal_line";

-- DropTable
DROP TABLE "lead";

-- DropTable
DROP TABLE "lead_comment";

-- DropTable
DROP TABLE "lead_history";

-- DropTable
DROP TABLE "lead_status";

-- DropTable
DROP TABLE "leave_request";

-- DropTable
DROP TABLE "leave_type";

-- DropTable
DROP TABLE "notification";

-- DropTable
DROP TABLE "overtime_request";

-- DropTable
DROP TABLE "payment";

-- DropTable
DROP TABLE "payment_allocation";

-- DropTable
DROP TABLE "payment_history";

-- DropTable
DROP TABLE "payment_method_bank";

-- DropTable
DROP TABLE "payment_method_cash";

-- DropTable
DROP TABLE "payment_method_ewallet";

-- DropTable
DROP TABLE "payroll_period";

-- DropTable
DROP TABLE "payroll_schedule";

-- DropTable
DROP TABLE "payslip";

-- DropTable
DROP TABLE "percentage_tax_month";

-- DropTable
DROP TABLE "petty_cash";

-- DropTable
DROP TABLE "petty_cash_item";

-- DropTable
DROP TABLE "promo";

-- DropTable
DROP TABLE "quote";

-- DropTable
DROP TABLE "quote_line_item";

-- DropTable
DROP TABLE "sales_invoice_counter";

-- DropTable
DROP TABLE "sales_record";

-- DropTable
DROP TABLE "sales_setting";

-- DropTable
DROP TABLE "schedule_override";

-- DropTable
DROP TABLE "service";

-- DropTable
DROP TABLE "service_inclusion";

-- DropTable
DROP TABLE "service_package";

-- DropTable
DROP TABLE "service_package_item";

-- DropTable
DROP TABLE "service_task_template";

-- DropTable
DROP TABLE "session";

-- DropTable
DROP TABLE "subscription_history";

-- DropTable
DROP TABLE "task";

-- DropTable
DROP TABLE "task_conversation";

-- DropTable
DROP TABLE "task_history";

-- DropTable
DROP TABLE "task_subtask";

-- DropTable
DROP TABLE "task_subtask_history";

-- DropTable
DROP TABLE "task_template";

-- DropTable
DROP TABLE "task_template_route";

-- DropTable
DROP TABLE "task_template_subtask";

-- DropTable
DROP TABLE "timesheet";

-- DropTable
DROP TABLE "tsa_contract";

-- DropTable
DROP TABLE "user";

-- DropTable
DROP TABLE "vat_month";

-- DropTable
DROP TABLE "verification";

-- DropTable
DROP TABLE "work_schedule";

-- DropTable
DROP TABLE "work_schedule_day";

-- DropEnum
DROP TYPE "AnnouncementAudience";

-- DropEnum
DROP TYPE "AnnouncementPriority";

-- DropEnum
DROP TYPE "AppPortal";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "BillingCycle";

-- DropEnum
DROP TYPE "BirExpenseCategory";

-- DropEnum
DROP TYPE "BirInvoiceType";

-- DropEnum
DROP TYPE "BranchType";

-- DropEnum
DROP TYPE "BusinessEntity";

-- DropEnum
DROP TYPE "CashAdvanceStatus";

-- DropEnum
DROP TYPE "ClientFundTransactionType";

-- DropEnum
DROP TYPE "ClientPortalRole";

-- DropEnum
DROP TYPE "ClientUserStatus";

-- DropEnum
DROP TYPE "CoaActionType";

-- DropEnum
DROP TYPE "CoaRequestStatus";

-- DropEnum
DROP TYPE "ComplianceType";

-- DropEnum
DROP TYPE "ContactType";

-- DropEnum
DROP TYPE "ContractStatus";

-- DropEnum
DROP TYPE "ContractType";

-- DropEnum
DROP TYPE "DisbursedMethod";

-- DropEnum
DROP TYPE "DisbursedStatus";

-- DropEnum
DROP TYPE "DisbursementType";

-- DropEnum
DROP TYPE "DiscountType";

-- DropEnum
DROP TYPE "EmploymentStatus";

-- DropEnum
DROP TYPE "EmploymentType";

-- DropEnum
DROP TYPE "FilingFrequency";

-- DropEnum
DROP TYPE "FilingStatus";

-- DropEnum
DROP TYPE "FinancialStatementGroup";

-- DropEnum
DROP TYPE "GovernmentProvider";

-- DropEnum
DROP TYPE "HolidayType";

-- DropEnum
DROP TYPE "InvoiceChangeType";

-- DropEnum
DROP TYPE "InvoiceItemCategory";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "ItAssetStatus";

-- DropEnum
DROP TYPE "ItAssetType";

-- DropEnum
DROP TYPE "ItPortalAccessRequestStatus";

-- DropEnum
DROP TYPE "ItTicketPriority";

-- DropEnum
DROP TYPE "ItTicketStatus";

-- DropEnum
DROP TYPE "ItTicketType";

-- DropEnum
DROP TYPE "JobOrderItemType";

-- DropEnum
DROP TYPE "JobOrderStatus";

-- DropEnum
DROP TYPE "JournalEntryStatus";

-- DropEnum
DROP TYPE "JournalTransactionType";

-- DropEnum
DROP TYPE "LeadChangeType";

-- DropEnum
DROP TYPE "LeaveRequestStatus";

-- DropEnum
DROP TYPE "LoanStatus";

-- DropEnum
DROP TYPE "LogAction";

-- DropEnum
DROP TYPE "NormalBalance";

-- DropEnum
DROP TYPE "NotificationPriority";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "OvertimeStatus";

-- DropEnum
DROP TYPE "PackageStatus";

-- DropEnum
DROP TYPE "PagibigContributionType";

-- DropEnum
DROP TYPE "PayType";

-- DropEnum
DROP TYPE "PaymentChangeType";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PayrollPeriodStatus";

-- DropEnum
DROP TYPE "PettyCashItemCategory";

-- DropEnum
DROP TYPE "PettyCashStatus";

-- DropEnum
DROP TYPE "PlaceType";

-- DropEnum
DROP TYPE "PortalRole";

-- DropEnum
DROP TYPE "ProcessStatus";

-- DropEnum
DROP TYPE "QuoteStatus";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "SalaryFrequency";

-- DropEnum
DROP TYPE "SalaryRateType";

-- DropEnum
DROP TYPE "ServiceBillingType";

-- DropEnum
DROP TYPE "ServiceFrequency";

-- DropEnum
DROP TYPE "ServiceStatus";

-- DropEnum
DROP TYPE "SubscriptionChangeType";

-- DropEnum
DROP TYPE "TaskChangeType";

-- DropEnum
DROP TYPE "TaskPriority";

-- DropEnum
DROP TYPE "TsaStatus";

-- DropEnum
DROP TYPE "ZeroFilingStatus";
