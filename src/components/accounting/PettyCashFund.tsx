// src/components/accounting/PettyCashFund.tsx
'use client';

import React, { useState } from 'react';
import { Search, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { PettyCashFundModal } from './PettyCashFundModal';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PCFStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PCFLineItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

export interface PCFRecord {
  id: string;
  pcfNo: string;
  date: string;
  client: string;
  requestedAmount: number;
  status: PCFStatus;
  lineItems: PCFLineItem[];
  fundBalance: number;
}

export type PCFModalMode = 'create' | 'view' | 'edit';

// ── Mock data (TODO: replace with /api/accounting/petty-cash) ─────────────────

const MOCK_FUND_BALANCE = 15000;

const MOCK_RECORDS: PCFRecord[] = [
  {
    id: '1',
    pcfNo: 'PCF-2026-0001',
    date: '2026-05-01',
    client: 'Santos Realty Inc.',
    requestedAmount: 2500,
    status: 'APPROVED',
    fundBalance: MOCK_FUND_BALANCE,
    lineItems: [
      { id: 'li-1-1', category: 'Office Supplies', description: 'Bond paper (5 reams)', amount: 500 },
      { id: 'li-1-2', category: 'Transportation', description: 'Grab to BIR Cebu', amount: 200 },
      { id: 'li-1-3', category: 'Meals', description: 'Team lunch', amount: 1800 },
    ],
  },
  {
    id: '2',
    pcfNo: 'PCF-2026-0002',
    date: '2026-05-10',
    client: 'Cruz & Associates',
    requestedAmount: 1200,
    status: 'PENDING',
    fundBalance: MOCK_FUND_BALANCE,
    lineItems: [
      { id: 'li-2-1', category: 'Office Supplies', description: 'Printer ink cartridge', amount: 1200 },
    ],
  },
  {
    id: '3',
    pcfNo: 'PCF-2026-0003',
    date: '2026-05-15',
    client: 'Dela Cruz Enterprises',
    requestedAmount: 800,
    status: 'REJECTED',
    fundBalance: MOCK_FUND_BALANCE,
    lineItems: [
      { id: 'li-3-1', category: 'Miscellaneous', description: 'Office cleaning supplies', amount: 800 },
    ],
  },
];

// ── Status badge styles ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<PCFStatus, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100  text-green-700',
  REJECTED: 'bg-red-100    text-red-700',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function PettyCashFund() {
  const { success } = useToast();

  const [search, setSearch]                   = useState('');
  const [records, setRecords]                 = useState<PCFRecord[]>(MOCK_RECORDS);
  const [modalOpen, setModalOpen]             = useState(false);
  const [modalMode, setModalMode]             = useState<PCFModalMode>('create');
  const [selectedRecord, setSelectedRecord]   = useState<PCFRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = records.filter(r =>
    r.pcfNo.toLowerCase().includes(search.toLowerCase()) ||
    r.client.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setModalMode('create');
    setSelectedRecord(null);
    setModalOpen(true);
  };

  const openView = (record: PCFRecord) => {
    setModalMode('view');
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const openEdit = (record: PCFRecord) => {
    setModalMode('edit');
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setConfirmDeleteId(null);
    success('Deleted', 'Petty cash request has been removed.');
  };

  const handleSave = (data: Omit<PCFRecord, 'id' | 'pcfNo'>) => {
    if (modalMode === 'create') {
      const nextNo = String(records.length + 1).padStart(4, '0');
      const newRecord: PCFRecord = {
        id: crypto.randomUUID(),
        pcfNo: `PCF-2026-${nextNo}`,
        ...data,
        status: 'PENDING',
      };
      setRecords(prev => [newRecord, ...prev]);
      success('Request submitted', 'Petty cash fund request has been created.');
    } else if (modalMode === 'edit' && selectedRecord) {
      setRecords(prev =>
        prev.map(r => r.id === selectedRecord.id ? { ...r, ...data } : r),
      );
      success('Updated', 'Petty cash request has been updated.');
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Petty Cash Fund</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <Plus size={16} />
          Request Fund
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search PCF No. or client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
        />
      </div>

      {/* ── Table ── */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">PCF No.</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Client</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-500">Requested Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-500">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No petty cash records found.
                </td>
              </tr>
            ) : (
              filtered.map(record => (
                <tr key={record.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{record.pcfNo}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(record.date).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{record.client}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    ₱{record.requestedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[record.status]}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {confirmDeleteId === record.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-slate-500">Delete?</span>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 text-xs transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openView(record)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(record)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(record.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* key prop resets modal state on every open/mode/record change */}
      <PettyCashFundModal
        key={`${modalMode}-${selectedRecord?.id ?? 'new'}`}
        isOpen={modalOpen}
        mode={modalMode}
        record={selectedRecord}
        fundBalance={MOCK_FUND_BALANCE}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
