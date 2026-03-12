// src/app/(dashboard)/dashboard/settings/user-management/components/UserReactivateModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { UserRecord } from '@/lib/schemas/user-management';

/* ─── Props ───────────────────────────────────────────────────────── */

interface UserReactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReactivated: () => void;
  user: UserRecord | null;
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserReactivateModal({
  isOpen,
  onClose,
  onReactivated,
  user,
}: UserReactivateModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  async function handleReactivate(): Promise<void> {
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/reactivate`, {
        method: 'PATCH',
      });

      const json = await res.json();

      if (!res.ok) {
        toastError('Reactivation failed', json.error ?? 'Something went wrong');
        return;
      }

      success('User reactivated', `${user.name} has been reactivated.`);
      onReactivated();
      onClose();
    } catch {
      toastError('Network error', 'Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reactivate User" size="sm">
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to reactivate{' '}
          <span className="font-semibold text-foreground">{user.name}</span>?
          This will restore their account access.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleReactivate}
            disabled={loading}
          >
            {loading ? 'Reactivating...' : 'Reactivate'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
