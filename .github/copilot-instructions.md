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
   - Any UI/theme decisions (including whether dark mode is involved)
2. **Wait for approval** — Do **not** proceed with code changes until the user explicitly confirms the plan.
3. **Iterate** — If the user requests adjustments to the plan, revise and re-present before implementing.
4. **Execute** — Only after approval, carry out the changes and report what was done.
5. **Validate** — **IMMEDIATELY** after completing code changes:
   - **ALWAYS** run `get_errors` to check for TypeScript/build/syntax errors
   - If errors are found, fix them **immediately** before considering the task complete
   - Re-run `get_errors` after fixes until zero errors remain
   - **CRITICAL**: When using `replace_string_in_file`, ensure `oldString` matches **exactly** with proper context (3-5 lines before/after). File corruption occurs when oldString doesn't match precisely.
   - For large multi-section replacements, prefer multiple smaller targeted replacements over one large replacement
   - After any file edit, verify the change succeeded by checking for errors

This applies to all feature work, refactors, bug fixes, and schema changes. Trivial questions, file reads, or research tasks do not require a plan.

**Default behavior:** For implementation tasks, always present the plan in chat first and wait for explicit user confirmation before making edits. After executing changes, **always validate with `get_errors`** before reporting completion.

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
    users.prisma          # User, Session, Account, Verification + Role enum (SUPER_ADMIN, ADMIN, EMPLOYEE)
    employee.prisma       # Employee (structured address fields, extended personal info), Department, Position, Teams
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
- Roles enum: `SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`

### BetterAuth Conventions

- Use `authClient.signIn.email()` / `authClient.signUp.email()` for credential auth
- Use `authClient.useSession()` hook to access session in client components
- Protect API routes by calling `auth.api.getSession({ headers })` and returning 401 if null
- Protect pages with middleware or server-side session checks
- Refer to official docs: https://www.better-auth.com/docs

---

## Media & File Uploads (Cloudinary)

- Helper: `src/lib/cloudinary.ts` — exports `uploadToCloudinary`, `deleteFromCloudinary`, `getPublicIdFromUrl`
- SDK: `cloudinary` npm package (v2 API via `import { v2 as cloudinary } from 'cloudinary'`)
- Required environment variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Profile images are stored as `User.image` (string URL) in the database after upload

### Cloudinary Conventions

- Use `uploadToCloudinary(buffer, folder?, publicId?)` for all uploads — returns `{ publicId, secureUrl, width, height, format, bytes }`
- Always use `secureUrl` (HTTPS) when storing the URL — never `url`
- Use `folder: 'atms/profiles'` for profile avatars; add module-specific sub-folders for other assets (e.g., `atms/documents`)
- Use a fixed `publicId` (e.g., `user-{userId}`) for overwritable assets so re-uploads replace the old file
- Call `deleteFromCloudinary(publicId)` when replacing or removing an asset — use `getPublicIdFromUrl(url)` to extract the ID from a stored URL
- Upload transformations for profile photos: `{ width: 400, height: 400, crop: 'fill', gravity: 'face' }` + `{ quality: 'auto', fetch_format: 'auto' }`
- Validate on both client and server: allowed types `image/jpeg`, `image/png`, `image/webp`, `image/gif`; max size 5 MB
- File upload API example:

  ```typescript
  // src/app/api/profile/avatar/route.ts
  import { uploadToCloudinary } from '@/lib/cloudinary';

  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadToCloudinary(buffer, 'atms/profiles', `user-${session.user.id}`);
  // result.secureUrl → store in database
  ```

---

## PDF Generation (@react-pdf/renderer)

- Package: `@react-pdf/renderer` — installed, use for all client-side PDF generation
- **Never** use `window.open` with injected HTML to print — Tailwind classes do not carry over to a new window
- PDF template file: `src/components/accounting/InvoicePDF.tsx` — uses `Document`, `Page`, `View`, `Text`, `StyleSheet` primitives
- **Always lazy-load** via dynamic `import()` inside click handlers — `@react-pdf/renderer` must never be imported at the module level in App Router components (causes SSR errors)

### Standard `openPDF` helper pattern

```typescript
async function openInvoicePDF(invoice: InvoiceRecord) {
  const [{ pdf }, { InvoicePDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/accounting/InvoicePDF'),
  ]);
  const el = React.createElement(InvoicePDF, { invoice }) as Parameters<typeof pdf>[0];
  const blob = await pdf(el).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');           // opens browser's native PDF viewer
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
```

- Use `React.createElement(Component, props) as Parameters<typeof pdf>[0]` — required type assertion because `pdf()` expects `ReactElement<DocumentProps>`, not a generic JSX element
- The browser's native PDF viewer provides its own Print / Save buttons — no custom print modal needed
- Call `URL.revokeObjectURL` after a delay to free memory
- Show a loading indicator (`isPrinting` state) while generating; disable the button to prevent double-clicks

### InvoicePDF styling rules

- Use `StyleSheet.create()` — inline style objects in JSX are not supported by react-pdf
- Only `Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique`, and `Courier` are available without registering fonts
- Use `textTransform: 'uppercase'` and `letterSpacing` for section headings
- Monetary values rendered with `₱` + `toLocaleString('en-PH', { minimumFractionDigits: 2 })`

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
- `Employee` model uses **structured address fields** (no flat `address` string): `currentStreet`, `currentBarangay`, `currentCity`, `currentProvince`, `currentZip` + permanent equivalents — all optional
- `Employee` model has extended personal info: `nameExtension`, `username`, `personalEmail`, `placeOfBirth`, `civilStatus`, `citizenship`, `educationalBackground`, `school`, `course`, `yearGraduated`, `certifications` — all optional
- `Employee` has a `softDelete Boolean @default(false)` flag alongside `active`

### Database Transactions (`prisma.$transaction`)

- Wrap all **multi-step mutations** in a single `prisma.$transaction(async (tx) => { ... })` to guarantee full atomicity — all writes roll back on any failure
- Inside the callback, use `tx` (not `prisma`) for every DB operation
- **Sequential code generation** (e.g., `INV-YYYY-XXXX`, `PAY-YYYY-XXXX`) must be done **inside** the transaction to prevent duplicates:
  ```typescript
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await tx.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });
  let nextSeq = 1;
  if (latest) {
    const parts = latest.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]!, 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }
  const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  ```
- `revalidatePath` calls must be placed **after** the transaction resolves — never inside it
- `logActivity` and `notify` (fire-and-forget) must also be called **outside** the transaction
- Only use transactions where atomicity genuinely matters (multi-record mutations). Single-record operations do not need `$transaction`

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

- Roles defined in Prisma enum: `SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`
- App-level permissions: `EmployeeAppAccess` model with `canRead`, `canWrite`, `canEdit`, `canDelete` per app module
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

## Component Structure Convention

### Page-Specific vs Global Components

Components that are **only used by a single page** must live in a `components/` folder co-located with that page, not in `src/components/`.

```
src/app/(dashboard)/dashboard/settings/user-management/
  page.tsx                     # Thin page wrapper — imports from ./components/
  components/
    UserManagement.tsx          # Main page component (data fetching, layout)
    UserFormModal.tsx            # Add/Edit modal
    UserViewModal.tsx            # View modal
    UserDeleteModal.tsx          # Delete confirmation modal
```

**Rules:**
- Page-specific components go in `<page-folder>/components/`
- Global/shared components stay in `src/components/UI/` or `src/components/<module>/`
- When a component is used by 2+ unrelated pages, promote it to `src/components/UI/` or the appropriate module folder
- The `page.tsx` file itself should be a thin wrapper that imports and renders the main component

### Data Fetching — API-First

- **Every page and component must use real API routes** for data (GET, POST, PUT, DELETE)
- **Do NOT use mock data** in components — mock files (`src/lib/mock-*.ts`) are reference-only during transition
- Before building a new page, check if API routes already exist under `src/app/api/` — if they do, use them
- If a page currently uses mock data, refactor it to call the real API as part of the work

---

## Client Portal Users (`ClientUser` + `ClientUserAssignment`)

Client portal users are external users (typically client business owners) who access the client-facing portal. They are fully isolated from internal `User` accounts.

- Model: `ClientUser` in `prisma/models/user-client.prisma` — BetterAuth-compatible with its own `ClientSession`, `ClientAccount`, `ClientVerification` tables
- Join table: `ClientUserAssignment` links a `ClientUser` to one or more `Client` records with a `ClientPortalRole`
- Role enum: `ClientPortalRole` — `OWNER`, `ADMIN`, `EMPLOYEE`, `VIEWER`
- **Default role for `ClientUserAssignment` is `OWNER`** — the admin management page always creates assignments with `role: "OWNER"`
- `ClientUserStatus` enum: `ACTIVE`, `INACTIVE`, `SUSPENDED`

### Client User Management Conventions

- API: `GET/POST /api/admin/settings/client-users` and `GET/PUT/PATCH/DELETE /api/admin/settings/client-users/[id]`
- The management UI (`UserClientManagement`, `UserClientFormModal`, `UserClientViewModal`) lives in `src/components/dashboard/`
- Shared types live in `src/types/client-user-management.types.ts` — `ClientUserRecord`, `ApiAssignment`, `ClientUserFormValues`, `ClientOption`
- The GET endpoint accepts `?role=OWNER` to filter by role
- Creating or updating a client user always uses `role: "OWNER"` for all assignments
- The view modal displays a role badge (`a.role`) alongside the client active status badge
- Auth client for the portal: `src/lib/auth-client-portal.ts` (separate BetterAuth instance)

---

## Portal Apps (AppPortal Enum)

All portal apps are defined in `prisma/models/app-access.prisma` and seeded in `prisma/seed.ts`:

| Portal Key         | Label                    |
| ------------------ | ------------------------ |
| `SALES`            | Sales Portal             |
| `COMPLIANCE`       | Compliance Portal        |
| `LIAISON`          | Liaison Portal           |
| `ACCOUNTING`       | Accounting Portal        |
| `ACCOUNT_OFFICER`  | Account Officer Portal   |
| `HR`               | HR Portal                |
| `TASK_MANAGEMENT`  | Task Management Portal   |
| `CLIENT_RELATIONS` | Client Relations Portal  |

When adding portal-related UI (checkboxes, labels), always include **all** portals from this list.

---

## Key Patterns

### Module Sidebar Pattern

All module sidebars follow the same structure:
- Fixed overlay on mobile, static column on `lg:` breakpoint
- Slide-in/out animation
- Logo header → navigation groups → footer with user info
- Badge indicators for counts (e.g., pending tasks, unread notifications)

### Mock Data (Transitional)

- Mock data files in `src/lib/mock-*.ts` exist as reference for data shapes only
- **All new features must use real API routes** — never introduce new mock data
- When touching a page that still uses mock data, refactor it to call the real API
- Keep mock files around until all pages have been migrated

### Theme System

- Light mode: default (`:root` variables)
- Dark mode: `.dark` class on `<html>` (variables overridden)
- Toggle via `ThemeContext` → persisted in `localStorage`
- Use theme-aware classes: `bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.
- Copilot default: do **not** use, suggest, or implement dark-theme UI/styles unless the user explicitly prompts for dark mode.
