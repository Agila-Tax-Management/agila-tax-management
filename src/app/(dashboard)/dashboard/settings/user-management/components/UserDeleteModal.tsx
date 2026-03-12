// src/app/(dashboard)/dashboard/settings/user-management/components/UserDeleteModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { UserRecord } from '@/lib/schemas/user-management';

/* ─── Props ───────────────────────────────────────────────────────── */

interface UserDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  user: UserRecord | null;
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserDeleteModal({
  isOpen,
  onClose,
  onDeleted,
  user,
}: UserDeleteModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  async function handleDelete(): Promise<void> {
    if (!user) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!res.ok) {
        toastError('Delete failed', json.error ?? 'Something went wrong');
        return;
      }

      success('User deactivated', `${user.name} has been deactivated.`);
      onDeleted();
      onClose();
    } catch {
      toastError('Network error', 'Could not reach the server. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete User" size="sm">
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to deactivate{' '}
          <span className="font-semibold text-foreground">{user.name}</span>?
          This will disable their account and revoke access.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
