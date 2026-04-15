# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `prisma/` | Multi-file Prisma schema, migrations, seed script | prisma/schema.prisma, prisma/models/, prisma/migrations/ |
| `prisma/models/` | Core entity models (users, employee, client, etc.) | Directory listing |
| `prisma/accounting-models/` | Accounting domain models | Directory listing |
| `prisma/compliance-models/` | Compliance domain models | Directory listing |
| `prisma/hr-models/` | HR domain models | Directory listing |
| `prisma/sales-models/` | Sales domain models | Directory listing |
| `prisma/services-models/` | Service/contract models | Directory listing |
| `src/` | Application source code | README.md |
| `src/app/` | Next.js App Router pages and API routes | .github/copilot-instructions.md |
| `src/app/(auth)/` | Authentication route group | .github/copilot-instructions.md |
| `src/app/(dashboard)/` | Employee dashboard route group | .github/copilot-instructions.md |
| `src/app/(portal)/` | Enterprise portal route group (all modules) | .github/copilot-instructions.md |
| `src/app/api/` | API route handlers | Directory listing |
| `src/components/` | React components organized by module | Directory listing |
| `src/components/UI/` | Shared reusable UI components | .github/copilot-instructions.md |
| `src/context/` | React context providers (Auth, Theme, Toast) | Directory listing, .github/copilot-instructions.md |
| `src/lib/` | Utility functions, DB client, auth config, helpers | Directory listing |
| `src/generated/prisma/` | Generated Prisma client (do not edit) | .github/copilot-instructions.md |
| `src/types/` | Shared TypeScript type definitions | Workspace structure |
| `public/images/` | Static image assets | Workspace structure |
| `scripts/` | Utility scripts | Workspace structure |
| `docs/` | Project documentation | Created via this skill |
| `Dockerfile` | Docker container definition | Dockerfile |
| `compose.yaml` | Docker Compose config (PostgreSQL service) | compose.yaml |
| `.github/` | GitHub-specific config (Copilot instructions, skills) | Workspace structure |

### 2) Entry Points

- Main runtime entry: `src/app/page.tsx` (marketing landing), `src/app/layout.tsx` (root layout)
- Next.js App Router entry: All `page.tsx` files in `src/app/`
- API entry: All `route.ts` files in `src/app/api/`
- Database seed: `prisma/seed.ts` (via `npm run prisma db seed` or `tsx prisma/seed.ts`)
- How entry is selected: Next.js App Router convention — file-system based routing

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `src/app/` | Pages, layouts, route handlers, route groups | Business logic, DB queries (should be in API routes or lib) |
| `src/app/api/` | API route handlers with auth, validation, Prisma calls | UI components, client-side logic |
| `src/components/` | Reusable React components (presentation + local state) | Direct DB access, API route definitions |
| `src/lib/` | Utilities, DB client singleton, auth, helpers, constants | React components, route handlers |
| `prisma/` | Schema definitions, migrations, seed data | Application logic, components |
| `src/generated/` | Auto-generated Prisma client | Any manual edits |

### 4) Naming and Organization Rules

- File naming pattern:
  - Pages: `page.tsx` (Next.js convention)
  - API routes: `route.ts` (Next.js convention)
  - Components: **PascalCase** (e.g., `UserFormModal.tsx`, `ClientManagement.tsx`)
  - Utilities: **kebab-case** or **camelCase** (e.g., `activity-log.ts`, `db.ts`)
  - Route groups: **(groupName)** in kebab-case (e.g., `(auth)`, `(dashboard)`)
- Directory organization pattern: **Feature-based** within route groups and components, **layer-based** for API routes
- Import aliasing: `@/*` maps to `src/*` (tsconfig.json paths)

### 5) Evidence

- .github/copilot-instructions.md (project structure section)
- tsconfig.json (path aliases)
- Workspace directory listing
- src/app/ (Next.js App Router structure)
- prisma/ (multi-file schema structure)

## Extended Sections (Optional)

### Component Co-location

- **Page-specific components** must live in `<page-folder>/components/`, not in `src/components/`
- Example: `src/app/(dashboard)/dashboard/settings/user-management/components/UserFormModal.tsx`
- **Global/shared components** stay in `src/components/UI/` or `src/components/<module>/`
- Promote to global when used by 2+ unrelated pages

### Mock Data (Transitional)

- Mock data files in `src/lib/mock-*.ts` are **reference-only** during API migration
- All new features must use real API routes
- When touching a page that uses mock data, refactor it to call the real API

*Evidence: .github/copilot-instructions.md (Component Structure Convention, Data Fetching sections)*
