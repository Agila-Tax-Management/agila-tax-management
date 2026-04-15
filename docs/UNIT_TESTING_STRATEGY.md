# Unit Testing Strategy & Process

## 📋 Table of Contents

1. [Where to Create Tests](#where-to-create-tests)
2. [What to Test](#what-to-test)
3. [Testing Process Workflow](#testing-process-workflow)
4. [Test Types & Examples](#test-types--examples)
5. [Running Tests](#running-tests)
6. [Coverage Goals](#coverage-goals)

---

## Where to Create Tests

### Co-location Strategy

**Always co-locate tests with the code they test** using the `__tests__/` folder pattern:

```
src/
  lib/
    activity-log.ts              # Business logic
    __tests__/
      activity-log.test.ts       # ✅ Tests for activity-log.ts
    
  components/
    UI/
      Badge.tsx                  # Component
      __tests__/
        Badge.test.tsx           # ✅ Tests for Badge.tsx
    
  app/
    api/
      accounting/
        invoices/
          route.ts               # API route
          __tests__/
            route.test.ts        # ✅ Tests for route.ts
            sequential-code-generation.test.ts  # ✅ Tests for specific logic
```

### Naming Conventions

| Code File | Test File | Pattern |
|-----------|-----------|---------|
| `utils.ts` | `utils.test.ts` | Same name + `.test.ts` |
| `Button.tsx` | `Button.test.tsx` | Same name + `.test.tsx` |
| `route.ts` | `route.test.ts` | Same name + `.test.ts` |
| Special logic | `descriptive-name.test.ts` | Descriptive name (e.g., `sequential-code-generation.test.ts`) |

---

## What to Test

### ✅ High Priority (Must Test)

1. **Business Logic** (`src/lib/`)
   - Utility functions
   - Calculations (tax, payroll, contributions)
   - Data transformations
   - Sequential code generation
   
2. **API Routes** (`src/app/api/`)
   - CRUD operations
   - Request validation (Zod schemas)
   - Authorization checks
   - Error handling
   - **Prisma transactions** (atomicity)

3. **Critical Workflows**
   - Invoice generation
   - Payment processing
   - Payroll calculations
   - Government contributions

### ⚠️ Medium Priority

4. **React Components** (`src/components/`)
   - User interactions (clicks, form submissions)
   - Conditional rendering
   - Props validation
   - State changes

5. **Validation Schemas** (Zod)
   - Edge cases
   - Invalid inputs
   - Required fields

### 🔵 Low Priority

6. **UI Components** (simple presentational)
   - Basic rendering
   - Style variations
   
7. **Mocked Data**
   - Keep simple; focus on real API routes

---

## Testing Process Workflow

### Step-by-Step Process

#### 1. **Identify What to Test**

Ask yourself:
- Is this **business-critical**? (e.g., payroll calculation, invoice generation)
- Does it have **complex logic**? (e.g., conditional branching, loops, transactions)
- Could it **break easily**? (e.g., sequential code generation, edge cases)
- Is it **hard to test manually**? (e.g., year rollover, rare conditions)

**If yes to any → Write tests**

---

#### 2. **Create Test File**

```bash
# Example: Testing src/lib/payroll-calculator.ts

# Create test file
mkdir -p src/lib/__tests__
touch src/lib/__tests__/payroll-calculator.test.ts
```

---

#### 3. **Write Test Structure**

```typescript
// src/lib/__tests__/payroll-calculator.test.ts
import { describe, it, expect } from '@jest/globals';
import { calculateNetPay } from '../payroll-calculator';

describe('calculateNetPay', () => {
  it('should calculate net pay correctly for standard case', () => {
    // TODO: Write test
  });

  it('should handle overtime pay', () => {
    // TODO: Write test
  });

  it('should deduct SSS, PhilHealth, and PAGIBIG', () => {
    // TODO: Write test
  });
});
```

---

#### 4. **Write Tests (AAA Pattern)**

**AAA = Arrange, Act, Assert**

```typescript
it('should calculate net pay correctly for standard case', () => {
  // ARRANGE - Set up test data
  const grossPay = 20000;
  const deductions = {
    sss: 900,
    philHealth: 400,
    pagibig: 200,
  };

  // ACT - Execute the function
  const result = calculateNetPay(grossPay, deductions);

  // ASSERT - Verify the result
  expect(result).toBe(18500); // 20000 - 900 - 400 - 200
});
```

---

#### 5. **Run Tests**

```bash
# Run all tests
npm test

# Run specific test file
npm test -- payroll-calculator.test.ts

# Run in watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage
npm run test:coverage
```

---

#### 6. **Check Coverage**

```bash
npm run test:coverage
```

Look for:
- **Green**: Well-tested (>80% coverage)
- **Yellow**: Needs improvement (50-80%)
- **Red**: Poorly tested (<50%)

**Goal**: Maintain **50%+ overall coverage** (configured in `jest.config.js`)

---

## Test Types & Examples

### 1. Business Logic Tests (Pure Functions)

**File**: `src/lib/government-contributions.ts`

```typescript
// src/lib/__tests__/government-contributions.test.ts
import { describe, it, expect } from '@jest/globals';
import { calculateSSS, calculatePhilHealth, calculatePagibig } from '../government-contributions';

describe('Government Contributions', () => {
  describe('calculateSSS', () => {
    it('should calculate SSS for salary 20,000', () => {
      const result = calculateSSS(20000);
      expect(result.employeeShare).toBe(900);
      expect(result.employerShare).toBe(2025);
    });

    it('should use ceiling for salaries above 30,000', () => {
      const result = calculateSSS(50000);
      expect(result.employeeShare).toBe(1350); // Max contribution
    });

    it('should return 0 for salary below minimum', () => {
      const result = calculateSSS(2000);
      expect(result.employeeShare).toBe(0);
    });
  });

  describe('calculatePhilHealth', () => {
    it('should calculate PhilHealth at 5% rate', () => {
      const result = calculatePhilHealth(20000);
      expect(result.employeeShare).toBe(500); // 5% of 20000 / 2
    });
  });

  describe('calculatePagibig', () => {
    it('should use 2% for salaries ≤ 5,000', () => {
      const result = calculatePagibig(5000);
      expect(result.employeeShare).toBe(100); // 2% of 5000
    });

    it('should use 100 + 3% for salaries > 5,000', () => {
      const result = calculatePagibig(10000);
      expect(result.employeeShare).toBe(250); // 100 + (3% of 5000)
    });
  });
});
```

**When to use**:
- ✅ Pure functions (same input → same output)
- ✅ Calculations (tax, payroll, discounts)
- ✅ Data transformations
- ✅ Utility functions

---

### 2. API Route Tests (Mocked Database)

**File**: `src/app/api/clients/route.ts`

```typescript
// src/app/api/clients/__tests__/route.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    client: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(() => ({
        session: { user: { id: 'user-123', role: 'ADMIN' } },
      })),
    },
  },
}));

import prisma from '@/lib/db';

describe('GET /api/clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of clients', async () => {
    // ARRANGE
    (prisma.client.findMany as jest.Mock).mockResolvedValue([
      { id: '1', companyName: 'Acme Corp' },
      { id: '2', companyName: 'Widget Inc' },
    ]);

    const request = new NextRequest('http://localhost:3000/api/clients');

    // ACT
    const response = await GET(request);
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].companyName).toBe('Acme Corp');
  });

  it('should return 401 if not authenticated', async () => {
    // ARRANGE - Mock no session
    const { auth } = await import('@/lib/auth');
    (auth.api.getSession as jest.Mock).mockResolvedValue({ session: null });

    const request = new NextRequest('http://localhost:3000/api/clients');

    // ACT
    const response = await GET(request);

    // ASSERT
    expect(response.status).toBe(401);
  });
});

describe('POST /api/clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new client', async () => {
    // ARRANGE
    const newClient = {
      companyName: 'New Client Corp',
      email: 'contact@newclient.com',
      phone: '09171234567',
    };

    (prisma.client.create as jest.Mock).mockResolvedValue({
      id: '123',
      ...newClient,
    });

    const request = new NextRequest('http://localhost:3000/api/clients', {
      method: 'POST',
      body: JSON.stringify(newClient),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(201);
    expect(data.data.companyName).toBe('New Client Corp');
    expect(prisma.client.create).toHaveBeenCalledWith({
      data: expect.objectContaining(newClient),
    });
  });

  it('should return 400 for invalid input', async () => {
    // ARRANGE - Missing required field
    const invalidClient = {
      email: 'invalid@example.com',
      // Missing companyName
    };

    const request = new NextRequest('http://localhost:3000/api/clients', {
      method: 'POST',
      body: JSON.stringify(invalidClient),
    });

    // ACT
    const response = await POST(request);

    // ASSERT
    expect(response.status).toBe(400);
  });
});
```

**When to use**:
- ✅ API route handlers (GET, POST, PUT, DELETE)
- ✅ Request validation
- ✅ Authorization checks
- ✅ Database operations (with mocked Prisma)

---

### 3. React Component Tests

**File**: `src/components/UI/Modal.tsx`

```typescript
// src/components/UI/__tests__/Modal.test.tsx
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const handleClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
```

**When to use**:
- ✅ User interactions (clicks, form submissions)
- ✅ Conditional rendering
- ✅ State changes
- ✅ Event handlers

---

### 4. Prisma Transaction Tests (Critical)

**File**: Already exists at `src/app/api/accounting/invoices/__tests__/sequential-code-generation.test.ts`

**Key Points**:
- ✅ Test that `$transaction` is called
- ✅ Test sequential code generation (INV-YYYY-XXXX, PAY-YYYY-XXXX)
- ✅ Test year rollover
- ✅ Test concurrent request handling (duplicate prevention)

---

### 5. Zod Schema Validation Tests

**File**: `src/lib/schemas/client.ts`

```typescript
// src/lib/schemas/__tests__/client.test.ts
import { describe, it, expect } from '@jest/globals';
import { createClientSchema } from '../client';

describe('createClientSchema', () => {
  it('should validate correct client data', () => {
    const validData = {
      companyName: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '09171234567',
    };

    const result = createClientSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty company name', () => {
    const invalidData = {
      companyName: '',
      email: 'contact@acme.com',
    };

    const result = createClientSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('required');
    }
  });

  it('should reject invalid email', () => {
    const invalidData = {
      companyName: 'Acme Corp',
      email: 'not-an-email',
    };

    const result = createClientSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('email');
    }
  });

  it('should accept optional phone number', () => {
    const dataWithoutPhone = {
      companyName: 'Acme Corp',
      email: 'contact@acme.com',
    };

    const result = createClientSchema.safeParse(dataWithoutPhone);
    expect(result.success).toBe(true);
  });
});
```

**When to use**:
- ✅ Form validation schemas
- ✅ API request/response schemas
- ✅ Edge cases (empty strings, invalid formats, optional fields)

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- activity-log.test.ts

# Run tests matching a pattern
npm test -- invoices

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Update snapshots (if using snapshot testing)
npm test -- -u
```

### Watch Mode Workflow

```bash
# Start watch mode
npm run test:watch

# In watch mode, you can:
# - Press 'a' to run all tests
# - Press 'f' to run only failed tests
# - Press 'p' to filter by filename pattern
# - Press 'q' to quit
```

---

## Coverage Goals

### Current Configuration (jest.config.js)

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

### Target Coverage by Area

| Area | Target | Priority |
|------|--------|----------|
| **Business Logic** (`src/lib/`) | **80%+** | High |
| **API Routes** (`src/app/api/`) | **70%+** | High |
| **Components** (`src/components/`) | **60%+** | Medium |
| **Utilities** (`src/lib/`) | **90%+** | High |
| **Overall** | **50%+** | Minimum |

### Coverage Report

After running `npm run test:coverage`, open `coverage/lcov-report/index.html` in a browser to see:
- Overall coverage percentage
- Coverage by file
- Uncovered lines highlighted

---

## Best Practices

### ✅ DO

1. **Test behavior, not implementation**
   - ✅ Test what the function returns
   - ❌ Don't test internal variables

2. **Write descriptive test names**
   - ✅ `it('should generate INV-2026-0001 for first invoice')`
   - ❌ `it('works')`

3. **One assertion concept per test**
   - ✅ Test one thing at a time
   - ❌ Don't test multiple unrelated things

4. **Use AAA pattern**
   - Arrange → Act → Assert

5. **Mock external dependencies**
   - ✅ Mock Prisma, BetterAuth, Cloudinary
   - ❌ Don't make real API calls or database queries

6. **Test edge cases**
   - Empty inputs
   - Null/undefined
   - Very large numbers
   - Year rollover
   - Concurrent requests

### ❌ DON'T

1. **Don't test external libraries**
   - ❌ Don't test Prisma, Next.js, React
   - ✅ Test your code that uses them

2. **Don't test UI styling**
   - ❌ Don't test CSS classes
   - ✅ Test behavior and rendering

3. **Don't test mocked data**
   - ❌ Don't test that mocks return what you set
   - ✅ Test your code's logic with mocked inputs

---

## Quick Reference

### Test File Template

```typescript
// src/lib/__tests__/my-function.test.ts
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '../my-function';

describe('myFunction', () => {
  it('should handle normal case', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    const result = myFunction('');
    expect(result).toBe('default');
  });
});
```

### Common Matchers

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality (objects)

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThanOrEqual(100);
expect(value).toBeCloseTo(0.3, 5); // For floats

// Strings
expect(value).toMatch(/pattern/);
expect(value).toContain('substring');

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveBeenCalledWith(arg1, arg2);
```

---

## Next Steps

1. **Start with critical business logic**:
   - `src/lib/government-contributions.ts`
   - `src/lib/dole-overtime.ts`
   - Payroll calculations

2. **Add API route tests**:
   - `src/app/api/clients/route.ts`
   - `src/app/api/employees/route.ts`
   - Invoice and payment routes

3. **Add component tests**:
   - `src/components/UI/Modal.tsx`
   - `src/components/UI/Badge.tsx`
   - Form components

4. **Expand coverage gradually**:
   - Run `npm run test:coverage` regularly
   - Focus on untested areas
   - Aim for 50%+ overall, 80%+ for critical paths

---

**Remember**: Tests are **documentation** and **safety nets**. Write them as you would explain the code to a teammate.
