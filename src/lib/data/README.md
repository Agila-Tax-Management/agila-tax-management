# Data Fetching Layer

This directory contains shared data-fetching functions that use Next.js 16 caching directives.

## Purpose

- Centralize data-fetching logic that's reused across multiple components
- Apply consistent caching strategies using `'use cache'` directive
- Manage cache invalidation with `cacheTag()` and `updateTag()`

## Structure

```
data/
  reference/       # Long-lived reference data (services, departments, etc.)
  dashboards/      # Dashboard aggregation queries
  users/           # User-specific data fetching
  clients/         # Client-related queries
  ...              # Module-specific folders as needed
```

## Naming Convention

- Use descriptive function names: `getServices()`, `getDepartments()`, `getHRDashboard()`
- Export async functions with `'use cache'` directive
- Include cache tags for invalidation: `cacheTag('services-list')`

## Example

```typescript
// src/lib/data/reference/services.ts
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/db';

/**
 * Fetch all active services (cached for 1 day)
 */
export async function getServices() {
  'use cache'
  cacheLife('days')
  cacheTag('services-list')
  
  return prisma.service.findMany({
    where: { status: { not: 'ARCHIVED' } },
    orderBy: { name: 'asc' },
  });
}
```

## Cache Invalidation

When mutating data, invalidate related tags:

```typescript
// src/app/api/sales/services/route.ts
import { updateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const service = await prisma.service.create({ ... });
  
  updateTag('services-list'); // Invalidate cached services
  
  return NextResponse.json({ data: service });
}
```

## Guidelines

- Always document cache duration and tags in function JSDoc
- Use consistent tag naming: `[entity]-list`, `[entity]-detail-{id}`, `[module]-dashboard`
- Keep functions focused and single-purpose
- Test cache invalidation after mutations
