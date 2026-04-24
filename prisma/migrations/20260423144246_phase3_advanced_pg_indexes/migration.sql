-- Phase 3: Advanced PostgreSQL-Specific Indexes
-- Uses features Prisma schema syntax cannot express:
--   1. pg_trgm extension for fuzzy/substring text search (GIN indexes)
--   2. Partial indexes (WHERE clause) to index only the rows actually queried
-- SAFE: All additions only. Zero schema logic changes. Zero breaking changes.

-- ═══════════════════════════════════════════════════════════════════
-- STEP 1: Enable pg_trgm extension
-- Required for GIN trigram indexes used in LIKE '%...%' search queries
-- ═══════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 2: GIN Trigram Indexes (Fuzzy / Substring Text Search)
-- Fixes: LIKE '%searchterm%' currently causes full sequential scans
-- Impact: Search bars across client list, lead list, employee list
-- ═══════════════════════════════════════════════════════════════════

-- Client business name search (accounting, sales, compliance modules)
CREATE INDEX IF NOT EXISTS "idx_clients_businessname_trgm"
  ON "atms_clients" USING gin("businessName" gin_trgm_ops);

-- Lead name search (CRM lead list)
CREATE INDEX IF NOT EXISTS "idx_lead_firstname_trgm"
  ON "lead" USING gin("firstName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_lead_lastname_trgm"
  ON "lead" USING gin("lastName" gin_trgm_ops);

-- Employee name search (HR module, task assignment dropdowns)
CREATE INDEX IF NOT EXISTS "idx_employee_firstname_trgm"
  ON "employee" USING gin("firstName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_employee_lastname_trgm"
  ON "employee" USING gin("lastName" gin_trgm_ops);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 3: Partial Indexes (Index only the rows that are queried)
-- Standard @@index scans ALL rows. Partial indexes skip irrelevant ones.
-- ═══════════════════════════════════════════════════════════════════

-- Active clients only (99% of queries never touch inactive clients)
CREATE INDEX IF NOT EXISTS "idx_clients_active_only"
  ON "atms_clients"("id", "businessName")
  WHERE "active" = true;

-- Active, non-deleted employees only (HR list, payroll, task assignment)
CREATE INDEX IF NOT EXISTS "idx_employee_active_only"
  ON "employee"("id")
  WHERE "active" = true AND "softDelete" = false;

-- Active subscriptions only (billing cron — only touches isActive=true rows)
CREATE INDEX IF NOT EXISTS "idx_subscription_active_billing"
  ON "client_subscription"("nextBillingDate", "clientId")
  WHERE "isActive" = true;

-- Tasks with an assignee only (task board filtering by assignee)
CREATE INDEX IF NOT EXISTS "idx_task_assigned_only"
  ON "task"("assignedToId", "departmentId", "statusId")
  WHERE "assignedToId" IS NOT NULL;

-- Unread notifications only (notification bell — always filters isRead=false)
CREATE INDEX IF NOT EXISTS "idx_notification_unread_only"
  ON "notification"("userId", "createdAt" DESC)
  WHERE "isRead" = false;

-- Unpaid / overdue invoices only (accounting dashboard outstanding balance)
CREATE INDEX IF NOT EXISTS "idx_invoice_outstanding"
  ON "invoice"("clientId", "dueDate")
  WHERE "status" IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE');

-- Pending HR requests (HR approval queues — only PENDING rows are actioned)
CREATE INDEX IF NOT EXISTS "idx_leave_request_pending"
  ON "leave_request"("clientId", "createdAt" DESC)
  WHERE "status" = 'PENDING';

CREATE INDEX IF NOT EXISTS "idx_overtime_request_pending"
  ON "overtime_request"("clientId", "createdAt" DESC)
  WHERE "status" = 'PENDING';

CREATE INDEX IF NOT EXISTS "idx_coa_request_pending"
  ON "coa_request"("clientId", "createdAt" DESC)
  WHERE "status" = 'PENDING';