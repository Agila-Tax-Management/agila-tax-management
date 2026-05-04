// src/app/(dashboard)/dashboard/settings/api-keys/components/ApiKeyDeleteModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { Trash2 } from 'lucide-react';
import type { ApiKeyRecord } from './ApiKeyManagement';

interface Props {
  apiKey: ApiKeyRecord;
  onClose: () => void;
  onDeleted: () => void;
}

export default function ApiKeyDeleteModal({ apiKey, onClose, onDeleted }: Props): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/settings/api-keys/${apiKey.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to delete key');
      }
      success('Key deleted', `"${apiKey.name}" has been permanently removed.`);
      onDeleted();
    } catch (err) {
      toastError('Delete failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Delete API Key" size="sm">
      <div className="space-y-4 y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-100 text-red-600">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-foreground">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold">{apiKey.name}</span>? This cannot be undone.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Owner</span>
            <span className="text-foreground">{apiKey.clientUser?.email ?? 'System'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prefix</span>
            <code className="font-mono text-xs text-foreground">{apiKey.keyPrefix}…</code>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          If this key is still in use by the portal, it will stop working immediately.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => void handleDelete()} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Key'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
