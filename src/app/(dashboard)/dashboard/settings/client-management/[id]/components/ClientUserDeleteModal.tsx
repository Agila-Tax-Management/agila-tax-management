// src/app/(dashboard)/dashboard/settings/client-management/[id]/components/ClientUserDeleteModal.tsx
'use client';

import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import type { ClientUserMember } from '@/types/client-management.types';

interface ClientUserDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: ClientUserMember | null;
  clientName: string | null;
  loading: boolean;
}

export default function ClientUserDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  clientName,
  loading,
}: ClientUserDeleteModalProps): React.ReactNode {
  const displayName = user?.name ?? user?.email ?? 'this user';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove User" size="sm">
      <div className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-foreground">
              Are you sure you want to remove{' '}
              <span className="font-semibold">{displayName}</span> from{' '}
              <span className="font-semibold">{clientName ?? 'this client'}</span>?
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              If this is their only client assignment, the portal account will be permanently
              deleted.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Removing…
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Remove
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
