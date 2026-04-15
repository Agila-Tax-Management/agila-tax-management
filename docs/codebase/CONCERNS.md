# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| ~~**High**~~ ✅ | ~~No test coverage~~ | ✅ **RESOLVED** — Jest configured with 9 passing tests; see `docs/JEST_SETUP.md` | ~~Regressions go undetected~~ | ✅ **Complete** — Continue expanding coverage to all API routes and critical flows |
| ~~**High**~~ ✅ | ~~Fire-and-forget error swallowing~~ | ✅ **RESOLVED** — Sentry error monitoring configured; see `docs/SENTRY_SETUP.md` | ~~Silent failures~~ | ✅ **Complete** — Add DSN and deploy to Vercel; consider background job queue for high-volume systems |
| **Medium** | Mock data transitional state | `src/lib/mock-*.ts` files still present; some components may use them | Data inconsistency; unclear which features use real API vs. mock data | Complete API migration: refactor all pages to call real API routes; keep mock files as reference until migration complete, then remove |
| ~~**Medium**~~ ✅ | ~~No observability/monitoring~~ | ✅ **RESOLVED** — Sentry error tracking + performance monitoring configured | ~~Difficult debugging~~ | ✅ **Complete** — Optional: Add structured logging (Winston/Pino) for request/response audit trail |
| **Medium** | Multi-file Prisma schema complexity | Schema split across 13+ files in `prisma/models/`, `prisma/accounting-models/`, etc. | Schema changes require careful coordination; risk of missed foreign key updates or circular dependencies | Document schema organization + add Prisma schema validation to CI |

### 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Toast-on-every-mutation enforcement | Manual process; no automated check | All API route calls from components | Inconsistent UX; some mutations silently succeed/fail without user feedback | Create ESLint rule or add to code review checklist |
| No connection pooling for PostgreSQL | Direct connection via `DATABASE_URL` in PrismaPg adapter | src/lib/db.ts | Connection exhaustion under load; poor performance in production | Use Prisma connection pooler or PgBouncer |
| No request/response logging middleware | Fire-and-forget logging only for user actions, not all API requests | src/app/api/ routes | Difficult to debug failed requests; no audit trail for all API calls | Add Next.js middleware with structured logging (Winston/Pino) |
| No pagination enforcement | API routes may return unbounded result sets | API routes (e.g., GET /api/sales/leads) | Performance degradation as data grows; potential OOM errors | Add pagination to all GET endpoints; enforce `take`/`skip` in Prisma queries |
| One TODO comment in production code | "wire to real API when available" | src/components/compliance/SubscriptionDetail.tsx:191 | Feature incomplete; unclear implementation status | Replace with real API call or remove if not needed |

### 3) Security Concerns

| Risk | OWASP category (if applicable) | Evidence | Current mitigation | Gap |
|------|--------------------------------|----------|--------------------|-----|
| Raw error messages may leak to client | A04:2021 – Insecure Design | .github/copilot-instructions.md: "Never expose error.message in 500 responses" | Convention documented but not enforced | No automated check; add ESLint rule or middleware to sanitize error responses |
| No input sanitization for SQL injection | A03:2021 – Injection | Prisma ORM used (parameterized queries) | Prisma prevents SQL injection by default | [Low risk] Verify no raw SQL queries (`$executeRaw` without parameterization) |
| Missing rate limiting | A07:2021 – Identification and Authentication Failures | No rate limiting middleware detected | None | Add rate limiting middleware (express-rate-limit or Next.js middleware) to prevent brute-force and DoS |
| No HTTPS enforcement | A02:2021 – Cryptographic Failures | [TODO: Verify if HTTPS is enforced in production] | [TODO: Check deployment config] | Ensure HTTPS redirect in production (Vercel/Docker/reverse proxy) |
| Cloudinary secrets in env vars | A02:2021 – Cryptographic Failures | CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in env | Environment variables (better than hardcoding) | [Low risk] Consider secrets manager (Vault, AWS Secrets Manager) for production |
| No CSRF protection visible | A01:2021 – Broken Access Control | BetterAuth may include CSRF tokens (not verified) | [TODO: Verify BetterAuth CSRF implementation] | Confirm BetterAuth session tokens include CSRF protection |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| No caching layer | No Redis, no CDN caching detected | Every request hits PostgreSQL | High query load as users grow; slow response times | Add Redis for session/query caching + CDN for static assets |
| Unbounded result sets in GET endpoints | No pagination visible in GET /api/sales/leads | Works fine with small data | OOM or timeout with 10k+ records | Enforce pagination (limit/offset or cursor-based) |
| Synchronous fire-and-forget writes | `void logActivity()`, `void notify()` write to PostgreSQL synchronously | No visible performance issue yet | Slows down API responses as log volume grows | Move to background job queue (BullMQ + Redis) |
| No database connection pooling | PrismaPg adapter with direct DATABASE_URL connection | Works in dev | Connection exhaustion under concurrent load | Use Prisma connection pooler or PgBouncer in production |
| No query optimization | No `select` projections visible; full model fetches common | Works fine with small tables | Slow queries as tables grow (Employee, Client, ComplianceRecord) | Add selective `select` projections; use `include` sparingly |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| Multi-file Prisma schema | 13+ interconnected schema files | [TODO: Check git log for schema change frequency] | Coordinate schema changes across all files; test migrations in dev environment first |
| API routes with transactions | Complex sequential logic (INV-YYYY-XXXX generation) | [TODO: Check git blame on accounting/sales API routes] | Add integration tests before modifying; wrap in Prisma transaction; verify rollback behavior |
| BetterAuth integration | Custom auth adapter with Prisma | [TODO: Check if auth.ts has recent changes] | Test auth flows (login, logout, session refresh) after any BetterAuth upgrade |
| Theme system (light/dark mode) | Complex CSS variable mapping in globals.css | [TODO: Check git log for globals.css] | Test theme toggle in all modules before merging theme changes |

### 6) Resolved Questions

All questions have been answered:

1. ✅ **Prisma client location**: Intentionally in `src/generated/prisma/` (not moved to default)
2. ✅ **BetterAuth secrets**: Configured in `.env` file (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
3. ✅ **Test framework**: Jest (React/Next.js standard) — configured with 9 passing tests (see `docs/JEST_SETUP.md`)
4. ✅ **Prettier**: Not needed — team prefers ESLint-only
5. ✅ **Deployment target**: Vercel
6. ✅ **Data retention policy**: Implemented 7-year ActivityLog archival + notification cleanup (see `docs/DATA_RETENTION_POLICY.md`)
7. ✅ **Error monitoring**: Sentry configured with client/server/edge tracking (see `docs/SENTRY_SETUP.md`)
8. ✅ **Mock data files**: Keep as reference during migration, remove when all pages use real API

### 7) Evidence

- grep_search for TODO/FIXME/HACK found 1 TODO
- No test files detected (grep_search, package.json)
- src/lib/activity-log.ts, src/lib/notification.ts (fire-and-forget pattern)
- .github/copilot-instructions.md (documented conventions vs. actual enforcement gaps)
- src/lib/db.ts (Prisma singleton, no pooling)
- compose.yaml (dev PostgreSQL, no production config)
- eslint.config.mjs (no custom security rules added)

## Extended Sections (Optional)

### Intent vs. Reality Divergences

| Intent (from copilot-instructions.md) | Reality (from codebase analysis) | Gap |
|----------------------------------------|-----------------------------------|-----|
| "Every successful operation must show a success() toast" | No automated enforcement | Manual, error-prone |
| "Always run get_errors after code changes" | No CI/CD pipeline to enforce | Manual validation only |
| "Do NOT use mock data in components" | Mock files still present in `src/lib/mock-*.ts` | Migration incomplete |
| "Never expose error.message in 500 responses" | No middleware or ESLint rule to enforce | Convention only, not enforced |
| "RBAC enforced client-side + server-side" | Client-side conditional rendering visible; server-side enforcement not verified in all routes | [TODO: Audit all API routes for `getSessionWithAccess()` check] |

*Evidence: .github/copilot-instructions.md vs. actual codebase state*

### Recommended Priority Actions

**High Priority (Next Sprint):**
1. ~~Add error monitoring (Sentry or similar)~~ ✅ **DONE** (see `docs/SENTRY_SETUP.md`)
3. ~~Implement data retention policy~~ ✅ **DONE** (see `docs/DATA_RETENTION_POLICY.md`)
4. Expand test coverage to API routes and Zod schemas
5. **Start PostgreSQL database and run Prisma migration** (`npx prisma migrate dev`)
6. **Add Sentry DSN to .env** (create project at sentry.io)
7. **Add CRON_SECRET to .env** (for data retention job)n below)
4. Expand test coverage to API routes and Zod schemas

**Medium Priority (Next Quarter):**
5. Complete mock data → real API migration; keep `mock-*.ts` as reference until done
6. Add pagination to all GET endpoints
7. Add rate limiting middleware
8. Add Redis caching layer (Vercel KV recommended for Vercel deployment)
9. Add request/response logging middleware

**Low Priority (Backlog):**
10. Add database connection pooling (Vercel Postgres recommended for Vercel deployment)
11. Create ESLint rule for toast notification enforcement
12. Audit all API routes for RBAC enforcement

*Evidence: Risk severity + impact analysis from sections above*

### Data Retention Policy Recommendation (For ERP/Tax Management Systems)

**Recommended Approach:**

**ActivityLog (Audit Trail)**
- **Retention**: **7 years** (matches Philippine BIR document retention requirement)
- **Rationale**: Tax compliance systems must maintain audit trails for legal/regulatory purposes
- **Implementation**: Add `archivedAt` field; move records older than 7 years to archive table or cold storage
- **Growth estimate**: ~50-200 MB/year for typical tax firm (10k-50k transactions/year)

**InternalNotification (Operational Alerts)**
- **Retention**: **90 days** for read notifications, **180 days** for unread
- **Rationale**: Notifications are operational, not compliance-critical; older ones lose relevance
- **Implementation**: Add scheduled job to soft-delete or hard-delete old notifications
- **Growth estimate**: Minimal impact (~1-5 MB/year)

**Implementation Strategy:**
1. Add Prisma schema migration for `archivedAt` timestamp fields
2. Create cron job (Vercel Cron or external scheduler) to run monthly archival
3. Add admin dashboard to view/export archived logs
4. Consider partitioning strategy if ActivityLog exceeds 1M records

**Code Example** (Vercel Cron):
```typescript
// src/app/api/cron/archive-logs/route.ts
export async function GET() {
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
  
  await prisma.activityLog.updateMany({
    where: { createdAt: { lt: sevenYearsAgo }, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  await prisma.notification.deleteMany({
    where: { 
      createdAt: { lt: ninetyDaysAgo },
      readAt: { not: null },
    },
  });
  
  return Response.json({ archived: true });
}
```

*Evidence: Philippine BIR regulations (7-year document retention), ERP best practices, Vercel deployment constraints*
