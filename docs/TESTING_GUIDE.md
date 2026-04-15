# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized using the `__tests__` folder pattern:

```
src/
  lib/
    __tests__/
      activity-log.test.ts
  components/
    UI/
      __tests__/
        Badge.test.tsx
  app/
    api/
      accounting/
        invoices/
          __tests__/
            sequential-code-generation.test.ts
```

## Writing Tests

### 1. Unit Tests (Utilities)

Test pure functions in isolation:

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from '@jest/globals';
import { myUtilFunction } from '../utils';

describe('myUtilFunction', () => {
  it('should return expected output', () => {
    expect(myUtilFunction('input')).toBe('expected');
  });
});
```

### 2. Component Tests

Test React components with React Testing Library:

```typescript
// src/components/UI/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 3. API Route Tests

Test API handlers with mocked Prisma:

```typescript
// src/app/api/clients/__tests__/route.test.ts
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
jest.mock('@/lib/db');
jest.mock('@/lib/session', () => ({
  getSessionWithAccess: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

describe('GET /api/clients', () => {
  it('returns clients list', async () => {
    const request = new NextRequest('http://localhost:3000/api/clients');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
  });
});
```

## Critical Test Areas

Based on the codebase analysis, focus on:

### High Priority
1. ✅ **Sequential code generation** (`INV-YYYY-XXXX`, `PAY-YYYY-XXXX`)
   - See: `src/app/api/accounting/invoices/__tests__/sequential-code-generation.test.ts`
2. **Prisma transactions** (atomicity guarantees)
3. **Zod schema validation** (edge cases)

### Medium Priority
4. **API routes** (CRUD operations)
5. **Auth guards** (`getSessionWithAccess`)
6. **Component rendering** (UI components)

### Low Priority
7. **Utility functions** (calculations, formatters)
8. **E2E workflows** (lead → invoice → payment)

## Mocking Guide

### Mock Prisma Client

```typescript
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    client: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));
```

### Mock BetterAuth Session

```typescript
jest.mock('@/lib/session', () => ({
  getSessionWithAccess: jest.fn(() => ({
    user: { id: 'user-123', role: 'ADMIN' },
  })),
}));
```

### Mock Cloudinary

```typescript
jest.mock('@/lib/cloudinary', () => ({
  uploadToCloudinary: jest.fn(() => ({
    publicId: 'test-id',
    secureUrl: 'https://cloudinary.com/test.jpg',
  })),
}));
```

## Coverage Goals

Current threshold: **50%** (branches, functions, lines, statements)

Target areas to increase coverage:
- `src/lib/` utilities: **80%+**
- `src/app/api/` routes: **70%+**
- `src/components/` UI: **60%+**

## Next Steps

1. ✅ Jest configured
2. ✅ Sample tests created
3. 🔲 Add tests for all API routes
4. 🔲 Add tests for Zod schemas
5. 🔲 Add component tests for critical UI
6. 🔲 Add E2E tests (consider Playwright)
7. 🔲 Integrate tests into CI/CD pipeline
