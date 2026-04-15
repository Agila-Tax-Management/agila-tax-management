/**
 * @jest-environment node
 */

// src/app/api/admin/users/__tests__/user-management.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

/**
 * User Management API Tests — Portal Role-Based Access
 * 
 * Tests the new portal role system (VIEWER, USER, ADMIN, SETTINGS)
 * replacing the old permission flags (canRead, canWrite, canEdit, canDelete).
 */

// Mock types
type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    appAccess: {
      role: string;
      app: { name: string };
    }[];
  } | null;
};

type MockApp = {
  id: string;
  name: string;
};

// Mock Prisma client
interface MockPrismaClient {
  user: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: jest.Mock<(args?: any) => Promise<MockUser[]>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findUnique: jest.Mock<(args?: any) => Promise<MockUser | null>>;
    create: jest.Mock;
    update: jest.Mock;
  };
  app: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: jest.Mock<(args?: any) => Promise<MockApp[]>>;
  };
  client: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findUnique: jest.Mock<(args?: any) => Promise<{ id: number } | null>>;
  };
  employee: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
  employeeAppAccess: {
    createMany: jest.Mock;
    deleteMany: jest.Mock;
  };
  employeeEmployment: {
    create: jest.Mock;
  };
  employeeGovernmentIds: {
    create: jest.Mock;
  };
  account: {
    create: jest.Mock;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: jest.Mock<(callback: (tx: any) => Promise<any>) => Promise<any>>;
}

const mockPrisma: MockPrismaClient = {
  user: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: jest.fn<(args?: any) => Promise<MockUser[]>>(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findUnique: jest.fn<(args?: any) => Promise<MockUser | null>>(),
    create: jest.fn(),
    update: jest.fn(),
  },
  app: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: jest.fn<(args?: any) => Promise<MockApp[]>>(),
  },
  client: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findUnique: jest.fn<(args?: any) => Promise<{ id: number } | null>>(() => 
      Promise.resolve({ id: 1 })
    ),
  },
  employee: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  employeeAppAccess: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  employeeEmployment: {
    create: jest.fn(),
  },
  employeeGovernmentIds: {
    create: jest.fn(),
  },
  account: {
    create: jest.fn(),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockPrisma)),
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

jest.mock('better-auth/crypto', () => ({
  hashPassword: jest.fn((pwd: string) => Promise.resolve(`hashed_${pwd}`)),
}));

import { GET, POST } from '../route';

describe('User Management API — Portal Roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return users with portal role instead of permission flags', async () => {
      const mockUsers: MockUser[] = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@agila.com',
          role: 'EMPLOYEE',
          active: true,
          emailVerified: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          employee: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            appAccess: [
              {
                role: 'USER',
                app: { name: 'SALES' },
              },
              {
                role: 'ADMIN',
                app: { name: 'COMPLIANCE' },
              },
            ],
          },
        },
      ];

      // Need to add missing employee fields for the actual API
      const mockUsersWithAllFields = mockUsers.map((u) => ({
        ...u,
        employee: u.employee ? {
          ...u.employee,
          middleName: null,
          employeeNo: 'EMP-00001',
          phone: '09171234567',
          birthDate: new Date('1990-01-01'),
          gender: 'Male',
          employments: [],
        } : null,
      }));

      mockPrisma.user.findMany.mockResolvedValue(mockUsersWithAllFields);

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].portalAccess).toEqual([
        { portal: 'SALES', role: 'USER' },
        { portal: 'COMPLIANCE', role: 'ADMIN' },
      ]);
    });

    it('should return empty portal access for users with no employee record', async () => {
      const mockUsers: MockUser[] = [
        {
          id: 'user-2',
          name: 'Admin User',
          email: 'admin@agila.com',
          role: 'SUPER_ADMIN',
          active: true,
          emailVerified: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          employee: null,
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].portalAccess).toEqual([]);
    });
  });

  describe('POST /api/admin/users — Create with Portal Roles', () => {
    it('should create user with VIEWER role for a portal', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 0 });
      mockPrisma.user.create.mockResolvedValue({ id: 'new-user-id' });
      mockPrisma.employee.create.mockResolvedValue({ id: 123 });
      mockPrisma.app.findMany.mockResolvedValue([
        { id: 'app-sales', name: 'SALES' },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Viewer',
          email: 'jane@agila.com',
          password: 'password123',
          role: 'EMPLOYEE',
          active: true,
          firstName: 'Jane',
          lastName: 'Viewer',
          phone: '09171234567',
          birthDate: '1990-01-01',
          gender: 'Female',
          portalAccess: [
            { portal: 'SALES', role: 'VIEWER' },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toHaveProperty('id');
      
      // Verify EmployeeAppAccess.createMany was called with role field
      expect(mockPrisma.employeeAppAccess.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            employeeId: 123,
            appId: 'app-sales',
            role: 'VIEWER',
          }),
        ]),
      });
    });

    it('should create user with multiple portals having different roles', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 0 });
      mockPrisma.user.create.mockResolvedValue({ id: 'new-user-id' });
      mockPrisma.employee.create.mockResolvedValue({ id: 124 });
      mockPrisma.app.findMany.mockResolvedValue([
        { id: 'app-sales', name: 'SALES' },
        { id: 'app-hr', name: 'HR' },
        { id: 'app-compliance', name: 'COMPLIANCE' },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Multi Portal User',
          email: 'multi@agila.com',
          password: 'password123',
          role: 'EMPLOYEE',
          active: true,
          firstName: 'Multi',
          lastName: 'User',
          phone: '09171234567',
          birthDate: '1990-01-01',
          gender: 'Male',
          portalAccess: [
            { portal: 'SALES', role: 'VIEWER' },
            { portal: 'HR', role: 'USER' },
            { portal: 'COMPLIANCE', role: 'ADMIN' },
          ],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockPrisma.employeeAppAccess.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ role: 'VIEWER' }),
          expect.objectContaining({ role: 'USER' }),
          expect.objectContaining({ role: 'ADMIN' }),
        ]),
      });
    });

    it('should validate portal role enum values', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Invalid Role User',
          email: 'invalid@agila.com',
          password: 'password123',
          role: 'EMPLOYEE',
          active: true,
          firstName: 'Invalid',
          lastName: 'User',
          phone: '09171234567',
          birthDate: '1990-01-01',
          gender: 'Male',
          portalAccess: [
            { portal: 'SALES', role: 'INVALID_ROLE' },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });
  });
});
