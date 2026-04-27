// src/app/(dashboard)/dashboard/settings/user-management/components/UserHardDeleteModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { UserRecord } from '@/lib/schemas/user-management';
import { AlertTriangle } from 'lucide-react';

/* ─── Props ───────────────────────────────────────────────────────── */

interface UserHardDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  user: UserRecord | null;
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserHardDeleteModal({
  isOpen,
  onClose,
  onDeleted,
  user,
}: UserHardDeleteModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  // Reset confirmation when modal closes
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setConfirmation('');
  }

  if (!user) return null;

  const confirmed = confirmation === 'DELETE';

  async function handleDelete(): Promise<void> {
    if (!user || !confirmed) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/purge`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!res.ok) {
        toastError('Delete failed', json.error ?? 'Something went wrong');
        return;
      }

      success('User permanently deleted', `${user.name} and all associated data have been removed.`);
      onDeleted();
      onClose();
    } catch {
      toastError('Network error', 'Could not reach the server. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Permanently Delete User" size="sm">
      <div className="p-6 space-y-5">
        {/* Warning banner */}
        <div className="flex gap-3 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900">
          <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 dark:text-red-300 space-y-1">
            <p className="font-semibold">This action is irreversible</p>
            <p>
              Permanently deletes <span className="font-semibold">{user.name}</span> and removes
              all their data — including portal access, employee record, lead comments, task
              messages, compliance notes, and audit history entries they authored.
            </p>
          </div>
        </div>

        {/* Confirmation input */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            disabled={deleting}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-800 text-white disabled:opacity-40"
            onClick={handleDelete}
            disabled={!confirmed || deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
