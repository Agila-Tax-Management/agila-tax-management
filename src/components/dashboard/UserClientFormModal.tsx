'use client';

import React, { useState } from 'react';
import { Check, Eye, EyeOff, Mail, Search, User } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Badge } from '@/components/UI/Badge';
import { useToast } from '@/context/ToastContext';
import type {
  ClientOption,
  ClientUserFormValues,
  ClientUserRecord,
} from '@/types/client-user-management.types';
import { STATUS_UI_MAP } from '@/types/client-user-management.types';

interface UserClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ClientUserFormValues) => Promise<void>;
  editingUser?: ClientUserRecord | null;
  clients: ClientOption[];
}

function getInitialForm(editingUser?: ClientUserRecord | null): ClientUserFormValues {
  return {
    name: editingUser?.name ?? '',
    email: editingUser?.email ?? '',
    accountStatus: editingUser ? STATUS_UI_MAP[editingUser.status] : 'Active',
    assignedClientIds: editingUser?.assignments.map((a) => a.clientId) ?? [],
    password: '',
  };
}

export default function UserClientFormModal({
  isOpen,
  onClose,
  onSave,
  editingUser,
  clients,
}: UserClientFormModalProps): React.ReactNode {
  const { error: toastError } = useToast();
  const syncKey = `${isOpen}-${editingUser?.id ?? 'new'}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  const [form, setForm] = useState<ClientUserFormValues>(getInitialForm(editingUser));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [clientQuery, setClientQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setForm(getInitialForm(editingUser));
    setFieldErrors({});
    setClientQuery('');
    setShowPassword(false);
    setSaving(false);
  }

  function toggleClient(clientId: number): void {
    setForm((prev) => ({
      ...prev,
      assignedClientIds: prev.assignedClientIds.includes(clientId)
        ? prev.assignedClientIds.filter((id) => id !== clientId)
        : [...prev.assignedClientIds, clientId],
    }));
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(form.email.trim())) {
        nextErrors.email = 'Enter a valid email address.';
      }
    }

    if (!editingUser) {
      if (!form.password || form.password.length === 0) {
        nextErrors.password = 'Password is required.';
      } else if (form.password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters.';
      }
    } else if (form.password && form.password.length > 0 && form.password.length < 8) {
      nextErrors.password = 'New password must be at least 8 characters.';
    }

    if (form.assignedClientIds.length === 0) {
      nextErrors.assignedClientIds = 'Assign at least one active client.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toastError('Failed to save user client', 'Complete the required fields before saving.');
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password?.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const filteredClients = clientQuery
    ? clients.filter(
        (c) =>
          c.businessName?.toLowerCase().includes(clientQuery.toLowerCase()) ||
          c.companyCode?.toLowerCase().includes(clientQuery.toLowerCase()) ||
          c.clientNo?.toLowerCase().includes(clientQuery.toLowerCase())
      )
    : clients;

  const selectedClients = clients.filter((client) => form.assignedClientIds.includes(client.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? 'Edit User Client' : 'Add User Client'}
      size="2xl"
    >
      <form onSubmit={submitForm} className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Full Name</label>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="External user full name"
                className="pl-9"
              />
            </div>
            {fieldErrors.name ? (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Email Address</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="name@client.com"
                className="pl-9"
              />
            </div>
            {fieldErrors.email ? (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {editingUser ? 'New Password' : 'Password'}
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={form.password ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder={editingUser ? 'Leave blank to keep current password' : 'Min. 8 characters'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Account Status</label>
          <select
            value={form.accountStatus}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                accountStatus: event.target.value as ClientUserFormValues['accountStatus'],
              }))
            }
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground">Assigned Clients</label>
              <p className="mt-1 text-xs text-muted-foreground">
                Only active clients from the client list are available for assignment.
              </p>
            </div>
            <Badge variant="info">{clients.length} active clients</Badge>
          </div>

          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={clientQuery}
              onChange={(event) => setClientQuery(event.target.value)}
              placeholder="Search clients by name or code..."
              className="pl-8 text-sm"
            />
          </div>

          <div className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 md:grid-cols-2">
            {filteredClients.length === 0 ? (
              <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">No clients match your search.</p>
            ) : null}
            {filteredClients.map((client) => {
              const checked = form.assignedClientIds.includes(client.id);

              return (
                <button
                  type="button"
                  key={client.id}
                  onClick={() => toggleClient(client.id)}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    checked
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-border bg-card text-foreground hover:bg-muted/40'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      checked
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-border bg-background text-transparent'
                    }`}
                  >
                    <Check size={12} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium leading-5">{client.businessName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {client.clientNo ? `${client.clientNo} • ` : ''}{client.companyCode}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{client.portalName}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {fieldErrors.assignedClientIds ? (
            <p className="text-xs text-rose-600">{fieldErrors.assignedClientIds}</p>
          ) : null}

          <div className="rounded-xl border border-dashed border-border bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected Clients</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedClients.length > 0 ? (
                selectedClients.map((client) => (
                  <Badge key={client.id} variant="success" className="px-2 py-1 text-[11px]">
                    {client.businessName}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No clients selected yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User Client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}