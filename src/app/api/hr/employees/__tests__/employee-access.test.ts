/**
 * @jest-environment node
 */

// src/app/api/hr/employees/__tests__/employee-access.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

/**
 * Employee Access API Tests — Portal Role Updates
 * 
 * Tests upsert operations for portal access using the new role system.
 */

type MockAccess = {
  role: string;
  app: { name: string; label: string };
};

type MockApp = {
  id: string;
  name: string;
};

interface MockPrismaClient {
  employee: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findFirst: jest.Mock<(args?: any) => Promise<{ id: number } | null>>;
  };
  employeeAppAccess: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: jest.Mock<(args?: any) => Promise<MockAccess[]>>;
    upsert: jest.Mock;
  };
  app: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: jest.Mock<(args?: any) => Promise<MockApp[]>>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: jest.Mock<(operations: any[]) => Promise<any[]>>;
}

const mockPrisma: MockPrismaClient = {
  employee: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findFirst: jest.fn<(args?: any) => Promise<{ id: number } | null>>(),
  },
  employeeAppAccess: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: jest.fn<(args?: any) => Promise<MockAccess[]>>(),
    upsert: jest.fn(),
  },
  app: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: jest.fn<(args?: any) => Promise<MockApp[]>>(),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: jest.fn((operations: any[]) => Promise.all(operations)),
};

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('@/lib/session', () => ({
  getSessionWithAccess: jest.fn(() => ({
    user: { id: 'admin-user', role: 'SUPER_ADMIN' },
  })),
}));

jest.mock('@/lib/activity-log', () => ({
  logActivity: jest.fn(),
  getRequestMeta: jest.fn(() => ({})),
}));

import { GET, POST } from '../[id]/access/route';

describe('Employee Access API — Portal Roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/hr/employees/[id]/access', () => {
    it('should return portal access with role field', async () => {
      const mockAccess: MockAccess[] = [
        {
          role: 'USER',
          app: { name: 'SALES', label: 'Sales Portal' },
        },
        {
          role: 'ADMIN',
          app: { name: 'COMPLIANCE', label: 'Compliance Portal' },
        },
      ];

      mockPrisma.employeeAppAccess.findMany.mockResolvedValue(mockAccess);

      const request = new NextRequest('http://localhost:3000/api/hr/employees/1/access');
      const params = Promise.resolve({ id: '1' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toHaveProperty('role', 'USER');
      expect(data.data[1]).toHaveProperty('role', 'ADMIN');
    });
  });

  describe('POST /api/hr/employees/[id]/access — Upsert Portal Roles', () => {
    it('should upsert portal access using role field', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.app.findMany.mockResolvedValue([
        { id: 'app-sales', name: 'SALES' },
        { id: 'app-hr', name: 'HR' },
      ]);

      const request = new NextRequest('http://localhost:3000/api/hr/employees/1/access', {
        method: 'POST',
        body: JSON.stringify({
          entries: [
            { portal: 'SALES', role: 'USER' },
            { portal: 'HR', role: 'VIEWER' },
          ],
        }),
      });

      const params = Promise.resolve({ id: '1' });
      const response = await POST(request, { params });

      expect(response.status).toBe(200);
      expect(mockPrisma.employeeAppAccess.upsert).toHaveBeenCalledTimes(2);
      
      // Verify the upsert calls contain role field
      const upsertCalls = mockPrisma.employeeAppAccess.upsert.mock.calls;
      expect(upsertCalls).toEqual(
        expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({
              update: expect.objectContaining({ role: 'USER' }),
              create: expect.objectContaining({ role: 'USER' }),
            }),
          ]),
        ])
      );
    });

    it('should validate role enum values in upsert', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 1 });

      const request = new NextRequest('http://localhost:3000/api/hr/employees/1/access', {
        method: 'POST',
        body: JSON.stringify({
          entries: [
            { portal: 'SALES', role: 'INVALID_ROLE' },
          ],
        }),
      });

      const params = Promise.resolve({ id: '1' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it('should handle all four portal role levels', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.app.findMany.mockResolvedValue([
        { id: 'app-1', name: 'SALES' },
        { id: 'app-2', name: 'HR' },
        { id: 'app-3', name: 'COMPLIANCE' },
        { id: 'app-4', name: 'ACCOUNTING' },
      ]);

      const request = new NextRequest('http://localhost:3000/api/hr/employees/1/access', {
        method: 'POST',
        body: JSON.stringify({
          entries: [
            { portal: 'SALES', role: 'VIEWER' },
            { portal: 'HR', role: 'USER' },
            { portal: 'COMPLIANCE', role: 'ADMIN' },
            { portal: 'ACCOUNTING', role: 'SETTINGS' },
          ],
        }),
      });

      const params = Promise.resolve({ id: '1' });
      const response = await POST(request, { params });

      expect(response.status).toBe(200);
      expect(mockPrisma.employeeAppAccess.upsert).toHaveBeenCalledTimes(4);
    });
  });
});
