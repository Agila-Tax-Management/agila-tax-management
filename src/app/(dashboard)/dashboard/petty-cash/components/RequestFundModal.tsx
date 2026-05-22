﻿﻿// src/app/(dashboard)/dashboard/petty-cash/components/RequestFundModal.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { authClient } from '@/lib/auth-client';
import type { ModalMode, PettyCashRecord, PettyCashItemCategory } from './PettyCash';
import type { ClientOption } from '@/types/accounting.types';

// -- Local types ---------------------------------------------------------------

interface ClientSearchOption {
  id: number;
  label: string;
  clientNo: string | null;
}

interface ItemRow {
  _key: string;
  category: PettyCashItemCategory;
  // CLIENT_FUND items carry a client; EMPLOYEE_EXPENSE items leave these null/empty
  clientId: number | null;
  clientLabel: string;
  clientFundBalance: number | null; // Live balance from API (or snapshot in view/edit)
  description: string;
  amount: number;
}

// -- Props ---------------------------------------------------------------------

interface RequestFundModalProps {
  isOpen: boolean;
  mode: ModalMode;
  record: PettyCashRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

// -- ClientPickerCell ----------------------------------------------------------
// Self-contained per-row client search dropdown used for CLIENT_FUND items.

interface ClientPickerCellProps {
  value: { id: number; label: string } | null;
  onChange: (client: { id: number; label: string; balance: number | null }) => void;
  readOnly?: boolean;
}

function ClientPickerCell({ value, onChange, readOnly }: ClientPickerCellProps) {
  const [search, setSearch] = useState(value?.label ?? '');
  const [options, setOptions] = useState<ClientSearchOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (val: string) => {
    setSearch(val);
    setIsOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim()) { setOptions([]); return; }
    timerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/accounting/invoices/clients?search=${encodeURIComponent(val)}`,
        );
        if (res.ok) {
          const d = await res.json();
          const opts: ClientSearchOption[] = ((d.data as ClientOption[]) ?? [])
            .filter((o) => o.type === 'client')
            .map((o) => ({ id: o.id, label: o.businessName ?? o.fullName, clientNo: null }));
          setOptions(opts);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const selectOption = async (opt: ClientSearchOption) => {
    setSearch(opt.label);
    setIsOpen(false);
    setOptions([]);
    let balance: number | null = null;
    try {
      const res = await fetch(`/api/accounting/client-funds/${opt.id}`);
      if (res.ok) {
        const d = await res.json();
        balance = (d.data as { currentBalance: number }).currentBalance ?? 0;
      }
    } catch { /* ignore */ }
    onChange({ id: opt.id, label: opt.label, balance });
  };

  if (readOnly) {
    return (
      <span className="text-foreground text-sm">{value?.label ?? '-'}</span>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => search && setIsOpen(true)}
          placeholder="Search client..."
          className="w-full pl-7 pr-6 py-1 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
        />
        {isSearching && (
          <Loader2
            size={11}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
          />
        )}
      </div>
      {isOpen && options.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-lg max-h-36 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => void selectOption(opt)}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted/50 transition"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Component -----------------------------------------------------------------

export default function RequestFundModal({
  isOpen,
  mode,
  record,
  onClose,
  onSuccess,
}: RequestFundModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const { data: sessionData } = authClient.useSession();

  // -- State (lazy initializers - key prop handles resets on reopen) ------------

  const [purpose, setPurpose] = useState<string>(() =>
    (mode === 'view' || mode === 'edit') && record ? record.purpose : '',
  );

  const [items, setItems] = useState<ItemRow[]>(() => {
    if ((mode === 'view' || mode === 'edit') && record) {
      return record.items.map((it) => ({
        _key: crypto.randomUUID(),
        category: it.category,
        clientId: it.clientId ?? null,
        clientLabel: it.client?.businessName ?? (
          // Legacy: item has no clientId but record has header client (old records)
          it.category === 'CLIENT_FUND' && record.client ? record.client.businessName : ''
        ),
        clientFundBalance: it.clientFundBalanceSnapshot ?? (
          // Legacy: use header-level snapshot for old records
          it.category === 'CLIENT_FUND' ? record.clientFundBalanceSnapshot : null
        ),
        description: it.description,
        amount: it.amount,
      }));
    }
    return [
      {
        _key: crypto.randomUUID(),
        category: 'EMPLOYEE_EXPENSE' as PettyCashItemCategory,
        clientId: null,
        clientLabel: '',
        clientFundBalance: null,
        description: '',
        amount: 0,
      },
    ];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isView = mode === 'view';
  const isCreate = mode === 'create';

  // -- Derived values -----------------------------------------------------------
  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  // Per-client fund breakdown (for footer)
  const clientFundGroups = new Map<
    number,
    { label: string; balance: number | null; usage: number }
  >();
  for (const item of items) {
    if (item.category === 'CLIENT_FUND' && item.clientId != null) {
      const existing = clientFundGroups.get(item.clientId);
      if (existing) {
        existing.usage += Number(item.amount) || 0;
      } else {
        clientFundGroups.set(item.clientId, {
          label: item.clientLabel,
          balance: item.clientFundBalance,
          usage: Number(item.amount) || 0,
        });
      }
    }
  }

  // -- Handlers -----------------------------------------------------------------

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        category: 'EMPLOYEE_EXPENSE',
        clientId: null,
        clientLabel: '',
        clientFundBalance: null,
        description: '',
        amount: 0,
      },
    ]);
  };

  const removeRow = (key: string) => {
    setItems((prev) => prev.filter((it) => it._key !== key));
  };

  const updateRow = (
    key: string,
    field: 'category' | 'description' | 'amount',
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it._key !== key) return it;
        const updated = { ...it, [field]: value };
        // Clear client when switching away from CLIENT_FUND
        if (field === 'category' && value === 'EMPLOYEE_EXPENSE') {
          updated.clientId = null;
          updated.clientLabel = '';
          updated.clientFundBalance = null;
        }
        return updated;
      }),
    );
  };

  const updateRowClient = (
    key: string,
    client: { id: number; label: string; balance: number | null },
  ) => {
    setItems((prev) =>
      prev.map((it) =>
        it._key === key
          ? { ...it, clientId: client.id, clientLabel: client.label, clientFundBalance: client.balance }
          : it,
      ),
    );
  };

  const handleSubmit = async () => {
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
    if (items.some((it) => it.category === 'CLIENT_FUND' && it.clientId == null)) {
      toastError('Validation', 'Please select a client for all Client Fund items.');
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
          purpose: purpose.trim(),
          items: items.map((it) => ({
            category: it.category,
            ...(it.clientId != null ? { clientId: it.clientId } : {}),
            description: it.description,
            amount: it.amount,
          })),
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

  // -- Render --------------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* -- Header -- */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-4">

            {/* Left: title + meta */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {isCreate
                    ? 'Request Fund'
                    : mode === 'edit'
                    ? 'Edit Request'
                    : 'Petty Cash Request'}
                </h2>
                {record && (
                  <span className="text-muted-foreground font-normal text-sm">
                    {record.pcfNo}
                  </span>
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
                <span className="text-sm font-semibold text-foreground shrink-0">
                  Requested by:
                </span>
                <span className="text-sm text-foreground">
                  {isView ? record?.requestedBy.name : (sessionData?.user?.name ?? '-')}
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

        {/* -- Items table -- */}
        <div className="px-6 py-5 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground w-[22%]">
                    Category
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground w-[25%]">
                    Client
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                    Description
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground w-[18%]">
                    Amount
                  </th>
                  {!isView && <th className="w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item._key} className="bg-card">
                    {/* Category */}
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="text-foreground">
                          {item.category === 'EMPLOYEE_EXPENSE'
                            ? 'Employee Expense'
                            : 'Client Fund'}
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
                    {/* Client (only relevant for CLIENT_FUND) */}
                    <td className="px-4 py-2">
                      {item.category === 'CLIENT_FUND' ? (
                        <ClientPickerCell
                          value={
                            item.clientId != null
                              ? { id: item.clientId, label: item.clientLabel }
                              : null
                          }
                          onChange={(c) => updateRowClient(item._key, c)}
                          readOnly={isView}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    {/* Description */}
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="text-foreground">{item.description}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateRow(item._key, 'description', e.target.value)
                          }
                          placeholder="Description"
                          className="w-full px-2 py-1 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                        />
                      )}
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="block text-right text-foreground">
                          ₱
                          {Number(item.amount).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          value={item.amount || ''}
                          onChange={(e) =>
                            updateRow(
                              item._key,
                              'amount',
                              parseFloat(e.target.value) || 0,
                            )
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
                    colSpan={isView ? 3 : 4}
                    className="px-4 py-3 text-right font-bold text-foreground"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  {!isView && <td />}
                </tr>

                {/* Per-client fund balance breakdown */}
                {clientFundGroups.size > 0 &&
                  [...clientFundGroups.entries()].map(([cId, g]) => {
                    const balanceAfter = (g.balance ?? 0) - g.usage;
                    return (
                      <React.Fragment key={cId}>
                        <tr className="bg-muted/20 border-t border-border">
                          <td
                            colSpan={isView ? 3 : 4}
                            className="px-4 py-2 text-right text-xs text-muted-foreground"
                          >
                            <span className="font-medium text-foreground">{g.label}</span>
                            {' '}- Fund Available
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                            {g.balance !== null
                              ? `₱${g.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                          {!isView && <td />}
                        </tr>
                        <tr className="bg-muted/20">
                          <td
                            colSpan={isView ? 3 : 4}
                            className="px-4 py-2 text-right text-xs text-muted-foreground"
                          >
                            <span className="font-medium text-foreground">{g.label}</span>
                            {' '}- Fund Usage
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                            -₱{g.usage.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          {!isView && <td />}
                        </tr>
                        <tr className="bg-muted/20 border-b border-border">
                          <td
                            colSpan={isView ? 3 : 4}
                            className="px-4 py-2.5 text-right text-xs font-semibold text-foreground"
                          >
                            <span className="font-medium">{g.label}</span>
                            {' '}- Balance After
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right text-xs font-bold ${
                              balanceAfter < 0 ? 'text-red-600' : 'text-foreground'
                            }`}
                          >
                            ₱
                            {balanceAfter.toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                            })}
                            {balanceAfter < 0 && (
                              <span className="ml-1 text-red-500">(insufficient)</span>
                            )}
                          </td>
                          {!isView && <td />}
                        </tr>
                      </React.Fragment>
                    );
                  })}
              </tfoot>
            </table>
          </div>

          {/* Add item button - create & edit only */}
          {!isView && (
            <button
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
            >
              <Plus size={15} />
              Add item
            </button>
          )}
        </div>

        {/* -- Footer -- */}
        {!isView && (
          <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {mode === 'edit' ? 'Save Changes' : 'Submit Request'}
            </button>
          </div>
        )}
        {isView && (
          <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
