// src/app/(dashboard)/dashboard/settings/api-keys/components/ApiKeyGenerateModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import { KeyRound, Copy, Check, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = 'form' | 'reveal';

interface GeneratedKey {
  id: string;
  name: string;
  keyPrefix: string;
  plaintext: string;
}

export default function ApiKeyGenerateModal({ isOpen, onClose, onCreated }: Props): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generated, setGenerated] = useState<GeneratedKey | null>(null);
  const [copied, setCopied] = useState(false);

  /* ─── Reset when modal closes ───────────────────────────────── */

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setStep('form');
      setName('');
      setGenerated(null);
      setCopied(false);
      setSubmitting(false);
    }
  }

  /* ─── Generate key ──────────────────────────────────────────── */

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to generate key');
      }

      const json = await res.json() as { data: GeneratedKey };
      setGenerated(json.data);
      setStep('reveal');
      success('Key generated', 'Copy the key now — it will not be shown again.');
      onCreated();
    } catch (err) {
      toastError('Generation failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!generated) return;
    void navigator.clipboard.writeText(generated.plaintext).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    if (step === 'reveal' && !copied) {
      // Warn user if they haven't copied yet
      const confirmed = window.confirm(
        'Have you copied the API key? It will not be shown again after closing.'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'form' ? 'Generate API Key' : 'Your New API Key'}
      size="md"
    >
      {step === 'form' ? (
        <form onSubmit={(e) => void handleGenerate(e)} className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">
            The generated key will be used by the external client portal to authenticate
            server-to-server requests to <code className="text-xs bg-muted px-1 rounded">/api/v1/</code>.
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Key Name</label>
            <Input
              placeholder="e.g. Client Portal Production"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              A label to identify this key in the table.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              <KeyRound size={14} className="mr-1" />
              {submitting ? 'Generating...' : 'Generate Key'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Copy this key now.</span> For security reasons, it
              will not be displayed again after you close this dialog.
            </p>
          </div>

          {/* Key display */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">API Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm font-mono text-foreground break-all select-all">
                {generated?.plaintext}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-border bg-background p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Store this in your portal&apos;s Vercel environment as{' '}
              <code className="bg-muted px-1 rounded">ATMS_API_KEY</code>.
            </p>
          </div>

          {/* Key details */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{generated?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prefix</span>
              <code className="font-mono text-xs text-foreground">{generated?.keyPrefix}…</code>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
