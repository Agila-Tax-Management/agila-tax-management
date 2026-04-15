# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System | Type (API/DB/Queue/etc) | Purpose | Auth model | Criticality | Evidence |
|--------|---------------------------|---------|------------|-------------|----------|
| PostgreSQL | Database | Primary data store for all entities | Connection string (DATABASE_URL) | **High** | prisma/schema.prisma, src/lib/db.ts |
| Cloudinary | API (Media CDN) | Image/file upload and storage | API key + secret (env vars) | **Medium** | src/lib/cloudinary.ts, next.config.ts |

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| PostgreSQL | Primary relational database | Prisma ORM via PrismaPg adapter (src/lib/db.ts) | No connection pooling visible; direct connection via DATABASE_URL | compose.yaml, src/lib/db.ts |

### 3) Secrets and Credentials Handling

- Credential sources: **Environment variables in `.env` file**
- Hardcoding checks: **None found** — all credentials accessed via `process.env.*`
- Rotation or lifecycle notes: **[TODO]** — no documented rotation policy

**Required environment variables** (from `.env` file and code analysis):
- `DATABASE_URL` (PostgreSQL connection string)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `BETTER_AUTH_SECRET` (BetterAuth session secret)
- `BETTER_AUTH_URL` (BetterAuth base URL)
- `NODE_ENV` (implicit — used for Prisma singleton guard)

### 4) Reliability and Failure Behavior

- Retry/backoff behavior: **None implemented** — all external calls (Prisma, Cloudinary) fail fast
- Timeout policy: **[TODO]** — no explicit timeout configuration found
- Circuit-breaker or fallback behavior: **None** — failures propagate to client

### 5) Observability for Integrations

- Logging around external calls: **Partial**
  - Activity logging via `logActivity()` for user actions (CRUD operations)
  - Internal notifications via `notify()` for workflow events
  - No structured logging for Prisma query performance or Cloudinary upload failures
- Metrics/tracing coverage: **None** — no APM, Prometheus, or OpenTelemetry detected
- Missing visibility gaps:
  - No query performance monitoring for Prisma
  - No Cloudinary upload success/failure metrics
  - No request/response logging middleware for API routes
  - No error aggregation service (Sentry, Rollbar, etc.)

### 6) Evidence

- src/lib/db.ts (Prisma singleton with PrismaPg adapter)
- src/lib/cloudinary.ts (Cloudinary helper functions)
- next.config.ts (Cloudinary remote image patterns)
- src/lib/activity-log.ts (user action logging)
- src/lib/notification.ts (internal notifications)
- .github/copilot-instructions.md (Cloudinary, Database, Activity Logging sections)

## Extended Sections (Optional)

### Cloudinary Integration Details

- **Upload helper**: `uploadToCloudinary(buffer, folder?, publicId?)` → returns `{ publicId, secureUrl, width, height, format, bytes }`
- **Folder convention**: `atms/profiles` for avatars, `atms/documents` for other assets
- **Delete helper**: `deleteFromCloudinary(publicId)`
- **Public ID extraction**: `getPublicIdFromUrl(url)` — extracts from stored Cloudinary URL
- **Profile image transformations**: `{ width: 400, height: 400, crop: 'fill', gravity: 'face' }` + `{ quality: 'auto', fetch_format: 'auto' }`
- **Validation**: Allowed types `image/jpeg`, `image/png`, `image/webp`, `image/gif`; max size 5 MB
- **Overwrite strategy**: Use fixed `publicId` (e.g., `user-{userId}`) so re-uploads replace old file

*Evidence: .github/copilot-instructions.md (Media & File Uploads section), src/lib/cloudinary.ts*

### PostgreSQL Connection

- **Adapter**: `@prisma/adapter-pg` with `PrismaPg` wrapper
- **Driver**: `pg` package (native PostgreSQL driver)
- **Connection string**: `DATABASE_URL` env var
- **Development database**: Docker Compose service (`postgres:15-alpine`, port 5432, credentials: `postgres/password`, database: `tax_management`)
- **Singleton pattern**: Prevents multiple Prisma instances in dev hot reload

*Evidence: src/lib/db.ts, compose.yaml, package.json*

### No Message Queue or Cache

- **No Redis** detected (no `ioredis`, `redis`, or cache layer)
- **No message queue** (no RabbitMQ, Kafka, SQS, Pub/Sub)
- **No background job processor** (no Bull, BullMQ, Agenda, or similar)
- **Fire-and-forget pattern** used instead: `void logActivity()`, `void notify()` — writes to PostgreSQL synchronously but doesn't block API response

**Vercel Deployment Recommendations:**
- **Caching**: Use Vercel KV (Redis-compatible) for session and query caching
- **Database**: Consider Vercel Postgres (built-in connection pooling) or Neon (serverless PostgreSQL)
- **Background Jobs**: Use Vercel Cron for scheduled tasks, or Inngest/Trigger.dev for complex workflows
- **File Storage**: Cloudinary already in use (good choice for Vercel serverless environment)

*Evidence: package.json (no queue/cache dependencies), src/lib/activity-log.ts, src/lib/notification.ts, deployment target: Vercel*
