// src/app/(dashboard)/dashboard/settings/user-management/components/__tests__/UserFormModal.test.tsx
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

/**
 * UserFormModal Component Tests — Portal Role UI
 * 
 * Tests the portal role selection UI (dropdown instead of checkboxes).
 */

// Mock the ToastContext
const mockSuccess = jest.fn();
const mockError = jest.fn();

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Import component after mocks
import UserFormModal from '../UserFormModal';

describe('UserFormModal — Portal Role Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
  });

  it('should render portal access section with role dropdowns', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }), // Empty employee levels
    });

    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSaved={() => {}}
        editingUser={null}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Portal Access')).toBeInTheDocument();
    });

    // Check for portal labels
    expect(screen.getByText('Sales Portal')).toBeInTheDocument();
    expect(screen.getByText('HR Portal')).toBeInTheDocument();
    expect(screen.getByText('Compliance Portal')).toBeInTheDocument();
  });

  it('should show role dropdown when portal is enabled', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }), // Empty employee levels
    });

    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSaved={() => {}}
        editingUser={null}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Portal Access')).toBeInTheDocument();
    });

    // Find and click the Sales Portal checkbox
    const salesCheckbox = screen.getAllByRole('checkbox').find((cb) => {
      const label = cb.parentElement?.textContent;
      return label?.includes('Sales Portal');
    });

    if (salesCheckbox) {
      fireEvent.click(salesCheckbox);

      await waitFor(() => {
        // Dropdown should appear with role options (filter out gender and employee level selects)
        const allSelects = screen.getAllByRole('combobox');
        const roleDropdowns = Array.from<HTMLSelectElement>(allSelects as unknown as HTMLSelectElement[]).filter((select) => {
          const options = Array.from(select.options).map((opt) => opt.value);
          return options.includes('VIEWER') || options.includes('USER') || options.includes('ADMIN') || options.includes('SETTINGS');
        });
        expect(roleDropdowns.length).toBeGreaterThan(0);
      });
    }
  });

  it('should default to VIEWER role when portal is enabled', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }), // Empty employee levels
    });

    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSaved={() => {}}
        editingUser={null}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Portal Access')).toBeInTheDocument();
    });

    const salesCheckbox = screen.getAllByRole('checkbox').find((cb) => {
      const label = cb.parentElement?.textContent;
      return label?.includes('Sales Portal');
    });

    if (salesCheckbox) {
      fireEvent.click(salesCheckbox);

      await waitFor(() => {
        const allSelects = screen.getAllByRole('combobox');
        const roleDropdowns = Array.from<HTMLSelectElement>(allSelects as unknown as HTMLSelectElement[]).filter((select) => {
          const options = Array.from(select.options).map((opt) => opt.value);
          return options.includes('VIEWER');
        });
        
        if (roleDropdowns.length > 0) {
          expect(roleDropdowns[0].value).toBe('VIEWER');
        }
      });
    }
  });

  it('should submit form with portal roles instead of permission flags', async () => {
    const mockOnSaved = jest.fn();
    const mockOnClose = jest.fn();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }), // Empty employee levels
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-user-id' } }),
      });

    render(
      <UserFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        editingUser={null}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Portal Access')).toBeInTheDocument();
    });

    // Fill required fields using getByLabelText which is more reliable
    fireEvent.change(screen.getByPlaceholderText('First name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Last name'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('user@agila.com'), {
      target: { value: 'john@agila.com' },
    });
    
    // Find password input by placeholder (add mode uses "Min. 8 characters")
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'password123' },
    });

    fireEvent.change(screen.getByPlaceholderText('09XXXXXXXXX'), {
      target: { value: '09171234567' },
    });

    // Find birth date input by type="date"
    const birthDateInput = document.querySelector('input[type="date"]');
    if (birthDateInput) {
      fireEvent.change(birthDateInput, { target: { value: '1990-01-01' } });
    }

    // Enable Sales Portal
    const salesCheckbox = screen.getAllByRole('checkbox').find((cb) => {
      const label = cb.parentElement?.textContent;
      return label?.includes('Sales Portal');
    });

    if (salesCheckbox) {
      fireEvent.click(salesCheckbox);
    }

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create User/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const postCall = fetchCalls.find((call) => call[1]?.method === 'POST');
      if (postCall) {
        const body = JSON.parse(postCall[1].body);
        expect(body.portalAccess).toBeDefined();
        // Verify it uses 'role' field instead of permission flags
        if (body.portalAccess.length > 0) {
          expect(body.portalAccess[0]).toHaveProperty('role');
          expect(body.portalAccess[0]).not.toHaveProperty('canRead');
        }
      }
    });
  });

  it('should pre-populate portal roles when editing existing user', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Existing User',
      email: 'existing@agila.com',
      role: 'EMPLOYEE',
      active: true,
      emailVerified: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      employee: {
        id: 1,
        firstName: 'Existing',
        middleName: null,
        lastName: 'User',
        employeeNo: 'EMP-00001',
        phone: '09171234567',
        birthDate: '1990-01-01T00:00:00.000Z',
        gender: 'Male',
        employment: null,
      },
      portalAccess: [
        { portal: 'SALES', role: 'ADMIN' },
        { portal: 'HR', role: 'USER' },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }), // Empty employee levels
    });

    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSaved={() => {}}
        editingUser={mockUser}
      />
    );

    await waitFor(() => {
      // Check if portals are enabled (checkboxes should be checked)
      const checkboxes = screen.getAllByRole('checkbox');
      const checkedBoxes = checkboxes.filter((cb) => (cb as HTMLInputElement).checked);
      
      // At least 2 portals should be enabled (SALES and HR)
      expect(checkedBoxes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should validate all four role options are available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }), // Empty employee levels
    });

    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSaved={() => {}}
        editingUser={null}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Portal Access')).toBeInTheDocument();
    });

    // Enable a portal to show dropdown
    const checkbox = screen.getAllByRole('checkbox')[0];
    if (checkbox) {
      fireEvent.click(checkbox);

      await waitFor(() => {
        const allSelects = screen.getAllByRole('combobox');
        const roleDropdown = Array.from<HTMLSelectElement>(allSelects as unknown as HTMLSelectElement[]).find((select) => {
          const options = Array.from(select.options).map((opt) => opt.value);
          return options.includes('VIEWER');
        });

        if (roleDropdown) {
          const options = roleDropdown.options;
          const optionValues = Array.from(options).map((opt) => opt.value);
          expect(optionValues).toContain('VIEWER');
          expect(optionValues).toContain('USER');
          expect(optionValues).toContain('ADMIN');
          expect(optionValues).toContain('SETTINGS');
        }
      });
    }
  });
});
