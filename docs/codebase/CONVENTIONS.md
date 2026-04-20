# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files (Components) | PascalCase | `UserFormModal.tsx`, `ClientManagement.tsx` | src/components/dashboard/UserClientManagement.tsx |
| Files (Utilities) | kebab-case or camelCase | `activity-log.ts`, `db.ts`, `notification.ts` | src/lib/ directory |
| Files (Routes) | kebab-case in folders, `page.tsx` or `route.ts` | `user-management/page.tsx`, `leads/route.ts` | src/app/ structure |
| Functions/methods | camelCase | `getSessionWithAccess()`, `logActivity()`, `notify()` | src/lib/session.ts, src/lib/activity-log.ts |
| React components | PascalCase (export default function) | `function UserFormModal()`, `function ClientManagement()` | src/components/dashboard/ |
| Types/interfaces | PascalCase | `ClientUserRecord`, `NotifyInput`, `CreateClientInput` | src/types/, src/lib/notification.ts |
| Constants/env vars | SCREAMING_SNAKE_CASE (env), camelCase (TS constants) | `DATABASE_URL`, `CLOUDINARY_API_KEY`, `ROLE_PERMISSIONS` | .github/copilot-instructions.md, src/lib/constants.ts |
| Route groups | (kebab-case) | `(auth)`, `(dashboard)`, `(portal)` | src/app/ |
| Unused variables | Prefix with `_` | `_request`, `_error` | eslint.config.mjs, .github/copilot-instructions.md |

### 2) Formatting and Linting

- Formatter: **No explicit formatter** (Prettier not found in package.json) — [TODO: Verify if Prettier is used]
- Linter: **ESLint** with flat config (`eslint.config.mjs`)
  - `eslint-config-next/core-web-vitals`
  - `eslint-config-next/typescript`
- Most relevant enforced rules:
  - `@typescript-eslint/no-unused-vars` (warn) — prefix with `_` for intentional non-use
  - `@typescript-eslint/no-explicit-any` (warn) — avoid `any`, use specific types or `unknown`
  - `react-hooks/set-state-in-effect` (error) — never call setState in useEffect
  - `react-hooks/purity` (error) — no Date.now(), Math.random() during render
  - `react-hooks/exhaustive-deps` (warn) — include all dependencies
  - `prefer-const` (warn)
- Run commands:

```bash
npm run lint
```

- Generated files excluded from linting: `src/generated/**`, `.next/**`, `out/**`, `build/**`

### 3) Import and Module Conventions

- Import grouping/order: **No enforced order** — [TODO: Document if a pattern exists]
- Alias vs relative import policy: **Use `@/*` alias for all src imports** (tsconfig.json paths)
  - Example: `import prisma from '@/lib/db';` (not `../../lib/db`)
- Public exports/barrel policy: **No barrel exports** — direct imports from specific files

### 4) Error and Logging Conventions

- Error strategy by layer:
  - **API routes**: Return `NextResponse.json({ error: "..." }, { status: 4xx/5xx })` — never expose raw `error.message` in 500s
  - **Components**: Display toast notification via `useToast()` hook for user feedback
  - **Fire-and-forget operations**: `void logActivity()`, `void notify()` — errors suppressed
- Logging style and required context fields:
  - **Activity logging**: `logActivity({ userId, action, entity, entityId, description, ...getRequestMeta(request) })`
  - **Request metadata**: IP address and user-agent via `getRequestMeta(request)`
  - Available `LogAction` values: `CREATED`, `UPDATED`, `DELETED`, `VIEWED`, `EXPORTED`, `IMPORTED`, `LOGIN`, `LOGOUT`, `STATUS_CHANGE`, `PERMISSION_CHANGE`, `ASSIGNED`, `UNASSIGNED`, `APPROVED`, `REJECTED`, `SUBMITTED`, `CANCELLED`, `ARCHIVED`, `RESTORED`
- Sensitive-data redaction rules: **Never expose credentials or raw error messages to clients** — [TODO: Verify PII redaction in logs]

### 5) Testing Conventions

- Test file naming/location rule: **No tests found** — [TODO: Define test conventions]
- Mocking strategy norm: **No tests found** — [TODO: Define mocking strategy]
- Coverage expectation: **No coverage configured** — [TODO: Set coverage threshold]

### 6) Evidence

- eslint.config.mjs (flat config with Next.js + TypeScript)
- .github/copilot-instructions.md (Coding Rules, Linting, TypeScript, React Components)
- tsconfig.json (path aliases, strict mode)
- src/lib/activity-log.ts (logging pattern)
- src/app/api/sales/leads/route.ts (API error response pattern)

## Extended Sections (Optional)

### TypeScript Strictness

- **Strict mode enabled** (`tsconfig.json`)
- **Never use `any`** — use specific types, `unknown`, `Record<string, unknown>`, or union types
- **No `React.FC`** — use explicit return types:
  - `React.ReactNode` (default for most components)
  - `JSX.Element` (single element)
  - `React.ReactElement` (when cloning/inspecting elements)
- **Always define `children` prop explicitly** — do not rely on implicit children

*Evidence: tsconfig.json, .github/copilot-instructions.md (TypeScript, React Components sections)*

### React Hooks Conventions

- **Never call setState synchronously in useEffect** — use "adjust state during render" pattern:
  ```typescript
  // ✅ Correct
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setStep('initial');
  }

  // ❌ Wrong
  useEffect(() => { if (isOpen) setStep('initial'); }, [isOpen]);
  ```
- **Exception**: Suppress lint rule for hydration-safe localStorage reads on mount
- **Use `useEffect` only for**: Syncing with external systems, subscriptions, timers/intervals

*Evidence: .github/copilot-instructions.md (React Hooks Conventions)*

### Toast Notification Conventions

- **Every successful operation** must show `success()` toast
- **Every failed operation** must show `error()` toast
- **Usage**:
  ```typescript
  import { useToast } from '@/context/ToastContext';
  const { success, error } = useToast();
  success('Client created', 'The new client has been saved successfully.');
  error('Failed to save', 'Please check the form and try again.');
  ```

*Evidence: .github/copilot-instructions.md (Toast Notifications)*

### Prisma Conventions

- **Multi-step mutations** must use `prisma.$transaction(async (tx) => { ... })`
- **Sequential code generation** (e.g., `INV-YYYY-XXXX`) must be inside transaction
- **`revalidatePath` calls** must be **after** transaction resolves
- **Fire-and-forget (`logActivity`, `notify`)** must be **outside** transaction

*Evidence: .github/copilot-instructions.md (Database Transactions)*
