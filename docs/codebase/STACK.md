# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript 5 | tsconfig.json, package.json |
| Runtime + version | Node.js 18+ | README.md, Dockerfile (node:18-alpine) |
| Package manager | npm | package.json (scripts section), package-lock.json |
| Module/build system | Next.js 16.1.6 (App Router) | package.json, next.config.ts |

### 2) Production Frameworks and Dependencies

List only high-impact production dependencies (frameworks, data, transport, auth).

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| next | 16.1.6 | Web framework (App Router) | package.json |
| react | 19.2.3 | UI library | package.json |
| react-dom | 19.2.3 | React DOM renderer | package.json |
| @prisma/client | 7.4.2 | Database ORM client | package.json, prisma/schema.prisma |
| @prisma/adapter-pg | 7.4.2 | PostgreSQL adapter for Prisma | package.json, src/lib/db.ts |
| pg | 8.20.0 | PostgreSQL driver | package.json |
| better-auth | 1.5.4 | Authentication framework | package.json, src/lib/auth.ts |
| zod | 4.3.6 | Schema validation | package.json, src/lib/schemas/ |
| cloudinary | 2.9.0 | Media/image upload service | package.json, src/lib/cloudinary.ts |
| @react-pdf/renderer | 4.3.2 | PDF generation | package.json, .github/copilot-instructions.md |
| recharts | 3.8.0 | Chart components | package.json |
| lucide-react | 0.577.0 | Icon library | package.json, .github/copilot-instructions.md |
| xlsx | 0.18.5 | Excel file operations | package.json |
| tailwindcss | 4.x | Utility-first CSS framework | package.json, src/app/globals.css |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| ESLint | Linting (Next.js + TypeScript config) | eslint.config.mjs, package.json |
| TypeScript | Static type checking (strict mode) | tsconfig.json, package.json |
| Prisma CLI | Database migration & codegen | package.json (devDependencies), prisma/ |
| tsx | TypeScript execution for seed scripts | package.json (devDependencies, prisma.seed) |
| dotenv | Environment variable loading | package.json (devDependencies), prisma.config.ts |
| Tailwind PostCSS | CSS processing | package.json (devDependencies), postcss.config.mjs |

### 4) Key Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Production server
npm run start

# Linting
npm run lint

# Database migration
npx prisma migrate dev

# Prisma client generation
npx prisma generate

# Seed database
npx prisma db seed
```

### 5) Environment and Config

- Config sources: `tsconfig.json`, `next.config.ts`, `prisma.config.ts`, `eslint.config.mjs`, `tailwind.config.js` (implicit v4), `.env`
- Required env vars: `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- Deployment/runtime constraints: Node.js 18+, PostgreSQL database required, **Vercel deployment target**, Docker support for local dev via Dockerfile + compose.yaml

### 6) Evidence

- package.json
- tsconfig.json
- next.config.ts
- prisma/schema.prisma
- Dockerfile
- compose.yaml
- .github/copilot-instructions.md

## Extended Sections (Optional)

*Not needed for this codebase complexity level.*
