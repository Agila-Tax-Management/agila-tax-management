// src/app/(dashboard)/dashboard/petty-cash/components/RequestFundModal.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { authClient } from '@/lib/auth-client';
import type { ModalMode, PettyCashRecord, PettyCashItemCategory } from './PettyCash';
import type { ClientOption } from '@/types/accounting.types';

// ── Local types ───────────────────────────────────────────────────────────────

interface ClientSearchOption {
  id: number;
  label: string;
  clientNo: string | null;
}

interface ItemRow {
  _key: string;
  category: PettyCashItemCategory;
  description: string;
  amount: number;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RequestFundModalProps {
  isOpen: boolean;
  mode: ModalMode;
  record: PettyCashRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RequestFundModal({
  isOpen,
  mode,
  record,
  onClose,
  onSuccess,
}: RequestFundModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const { data: sessionData } = authClient.useSession();

  // ── State (lazy initializers — key prop handles resets on reopen) ────────────
  const [selectedClient, setSelectedClient] = useState<ClientSearchOption | null>(() =>
    (mode === 'view' || mode === 'edit') && record
      ? { id: record.clientId, label: record.client.businessName, clientNo: record.client.clientNo }
      : null,
  );
  const [clientSearch, setClientSearch] = useState<string>(() =>
    (mode === 'view' || mode === 'edit') && record ? record.client.businessName : '',
  );
  const [clientOptions, setClientOptions] = useState<ClientSearchOption[]>([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isSearchingClients, setIsSearchingClients] = useState(false);

  // Fund balance: for create mode it's fetched from API; for view/edit use snapshot
  const [clientFundBalance, setClientFundBalance] = useState<number | null>(() =>
    (mode === 'view' || mode === 'edit') && record ? record.clientFundBalanceSnapshot : null,
  );
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);

  const [purpose, setPurpose] = useState<string>(() =>
    (mode === 'view' || mode === 'edit') && record ? record.purpose : '',
  );

  const [items, setItems] = useState<ItemRow[]>(() =>
    (mode === 'view' || mode === 'edit') && record
      ? record.items.map((it) => ({
          _key: crypto.randomUUID(),
          category: it.category,
          description: it.description,
          amount: it.amount,
        }))
      : [{ _key: crypto.randomUUID(), category: 'EMPLOYEE_EXPENSE' as PettyCashItemCategory, description: '', amount: 0 }],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce timer ref for client search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Outside-click ref for client dropdown
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // ── Outside click to close dropdown ─────────────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(e.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!isOpen) return null;

  const isView = mode === 'view';
  const isCreate = mode === 'create';

  // ── Derived values ───────────────────────────────────────────────────────────
  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const clientFundItems = items.filter((it) => it.category === 'CLIENT_FUND');
  const clientFundTotal = clientFundItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const hasClientFundItems = clientFundItems.length > 0;
  const balanceAfter = (clientFundBalance ?? 0) - clientFundTotal;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleClientSearchChange = (value: string) => {
    setClientSearch(value);
    setIsClientDropdownOpen(true);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!value.trim()) {
      setClientOptions([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsSearchingClients(true);
      try {
        const res = await fetch(
          `/api/accounting/invoices/clients?search=${encodeURIComponent(value)}`,
        );
        if (res.ok) {
          const d = await res.json();
          const opts: ClientSearchOption[] = ((d.data as ClientOption[]) ?? [])
            .filter((o) => o.type === 'client')
            .map((o) => ({ id: o.id, label: o.businessName ?? o.fullName, clientNo: null }));
          setClientOptions(opts);
        }
      } finally {
        setIsSearchingClients(false);
      }
    }, 300);
  };

  const selectClient = async (opt: ClientSearchOption) => {
    setSelectedClient(opt);
    setClientSearch(opt.label);
    setIsClientDropdownOpen(false);
    setClientOptions([]);

    // Fetch live balance for create/edit mode
    if (!isView) {
      setIsFetchingBalance(true);
      try {
        const res = await fetch(`/api/accounting/client-funds/${opt.id}`);
        if (res.ok) {
          const d = await res.json();
          setClientFundBalance((d.data as { currentBalance: number }).currentBalance ?? 0);
        }
      } finally {
        setIsFetchingBalance(false);
      }
    }
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { _key: crypto.randomUUID(), category: 'EMPLOYEE_EXPENSE', description: '', amount: 0 },
    ]);
  };

  const removeRow = (key: string) => {
    setItems((prev) => prev.filter((it) => it._key !== key));
  };

  const updateRow = (key: string, field: keyof Omit<ItemRow, '_key'>, value: string | number) => {
    setItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, [field]: value } : it)),
    );
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      toastError('Validation', 'Please select a client.');
      return;
    }
    if (!purpose.trim()) {
      toastError('Validation', 'Please enter a purpose.');
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      toastError('Validation', 'All items must have a description.');
      return;
    }
    if (items.some((it) => Number(it.amount) <= 0)) {
      toastError('Validation', 'All item amounts must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = mode === 'edit' && record;
      const endpoint = isEdit
        ? `/api/accounting/petty-cash/${record.id}`
        : '/api/accounting/petty-cash';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          purpose: purpose.trim(),
          items: items.map(({ _key: _k, ...it }) => it),
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        toastError('Failed', (d as { error?: string }).error ?? 'An error occurred.');
        return;
      }

      success(
        isEdit ? 'Updated' : 'Submitted',
        isEdit
          ? 'Petty cash request has been updated.'
          : 'Your petty cash request has been submitted for approval.',
      );
      onSuccess();
    } catch {
      toastError('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-4">

            {/* Left: title + meta */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {isCreate ? 'Request Fund' : mode === 'edit' ? 'Edit Request' : 'Petty Cash Request'}
                </h2>
                {record && (
                  <span className="text-muted-foreground font-normal text-sm">{record.pcfNo}</span>
                )}
              </div>

              {/* Client selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground shrink-0">Client:</span>
                {isView ? (
                  <span className="text-sm text-foreground">{record?.client.businessName}</span>
                ) : (
                  <div className="relative flex-1 max-w-xs" ref={clientDropdownRef}>
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => handleClientSearchChange(e.target.value)}
                        onFocus={() => clientSearch && setIsClientDropdownOpen(true)}
                        placeholder="Search client..."
                        readOnly={mode === 'edit'}
                        className="w-full pl-8 pr-8 py-1.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition read-only:opacity-60 read-only:cursor-default"
                      />
                      {isSearchingClients && (
                        <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    {isClientDropdownOpen && clientOptions.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        {clientOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => void selectClient(opt)}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition"
                          >
                            <span className="font-medium">{opt.label}</span>
                            {opt.clientNo && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                #{opt.clientNo}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground shrink-0">Purpose:</span>
                {isView ? (
                  <span className="text-sm text-foreground">{record?.purpose}</span>
                ) : (
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Office supplies for Q2"
                    className="flex-1 max-w-xs px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                )}
              </div>

              {/* Requested by */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground shrink-0">Requested by:</span>
                <span className="text-sm text-foreground">
                  {isView ? record?.requestedBy.name : (sessionData?.user?.name ?? '—')}
                </span>
              </div>
            </div>

            {/* Right: close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition mt-0.5 shrink-0"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Items table ── */}
        <div className="px-6 py-5 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground w-[26%]">Category</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground w-[22%]">Amount</th>
                  {!isView && <th className="w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item._key} className="bg-card">
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="text-foreground">
                          {item.category === 'EMPLOYEE_EXPENSE' ? 'Employee Expense' : 'Client Fund'}
                        </span>
                      ) : (
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateRow(item._key, 'category', e.target.value)
                          }
                          className="w-full px-2 py-1 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                        >
                          <option value="EMPLOYEE_EXPENSE">Employee Expense</option>
                          <option value="CLIENT_FUND">Client Fund</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="text-foreground">{item.description}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateRow(item._key, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-2 py-1 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="block text-right text-foreground">
                          ₱{Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          value={item.amount || ''}
                          onChange={(e) =>
                            updateRow(item._key, 'amount', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="w-full px-2 py-1 rounded-lg border border-border bg-background text-foreground text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                        />
                      )}
                    </td>
                    {!isView && (
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeRow(item._key)}
                          disabled={items.length === 1}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Total row */}
                <tr className="bg-muted/40 border-t-2 border-border">
                  <td
                    colSpan={isView ? 2 : 3}
                    className="px-4 py-3 text-right font-bold text-foreground"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  {!isView && <td />}
                </tr>

                {/* CLIENT_FUND balance section */}
                {hasClientFundItems && (
                  <>
                    <tr className="bg-muted/20 border-t border-border">
                      <td
                        colSpan={isView ? 2 : 3}
                        className="px-4 py-2 text-right text-xs text-muted-foreground"
                      >
                        Client Fund Available
                        {isFetchingBalance && (
                          <Loader2 size={11} className="inline ml-1 animate-spin" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                        {clientFundBalance !== null
                          ? `₱${clientFundBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      {!isView && <td />}
                    </tr>
                    <tr className="bg-muted/20">
                      <td
                        colSpan={isView ? 2 : 3}
                        className="px-4 py-2 text-right text-xs text-muted-foreground"
                      >
                        Client Fund Usage
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                        −₱{clientFundTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      {!isView && <td />}
                    </tr>
                    <tr className="bg-muted/20 border-b border-border">
                      <td
                        colSpan={isView ? 2 : 3}
                        className="px-4 py-2.5 text-right text-xs font-semibold text-foreground"
                      >
                        Balance After
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right text-xs font-bold ${balanceAfter < 0 ? 'text-red-600' : 'text-foreground'}`}
                      >
                        ₱{balanceAfter.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        {balanceAfter < 0 && (
                          <span className="ml-1 text-red-500">(insufficient)</span>
                        )}
                      </td>
                      {!isView && <td />}
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>

          {/* Add item button — create & edit only */}
          {!isView && (
            <button
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
            >
              <Plus size={15} />
              Add item
            </button>
          )}

          {/* Approval info — view mode only */}
          {isView && record && (
            <div className="mt-5 space-y-3 text-sm">
              {record.custodianApprovedAt && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground font-medium shrink-0">Custodian approved:</span>
                  <span className="text-foreground">
                    {record.custodian?.name ?? '—'} on{' '}
                    {new Date(record.custodianApprovedAt).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {record.accountingManagerApprovedAt && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground font-medium shrink-0">Manager approved:</span>
                  <span className="text-foreground">
                    {record.accountingManager?.name ?? '—'} on{' '}
                    {new Date(record.accountingManagerApprovedAt).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {record.rejectionReason && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground font-medium shrink-0">Rejection reason:</span>
                  <span className="text-red-600">{record.rejectionReason}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 shrink-0">
          {isView ? (
            <div className="border-t border-border pt-5 space-y-5">
              <p className="text-sm font-semibold text-foreground">Received and Acknowledged</p>
              <div className="grid grid-cols-3 gap-6">
                {(['Prepared by', 'Petty Cash Custodian', 'Accounting Manager'] as const).map(
                  (roleLabel) => (
                    <div key={roleLabel} className="text-center">
                      <div className="h-10 border-b border-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">{roleLabel}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="mt-4 flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isCreate ? 'Request Fund' : 'Update'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
