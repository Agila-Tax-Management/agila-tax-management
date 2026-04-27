// src/components/hr/management/DeleteEmployeeModal.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, UserX } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
    user: { email: string; active: boolean } | null;
  } | null;
  onDeleted: (employeeId: string) => void;
}

export function DeleteEmployeeModal({ isOpen, onClose, employee, onDeleted }: DeleteEmployeeModalProps): React.ReactNode {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!employee) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employees/${employee.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        showError('Delete failed', json.error ?? 'Failed to delete employee.');
        return;
      }
      const json = (await res.json()) as { data: { userDeactivated: boolean } };
      success(
        'Employee deleted',
        json.data.userDeactivated
          ? `${employee.fullName} has been deleted and their user account was deactivated.`
          : `${employee.fullName} has been removed from the system.`,
      );
      onDeleted(employee.id);
      onClose();
    } catch {
      showError('Delete failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!employee) return null;

  const hasUserAccount = !!employee.user;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Employee Record" size="sm">
      <div className="space-y-4 p-4">
        {/* Warning icon */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Delete <span className="text-red-600">{employee.fullName}</span>?
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{employee.employeeNo}</p>
          </div>
        </div>

        {/* Connected user account warning */}
        {hasUserAccount && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <UserX size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Connected user account detected</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This employee is linked to the user account{' '}
                <span className="font-mono font-semibold">{employee.user!.email}</span>.
                Deleting this record will also <strong>deactivate their login account</strong>.
              </p>
            </div>
          </div>
        )}

        {/* General warning */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            This action will <strong>permanently archive</strong> the employee record. It cannot be
            undone from this interface.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            onClick={() => void handleDelete()}
            disabled={loading}
          >
            <Trash2 size={14} />
            {loading ? 'Deleting…' : 'Delete Employee'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
