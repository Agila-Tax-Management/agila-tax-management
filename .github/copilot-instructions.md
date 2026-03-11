# Agila Tax Management System — Copilot Instructions

## Project Overview

**Agila Tax Management System (ATMS)** is a Philippine-based tax management and ERP platform built for a tax consulting firm. It manages the full lifecycle of client tax compliance, sales operations, accounting, HR, and internal task coordination.

### Business Context

- Philippine tax compliance (BIR, SEC, DTI, Mayor's Permit, SSS, PhilHealth, PAGIBIG)
- Service plans for VAT and Non-VAT entities (Starter → VIP tiers)
- Client types: Professional clients and Sole Proprietorships
- 11-stage sales lead pipeline (New → Turnover + Lost)
- Operates primarily in Cebu City and surrounding areas

### Enterprise Modules

| Module           | Route                     | Purpose                                              |
| ---------------- | ------------------------- | ---------------------------------------------------- |
| Sales (ASP)      | `/portal/sales`           | Leads, service plans, client list, commissions        |
| Accounting       | `/portal/accounting`      | Payments, invoices, billing, financial reports         |
| Compliance       | `/portal/compliance`      | Task board, client compliances, open cases, reports    |
| Liaison          | `/portal/liaison`         | Field task board, scheduling calendar                  |
| HR               | `/portal/hr`              | Employees, leave, attendance, payroll, gov compliance  |
| Account Officer  | `/portal/account-officer` | Client task management, discussions, notifications     |
| Employee Dashboard | `/dashboard`            | Timesheet, payslips, HR apps, enterprise portal access |

---

## Agent Workflow

> **Mandatory for every task involving code changes.**

1. **Plan first** — Before writing or modifying any code, present a clear summary of:
   - The problem or feature being addressed
   - Which files will be created, edited, or deleted
   - The implementation approach and any trade-offs
2. **Wait for approval** — Do **not** proceed with code changes until the user explicitly confirms the plan.
3. **Iterate** — If the user requests adjustments to the plan, revise and re-present before implementing.
4. **Execute** — Only after approval, carry out the changes and report what was done.

This applies to all feature work, refactors, bug fixes, and schema changes. Trivial questions, file reads, or research tasks do not require a plan.

---

## Tech Stack

| Layer        | Technology                                     |
| ------------ | ---------------------------------------------- |
| Framework    | Next.js 16 (App Router)                        |
| Language     | TypeScript 5                                   |
| UI           | React 19                                       |
| Styling      | Tailwind CSS v4 + custom theme (see below)     |
| Database     | PostgreSQL (via `@prisma/adapter-pg`)           |
| ORM          | Prisma 7 (multi-file schema in `prisma/models/`) |
| Auth         | BetterAuth with Prisma adapter                  |
| Validation   | Zod                                            |
| Charts       | Recharts                                       |
| Icons        | `lucide-react`                                  |
| Fonts        | Geist Sans + Geist Mono (Google Fonts)          |
| Container    | Docker (Dockerfile + compose.yaml)              |

---

## Project Structure

```
prisma/
  schema.prisma          # Prisma config (generator + datasource only)
  models/                # Multi-file schema models
    users.prisma          # User, Session, Account, Verification + Role enum
    employee.prisma       # Employee, Department, Position, Teams
    client.prisma         # Client, ClientUser, ProfessionalClient, SoleProprietorship
    app-access.prisma     # App, EmployeeAppAccess (RBAC per module)
  migrations/
src/
  app/
    layout.tsx            # Root layout (ThemeProvider wraps all pages)
    globals.css           # Tailwind + custom CSS variables (light/dark)
    page.tsx              # Marketing landing page
    (auth)/               # Auth route group (login, register, reset-password, etc.)
    (dashboard)/          # Employee dashboard route group
    (portal)/             # Enterprise portal route group (all modules)
    app/api/auth/         # BetterAuth API catch-all route
  components/
    UI/                   # Shared reusable components (Modal, Card, Badge, Button, Input)
    sales/                # Sales/ASP module components
    accounting/           # Accounting module components
    compliance/           # Compliance module components
    liaison/              # Liaison module components
    hr/                   # HR module components
    account-officer/      # Account Officer module components
    dashboard/            # Employee dashboard components
    notifications/        # Notification components
  context/
    AuthContext.tsx        # Auth state + attendance tracking
    ThemeContext.tsx       # Light/dark theme toggle (localStorage persistence)
  lib/
    auth.ts               # BetterAuth server config (Prisma adapter, PostgreSQL)
    auth-client.ts        # BetterAuth client (createAuthClient + nextCookies)
    db.ts                 # Prisma client singleton (PrismaPg adapter)
    prisma.ts             # Prisma client alternate export
    types.ts              # Shared TypeScript interfaces
    constants.ts          # Role permissions, route constants
    role-context.tsx      # Role context (Employee, HR, Admin)
    service-data.ts       # Service plan definitions
    mock-*.ts             # Mock data files (to be replaced with real API calls)
  generated/
    prisma/               # Generated Prisma client (do NOT edit)
```

---

## Coding Rules

### Linting (ESLint)

- Config: `eslint.config.mjs` — flat config with `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Run: `npm run lint` — must pass with **zero errors** before committing
- Generated files (`src/generated/**`) are excluded from linting

#### Key rules and conventions

| Rule | Level | Convention |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | warn | Prefix intentionally unused variables with `_` (e.g., `_request`, `_error`) |
| `@typescript-eslint/no-explicit-any` | warn | Avoid `any` — use specific types, `unknown`, `Record<string, unknown>`, or union types |
| `@typescript-eslint/no-empty-object-type` | warn | Use `type Alias = ParentType` instead of `interface Alias extends ParentType {}` |
| `react-hooks/set-state-in-effect` | error | **Never** call `setState` synchronously in `useEffect` — use the "adjust state during render" pattern or lazy initializers |
| `react-hooks/purity` | error | **Never** call impure functions (`Date.now()`, `Math.random()`) during render — use `crypto.randomUUID()` or move to event handlers |
| `react-hooks/exhaustive-deps` | warn | Include all dependencies; wrap expensive object creation in `useMemo` to stabilize references |
| `prefer-const` | warn | Use `const` when a variable is never reassigned |

#### Unused variables pattern

```typescript
// Prefix with _ to signal intentional non-use
export async function GET(_request: NextRequest) { ... }
const [_error] = useState<string | null>(null);
```

#### Resetting state when props change (no useEffect)

Use the React-approved "adjust state during render" pattern instead of `useEffect` + `setState`:

```typescript
// ✅ Correct — adjust state during render
const [prevIsOpen, setPrevIsOpen] = useState(false);
if (isOpen !== prevIsOpen) {
  setPrevIsOpen(isOpen);
  if (isOpen) {
    setStep('initial');
    setFormData({});
  }
}

// ❌ Wrong — triggers cascading renders
useEffect(() => {
  if (isOpen) {
    setStep('initial');
    setFormData({});
  }
}, [isOpen]);
```

#### Resetting pagination on filter change

```typescript
// ✅ Correct — derived reset during render
const [prevFilters, setPrevFilters] = useState({ searchTerm, filterTeam });
if (prevFilters.searchTerm !== searchTerm || prevFilters.filterTeam !== filterTeam) {
  setPrevFilters({ searchTerm, filterTeam });
  setCurrentPage(1);
}

// ❌ Wrong — setState in useEffect
useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTeam]);
```

#### Exception: localStorage / browser API sync

Suppress the lint rule when reading browser-only APIs on mount (hydration-safe pattern):

```typescript
/* eslint-disable react-hooks/set-state-in-effect -- Hydration-safe: must read localStorage after mount */
useEffect(() => {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') setTheme('dark');
  setMounted(true);
}, []);
/* eslint-enable react-hooks/set-state-in-effect */
```

### TypeScript

- Never use `any` or implicit `any`
- Prefer explicit, strongly typed interfaces and types
- Always include the file path as the first comment in every code block
- Define shared types in `src/lib/types.ts`
- Use Zod schemas for all form and API input validation

### React Components

- **DO NOT** use `React.FC` or `React.FunctionComponent`
- Use explicit return types:
  - `React.ReactNode` — default for most components
  - `JSX.Element` — when returning a single element
  - `React.ReactElement` — when cloning or inspecting elements
- Always explicitly define `children` prop when needed (do not rely on implicit children)
- Use `next/image` `<Image />` — **never** `<img>`
- Use `lucide-react` — **not** Heroicons

### State Management

- **DO NOT** call `setState` synchronously within `useEffect`
- Prefer deriving state from props over `useState`
- Only use mounting state pattern for browser-only APIs or hydration mismatch prevention
- Use `useEffect` only for:
  - Syncing with external systems
  - Subscribing to external data
  - Timers / intervals

### Styling

- **Tailwind CSS v4** with custom theme variables defined in `src/app/globals.css`
- Custom CSS variables for light/dark mode: `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--sidebar`, `--header`, etc.
- Mapped to Tailwind via `@theme inline` block (e.g., `bg-background`, `text-foreground`, `bg-card`)
- Dark mode: uses `.dark` class on `<html>` element, toggled via ThemeContext
- Font: `font-sans` maps to Geist Sans, `font-mono` maps to Geist Mono

### Toast Notifications

- Use the `useToast()` hook from `@/context/ToastContext` for **all** user-facing feedback
- **Every successful operation** (create, update, delete, form submit, status change) must show a `success()` toast
- **Every failed operation** (API error, validation failure, caught exception) must show an `error()` toast
- Apply to modals, forms, inline actions, and any workflow that produces a result
- Toast messages should be concise and user-friendly — never expose raw error objects or stack traces
- Usage:
  ```typescript
  // src/components/example/ExampleForm.tsx
  import { useToast } from '@/context/ToastContext';

  const { success, error } = useToast();

  // After a successful operation
  success('Client created', 'The new client has been saved successfully.');

  // After a failed operation
  error('Failed to save', 'Please check the form and try again.');
  ```

### Error Response Convention

- Use `{ error: "..." }` key for error responses (not `{ message: "..." }`)
- Never expose `error.message` in 500 responses to clients
- Always add toast on modals for successful and failed operations

### Layouts — Do Not Modify

- Do not change any layout unless explicitly asked
- If recommending layout changes, explain the UX advantage first

---

## Authentication (BetterAuth)

- Server: `src/lib/auth.ts` — `betterAuth()` with `prismaAdapter` on PostgreSQL
- Client: `src/lib/auth-client.ts` — `createAuthClient()` with `nextCookies()` plugin
- API route: `src/app/api/auth/[...all]/route.ts` — catch-all handler
- Auth models: `User`, `Session`, `Account`, `Verification` in `prisma/models/users.prisma`
- Roles enum: `SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`, `CLIENT`

### BetterAuth Conventions

- Use `authClient.signIn.email()` / `authClient.signUp.email()` for credential auth
- Use `authClient.useSession()` hook to access session in client components
- Protect API routes by calling `auth.api.getSession({ headers })` and returning 401 if null
- Protect pages with middleware or server-side session checks
- Refer to official docs: https://www.better-auth.com/docs

---

## Database (Prisma)

- Config: `prisma.config.ts` (uses `dotenv/config` for env loading)
- Schema: Multi-file schema — `prisma/schema.prisma` for generator/datasource, models in `prisma/models/*.prisma`
- Client: Singleton in `src/lib/db.ts` using `PrismaPg` adapter with connection string from `DATABASE_URL`
- Generated client output: `src/generated/prisma/` — **never edit generated files**
- Always use `prisma` (the default export from `src/lib/db.ts`) for database operations

### Prisma Conventions

- Run `npx prisma migrate dev` after schema changes
- Run `npx prisma generate` to regenerate the client after schema or config changes
- Use `@@map()` for custom table names where needed
- Use `@default(cuid())` for string IDs, `@default(autoincrement())` for integer IDs
- Use `Decimal` with `@db.Decimal(precision, scale)` for monetary values
- Always include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on models

---

## Form Validation (Zod)

- Use Zod schemas for all form inputs and API request bodies
- Co-locate schemas with the component or API route that uses them, or in `src/lib/schemas/` for shared schemas
- Infer TypeScript types from Zod schemas with `z.infer<typeof schema>`
- Example:
  ```typescript
  // src/lib/schemas/client.ts
  import { z } from "zod";

  export const createClientSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
  });

  export type CreateClientInput = z.infer<typeof createClientSchema>;
  ```

---

## API Routes

- Place API routes under `src/app/api/` following Next.js App Router conventions
- Use Route Handlers (`route.ts`) with named exports: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Always validate request body with Zod before processing
- Always check authentication via `auth.api.getSession({ headers })`
- Return consistent JSON responses:
  - Success: `NextResponse.json({ data: ... })`
  - Error: `NextResponse.json({ error: "..." }, { status: 4xx/5xx })`

---

## Activity Logging

- Utility: `src/lib/activity-log.ts` — fire-and-forget logger using `logActivity()` 
- Model: `ActivityLog` in `prisma/models/activity-logs.prisma`
- **Every mutating API route** (create, update, delete, status change, permission change) must log the action
- Call with `void` so it never blocks the response:
  ```typescript
  // src/app/api/clients/route.ts
  import { logActivity, getRequestMeta } from '@/lib/activity-log';

  // After a successful create/update/delete:
  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "Client",
    entityId: client.id,
    description: `Created client ${client.companyName}`,
    ...getRequestMeta(request),
  });
  ```
- Use `getRequestMeta(request)` to automatically extract IP and user-agent from the request headers
- Available `LogAction` values: `CREATED`, `UPDATED`, `DELETED`, `VIEWED`, `EXPORTED`, `IMPORTED`, `LOGIN`, `LOGOUT`, `STATUS_CHANGE`, `PERMISSION_CHANGE`, `ASSIGNED`, `UNASSIGNED`, `APPROVED`, `REJECTED`, `SUBMITTED`, `CANCELLED`, `ARCHIVED`, `RESTORED`
- `description` should be human-readable (e.g. "Created client Acme Corp", "Updated employee #42 salary")
- Use `metadata` (JSON) for structured before/after values when logging updates

---

## Internal Notifications

- Utility: `src/lib/notification.ts` — fire-and-forget notification creator
- Model: `InternalNotification` in `prisma/models/internal-notif.prisma`
- Use `notify()` for single-recipient and `notifyMany()` for multi-recipient notifications
- Call with `void` so it never blocks the response:
  ```typescript
  // src/app/api/clients/route.ts
  import { notify, notifyMany } from '@/lib/notification';

  // Single recipient
  void notify({
    recipientId: managerId,
    actorId: session.user.id,
    type: "SUCCESS",
    title: "New client created",
    message: `${client.companyName} was added by ${session.user.name}.`,
    entity: "Client",
    entityId: client.id,
    actionUrl: `/portal/sales/clients/${client.id}`,
  });

  // Multiple recipients
  void notifyMany({
    recipientIds: [userId1, userId2],
    title: "Monthly report ready",
    message: "The March compliance report is now available.",
    type: "INFO",
  });
  ```
- Available `NotificationType` values: `INFO`, `SUCCESS`, `WARNING`, `ERROR`, `ACTION_REQUIRED`
- Available `NotificationPriority` values: `LOW`, `NORMAL`, `HIGH`, `URGENT`
- Always set `entity` and `entityId` when the notification relates to a specific record
- Always set `actionUrl` when the user should be able to click through to a relevant page

---

## Role-Based Access Control

- Roles defined in Prisma enum: `SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`, `CLIENT`
- App-level permissions: `EmployeeAppAccess` model with `canView`, `canCreate`, `canEdit`, `canDelete` per app module
- Client context roles: `Employee`, `HR`, `Admin` (in `src/lib/role-context.tsx`)
- Permissions map in `src/lib/constants.ts` (`ROLE_PERMISSIONS`)
- Enforce access checks both client-side (conditional rendering) and server-side (API route guards)

---

## Shared UI Components

Reusable components live in `src/components/UI/`:

- `Modal.tsx` — Generic modal with `isOpen`, `onClose`, `title`, `size` props
- `Card.tsx` — Card wrapper with consistent styling
- `Badge.tsx` — Status badges with variant support (`neutral`, `danger`, `success`, etc.)
- `Button.tsx` — Reusable button
- `Input.tsx` — Form input
- `PayslipModal.tsx` — Payslip viewing/download
- `ServicePlanModal.tsx` — Service plan details

Always check `src/components/UI/` before creating new generic components — extend existing ones when possible.

---

## Key Patterns

### Module Sidebar Pattern

All module sidebars follow the same structure:
- Fixed overlay on mobile, static column on `lg:` breakpoint
- Slide-in/out animation
- Logo header → navigation groups → footer with user info
- Badge indicators for counts (e.g., pending tasks, unread notifications)

### Mock Data (Transitional)

- Mock data files in `src/lib/mock-*.ts` power the current UI
- When building new features, wire them to real API routes and Prisma queries
- Keep mock files as reference for data shapes during transition

### Theme System

- Light mode: default (`:root` variables)
- Dark mode: `.dark` class on `<html>` (variables overridden)
- Toggle via `ThemeContext` → persisted in `localStorage`
- Use theme-aware classes: `bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.
