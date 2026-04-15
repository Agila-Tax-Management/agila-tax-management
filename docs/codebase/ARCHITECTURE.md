# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: **Feature-based modular monolith with Next.js App Router**
- Why this classification: 
  - Code organized by business modules (Sales, Accounting, Compliance, HR, Liaison, Account Officer, Task Management, Client Relations) in route groups under `src/app/(portal)/portal/`
  - Each module has its own components folder in `src/components/<module>/`
  - Shared infrastructure (auth, DB, notifications, activity logging) in `src/lib/`
  - API routes parallel the portal structure in `src/app/api/`
  - Multi-file Prisma schema organized by domain (accounting-models, hr-models, sales-models, compliance-models, services-models)
- Primary constraints:
  1. **Next.js App Router server/client boundaries** — server components by default, client components require `'use client'` directive
  2. **Multi-tenant RBAC** — role-based access control via `Role` enum (SUPER_ADMIN, ADMIN, EMPLOYEE) and `EmployeeAppAccess` per-app permissions
  3. **Philippine tax compliance** — business logic tailored to BIR, SEC, DTI, SSS, PhilHealth, PAGIBIG requirements

### 2) System Flow

```text
[Client Request] 
  -> [Next.js App Router / API Route Handler]
  -> [Auth Check via BetterAuth (src/lib/auth.ts, getSessionWithAccess)]
  -> [Request Validation via Zod Schema (src/lib/schemas/)]
  -> [Prisma Query via prisma singleton (src/lib/db.ts)]
  -> [PostgreSQL Database]
  -> [Fire-and-forget: Activity Log / Notification (src/lib/activity-log.ts, src/lib/notification.ts)]
  -> [JSON Response to Client]
```

**Typical flow example (Create Lead):**
1. POST request to `/api/sales/leads` (`src/app/api/sales/leads/route.ts`)
2. `getSessionWithAccess()` checks authentication
3. Request body validated with `createLeadSchema` (Zod)
4. `prisma.lead.create()` writes to PostgreSQL
5. `logActivity()` and `notify()` called with `void` (fire-and-forget)
6. `NextResponse.json({ data: lead })` returned

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| API Routes (`src/app/api/`) | Auth checks, input validation, Prisma queries, JSON responses | UI rendering, client state | src/app/api/sales/leads/route.ts |
| Pages (`src/app/(portal)/`) | Server-rendered UI, route layouts | Direct DB access (must call API) | .github/copilot-instructions.md |
| Components (`src/components/`) | Presentation logic, local state, UI interactions | Direct Prisma calls, API route definitions | src/components/dashboard/UserClientManagement.tsx |
| Lib (`src/lib/`) | Utilities (DB singleton, auth config, logging, notifications) | React components, route handlers | src/lib/db.ts, src/lib/auth.ts |
| Prisma Schema (`prisma/`) | Data models, migrations, seed scripts | Application logic | prisma/models/, prisma/schema.prisma |
| Context (`src/context/`) | Global state (auth session, theme, toast notifications) | Business logic, API calls | src/context/AuthContext.tsx, src/context/ThemeContext.tsx |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| **Singleton (Prisma Client)** | src/lib/db.ts | Prevent multiple Prisma instances in dev (hot reload); use PrismaPg adapter |
| **Fire-and-forget logging** | src/lib/activity-log.ts, src/lib/notification.ts | `void logActivity()`, `void notify()` — never block API response |
| **Zod Schema Validation** | src/lib/schemas/, API routes | Type-safe runtime validation for all API inputs |
| **BetterAuth Session Check** | All API routes via `auth.api.getSession({ headers })` | Uniform authentication guard across API routes |
| **Prisma Transactions** | API routes with multi-step mutations (e.g., invoice + payment) | Atomicity for sequential code generation (INV-YYYY-XXXX, PAY-YYYY-XXXX) |
| **React "Adjust State During Render"** | Components (no setState in useEffect) | Avoid cascading renders; comply with react-hooks/set-state-in-effect ESLint rule |
| **Theme Toggle via Context** | src/context/ThemeContext.tsx | Persist light/dark theme in localStorage, apply `.dark` class to `<html>` |
| **Toast Notifications** | src/context/ToastContext.tsx | Every success/failure operation shows user feedback |
| **Path Alias (@/*)** | tsconfig.json, all imports | Simplify imports, avoid relative path hell |
| **Lazy PDF Import** | Components with PDF generation | `@react-pdf/renderer` must never be imported at module level (SSR errors) |

### 5) Known Architectural Risks

- **No test coverage** — No automated tests detected; all validation is manual
- **Mock data transitional state** — Some components still use `src/lib/mock-*.ts` instead of real API routes; migration in progress
- **Multi-file Prisma schema complexity** — Schema split across 13+ files; changes require careful coordination across models
- **Fire-and-forget error swallowing** — `void logActivity()` and `void notify()` suppress failures; no retry or dead-letter queue
- **Generated code in src/** — Prisma client output in `src/generated/prisma/` may conflict with version control patterns
- **No caching layer** — All data fetched fresh from PostgreSQL on every request; no Redis or CDN caching

### 6) Evidence

- .github/copilot-instructions.md (Architecture, Agent Workflow, Tech Stack)
- src/app/api/sales/leads/route.ts (API route pattern)
- src/lib/db.ts (Prisma singleton)
- src/lib/auth.ts (BetterAuth config)
- src/lib/activity-log.ts (Fire-and-forget logging)
- src/context/ThemeContext.tsx (Theme toggle pattern)

## Extended Sections (Optional)

### Startup and Initialization Order

1. Next.js runtime loads root layout (`src/app/layout.tsx`)
2. ThemeProvider wraps all content → reads `localStorage.theme` on mount
3. AuthContext initializes → BetterAuth session check via `authClient.useSession()`
4. Prisma client singleton created on first import of `src/lib/db.ts` (PrismaPg adapter connects to DATABASE_URL)
5. App renders based on route

*Evidence: src/app/layout.tsx, src/context/ThemeContext.tsx, src/context/AuthContext.tsx*

### Multi-Tenant RBAC

- **Internal users** (`User` model): `Role` enum (SUPER_ADMIN, ADMIN, EMPLOYEE)
- **App-level access**: `EmployeeAppAccess` model with `canRead`, `canWrite`, `canEdit`, `canDelete` per portal app
- **Client portal users** (`ClientUser` model): Separate auth instance (`src/lib/auth-client-portal.ts`), `ClientPortalRole` enum (OWNER, ADMIN, EMPLOYEE, VIEWER)
- **Enforcement**: Client-side conditional rendering + server-side API route guards via `getSessionWithAccess()`

*Evidence: prisma/models/users.prisma, prisma/models/app-access.prisma, prisma/models/user-client.prisma, .github/copilot-instructions.md (RBAC section)*
