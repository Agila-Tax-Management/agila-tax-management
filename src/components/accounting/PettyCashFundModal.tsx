// src/components/accounting/PettyCashFundModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
// -- Local types (self-contained - not imported from PettyCashFund) -----------

type PCFStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type PCFModalMode = 'create' | 'view' | 'edit';

interface PCFLineItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

interface PCFRecord {
  id: string;
  pcfNo: string;
  date: string;
  client: string;
  requestedAmount: number;
  status: PCFStatus;
  lineItems: PCFLineItem[];
  fundBalance: number;
}

// -- Mock clients (TODO: fetch from /api/clients) ----------------------------

const MOCK_CLIENTS = [
  'Santos Realty Inc.',
  'Cruz & Associates',
  'Dela Cruz Enterprises',
  'Agila Tax Management',
  'Mendoza Trading Corp.',
];

// -- Props -------------------------------------------------------------------

interface PettyCashFundModalProps {
  isOpen: boolean;
  mode: PCFModalMode;
  record: PCFRecord | null;
  fundBalance: number;
  onClose: () => void;
  onSave: (data: Omit<PCFRecord, 'id' | 'pcfNo'>) => void;
}

// -- Component ---------------------------------------------------------------

export function PettyCashFundModal({
  isOpen,
  mode,
  record,
  fundBalance,
  onClose,
  onSave,
}: PettyCashFundModalProps) {
  // Lazy initializers - key prop on parent handles full resets between opens
  const [client, setClient] = useState<string>(() =>
    (mode === 'view' || mode === 'edit') && record ? record.client : '',
  );

  const [lineItems, setLineItems] = useState<PCFLineItem[]>(() =>
    (mode === 'view' || mode === 'edit') && record
      ? record.lineItems
      : [{ id: 'item-1', category: '', description: '', amount: 0 }],
  );

  if (!isOpen) return null;

  const isView   = mode === 'view';
  const isCreate = mode === 'create';

  const total = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // -- Line item handlers ---------------------------------------------------

  const addRow = () => {
    const newId = crypto.randomUUID();
    setLineItems(prev => [...prev, { id: newId, category: '', description: '', amount: 0 }]);
  };

  const removeRow = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const updateRow = (id: string, field: keyof Omit<PCFLineItem, 'id'>, value: string | number) => {
    setLineItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item),
    );
  };

  const handleSubmit = () => {
    onSave({
      date: new Date().toISOString().split('T')[0]!,
      client,
      requestedAmount: total,
      status: 'PENDING',
      lineItems,
      fundBalance,
    });
  };

  const canSubmit = client.trim() !== '' && lineItems.some(i => i.category.trim() !== '');

  // -- Render ---------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-start justify-between gap-4">

            {/* Left: title + client */}
            <div className="space-y-3 flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Request Fund
                {(mode === 'view' || mode === 'edit') && record ? (
                  <span className="ml-2 text-slate-400 font-normal text-sm">{record.pcfNo}</span>
                ) : null}
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 shrink-0">Client:</span>
                {isView ? (
                  <span className="text-sm text-slate-900">{record?.client}</span>
                ) : (
                  <select
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    className="flex-1 max-w-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  >
                    <option value="">Select client...</option>
                    {MOCK_CLIENTS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Right: fund balance + close */}
            <div className="flex items-start gap-3 shrink-0">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">
                  {isView ? 'Funds Balance' : 'Fund Balance'}
                </p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  ₱{fundBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition mt-0.5"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="px-6 py-5 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 w-[30%]">Category</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Description</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500 w-[22%]">Amount</th>
                  {!isView && <th className="w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map(item => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="text-slate-900">{item.category}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.category}
                          onChange={e => updateRow(item.id, 'category', e.target.value)}
                          placeholder="Category"
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="text-slate-900">{item.description}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateRow(item.id, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isView ? (
                        <span className="block text-right text-slate-900">
                          ₱{Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          value={item.amount || ''}
                          onChange={e => updateRow(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                        />
                      )}
                    </td>
                    {!isView && (
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeRow(item.id)}
                          disabled={lineItems.length === 1}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {/* Total row */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td
                    colSpan={isView ? 2 : 3}
                    className="px-4 py-3 text-right font-bold text-slate-900"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  {!isView && <td />}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add item button - create & edit only */}
          {!isView && (
            <button
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium transition"
            >
              <Plus size={15} />
              Add item
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 shrink-0">
          {isView ? (
            /* View - Received and Acknowledge signature block */
            <div className="border-t border-slate-200 pt-5 space-y-5">
              <p className="text-sm font-semibold text-slate-700">Received and Acknowledged</p>
              <div className="grid grid-cols-3 gap-6">
                {(['Prepared by', 'Petty Cash Custodian', 'Accounting Manager'] as const).map(role => (
                  <div key={role} className="text-center">
                    <div className="h-10 border-b border-slate-400 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">{role}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Create / Edit - submit button */
            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="mt-4 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                {isCreate ? 'Request Fund' : 'Update'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
