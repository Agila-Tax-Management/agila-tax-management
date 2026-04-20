# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: **None configured**
- Assertion/mocking tools: **None configured**
- Commands:

```bash
# No test commands available
[TODO: Configure test framework]
```

### 2) Test Layout

- Test file placement pattern: **No test files found**
- Naming convention: **[TODO]** — No convention defined
- Setup files and where they run: **[TODO]** — No setup files

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | **No** | [TODO: Utilities, helpers, validation logic] | No unit tests detected |
| Integration | **No** | [TODO: API routes, Prisma queries] | No integration tests detected |
| E2E | **No** | [TODO: User workflows, portal interactions] | No E2E tests detected |

### 4) Mocking and Isolation Strategy

- Main mocking approach: **[TODO]** — No mocking strategy defined
- Isolation guarantees: **[TODO]** — No isolation guarantees
- Common failure mode in tests: **N/A** — No tests to analyze

### 5) Coverage and Quality Signals

- Coverage tool + threshold: **None configured** — [TODO: Add Jest/Vitest + coverage threshold]
- Current reported coverage: **0%** (no tests)
- Known gaps/flaky areas: **All code untested**

### 6) Evidence

- grep_search for `*.test.ts`, `*.spec.ts`, `describe|test|it\(` returned no results
- package.json has no test runner dependency (no Jest, Vitest, Mocha, etc.)
- package.json scripts has no `test` command

## Extended Sections (Optional)

### Recommended Test Framework Setup

**Selected Framework: Jest** (de facto standard for React/Next.js, built-in coverage)

**Installation:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest ts-jest
```

**Configuration** (jest.config.js):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/generated/**',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

**Setup file** (jest.setup.js):
```javascript
import '@testing-library/jest-dom';
```

**Package.json scripts** (add these):
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Coverage targets to consider:**
- API routes (unit + integration via supertest or built-in fetch mocks)
- Utility functions in `src/lib/` (unit)
- Prisma transaction logic (integration with test database)
- Component rendering (React Testing Library)
- E2E critical flows: login → create client → generate invoice → record payment

**Mock dependencies:**
- Prisma queries → `jest-mock-extended` or Vitest's built-in mocking
- Cloudinary uploads → mock `cloudinary.uploader.upload`
- BetterAuth sessions → mock `auth.api.getSession`
- External API calls (when added) → MSW (Mock Service Worker)

*Evidence: .github/copilot-instructions.md mentions test coverage as a missing concern indirectly (no testing guidance provided)*

### Test-Driven Concerns from Codebase

- **No validation for Prisma transactions** — sequential code generation logic (`INV-YYYY-XXXX`, `PAY-YYYY-XXXX`) is untested and could have race conditions
- **No schema validation tests** — Zod schemas in `src/lib/schemas/` are not validated against edge cases
- **No API route integration tests** — all CRUD operations untested
- **No component snapshot tests** — UI regressions can slip through undetected
- **No E2E tests for multi-step workflows** — lead → quote → job order → invoice → payment pipeline is untested

*Evidence: Inferred from lack of test files and complexity of transaction logic in API routes*
