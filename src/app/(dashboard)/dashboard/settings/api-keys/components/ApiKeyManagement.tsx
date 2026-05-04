// src/app/(dashboard)/dashboard/settings/api-keys/components/ApiKeyManagement.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import {
  KeyRound,
  Plus,
  Trash2,
  ShieldOff,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import ApiKeyGenerateModal from './ApiKeyGenerateModal';
import ApiKeyDeleteModal from './ApiKeyDeleteModal';

/* ─── Types ────────────────────────────────────────────────────────── */

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  enabled: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  clientUser: { id: string; name: string | null; email: string } | null;
}

type KeyStatus = 'active' | 'revoked' | 'expired';

function getStatus(key: ApiKeyRecord): KeyStatus {
  if (key.revokedAt) return 'revoked';
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'expired';
  return 'active';
}

const STATUS_VARIANT: Record<KeyStatus, 'success' | 'danger' | 'neutral'> = {
  active: 'success',
  revoked: 'danger',
  expired: 'neutral',
};

const STATUS_LABEL: Record<KeyStatus, string> = {
  active: 'Active',
  revoked: 'Revoked',
  expired: 'Expired',
};

/* ─── Component ─────────────────────────────────────────────────────── */

export default function ApiKeyManagement(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyRecord | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRecord | null>(null);
  const [revoking, setRevoking] = useState(false);

  /* ─── Fetch ──────────────────────────────────────────────────── */

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/api-keys');
      if (!res.ok) throw new Error('Failed to load API keys');
      const json = await res.json() as { data: ApiKeyRecord[] };
      setKeys(json.data);
    } catch {
      toastError('Failed to load', 'Could not fetch API keys. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  /* ─── Copy prefix ────────────────────────────────────────────── */

  const handleCopy = (key: ApiKeyRecord) => {
    void navigator.clipboard.writeText(key.keyPrefix).then(() => {
      setCopiedId(key.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  /* ─── Revoke ─────────────────────────────────────────────────── */

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/settings/api-keys/${revokeTarget.id}`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to revoke');
      }
      success('Key revoked', `"${revokeTarget.name}" has been revoked.`);
      setRevokeTarget(null);
      void fetchKeys();
    } catch (err) {
      toastError('Revoke failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setRevoking(false);
    }
  };

  /* ─── Format helpers ─────────────────────────────────────────── */

  const fmt = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—';

  const fmtDateTime = (date: string | null) =>
    date
      ? new Date(date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Never';

  /* ─── Render ─────────────────────────────────────────────────── */

  return (
    <>
      <div className="space-y-4 y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600/10 text-violet-600">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
              <p className="text-sm text-muted-foreground">
                Manage server-to-server keys for the external client portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="px-2 py-1.5" onClick={() => void fetchKeys()} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button className="px-3 py-1.5 text-sm" onClick={() => setGenerateOpen(true)}>
              <Plus size={15} className="mr-1" />
              Generate Key
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Prefix</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Used</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : keys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No API keys yet. Generate one to get started.
                    </td>
                  </tr>
                ) : (
                  keys.map((key) => {
                    const status = getStatus(key);
                    const isActive = status === 'active';
                    return (
                      <tr key={key.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{key.name}</td>
                        <td className="px-4 py-3">
                          {key.clientUser ? (
                            <>
                              <div className="text-foreground">{key.clientUser.name ?? '—'}</div>
                              <div className="text-xs text-muted-foreground">{key.clientUser.email}</div>
                            </>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                              System
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">
                            {key.keyPrefix}…
                          </code>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(key.lastUsedAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(key.expiresAt)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCopy(key)}
                              title="Copy prefix"
                              className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              {copiedId === key.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                            {isActive && (
                              <button
                                onClick={() => setRevokeTarget(key)}
                                title="Revoke key"
                                className="rounded p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <ShieldOff size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(key)}
                              title="Delete key"
                              className="rounded p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Generate Modal */}
      <ApiKeyGenerateModal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onCreated={() => { void fetchKeys(); }}
      />

      {/* Delete Modal */}
      {deleteTarget && (
        <ApiKeyDeleteModal
          apiKey={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); void fetchKeys(); }}
        />
      )}

      {/* Revoke confirmation (inline, no separate modal) */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <ShieldOff size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Revoke API Key</h3>
                <p className="text-sm text-muted-foreground">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-foreground">
              Revoking <span className="font-medium">{revokeTarget.name}</span> will immediately
              invalidate it. The portal will stop working until a new key is generated.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRevokeTarget(null)} disabled={revoking}>
                Cancel
              </Button>
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => void handleRevoke()} disabled={revoking}>
                {revoking ? 'Revoking...' : 'Revoke Key'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
