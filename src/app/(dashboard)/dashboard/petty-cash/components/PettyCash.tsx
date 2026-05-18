// src/app/(dashboard)/dashboard/petty-cash/components/PettyCash.tsx
'use client';

import React, { useState } from 'react';
import { Search, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import RequestFundModal from './RequestFundModal';

// ── Types ────────────────────────────────────────────────────────────────────

export type PettyCashStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LineItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

export interface PettyCashRecord {
  id: string;
  pcfNo: string;
  date: string;
  client: string;
  requestedAmount: number;
  status: PettyCashStatus;
  lineItems: LineItem[];
  fundBalance: number;
}

export type ModalMode = 'create' | 'view' | 'edit';

// ── Mock data (TODO: replace with /api/petty-cash once API route is created) ─

const MOCK_FUND_BALANCE = 15000;

const MOCK_RECORDS: PettyCashRecord[] = [
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

const STATUS_STYLES: Record<PettyCashStatus, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  REJECTED: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PettyCash() {
  const { success } = useToast();

  const [search, setSearch]               = useState('');
  const [records, setRecords]             = useState<PettyCashRecord[]>(MOCK_RECORDS);
  const [modalOpen, setModalOpen]         = useState(false);
  const [modalMode, setModalMode]         = useState<ModalMode>('create');
  const [selectedRecord, setSelectedRecord] = useState<PettyCashRecord | null>(null);
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

  const openView = (record: PettyCashRecord) => {
    setModalMode('view');
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const openEdit = (record: PettyCashRecord) => {
    setModalMode('edit');
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setConfirmDeleteId(null);
    success('Deleted', 'Petty cash request has been removed.');
  };

  const handleSave = (data: Omit<PettyCashRecord, 'id' | 'pcfNo'>) => {
    if (modalMode === 'create') {
      const nextNo = String(records.length + 1).padStart(4, '0');
      const newRecord: PettyCashRecord = {
        id: crypto.randomUUID(),
        pcfNo: `PCF-2026-${nextNo}`,
        ...data,
        status: 'PENDING',
      };
      setRecords(prev => [newRecord, ...prev]);
      success('Request submitted', 'Your petty cash fund request has been created.');
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
        <h1 className="text-2xl font-bold text-foreground">Petty Cash</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <Plus size={16} />
          Request Fund
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search PCF No. or client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* ── Table ── */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">PCF No.</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Client</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Requested Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No petty cash records found.
                </td>
              </tr>
            ) : (
              filtered.map(record => (
                <tr key={record.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{record.pcfNo}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(record.date).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-foreground">{record.client}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
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
                        <span className="text-xs text-muted-foreground">Delete?</span>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openView(record)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(record)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(record.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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

      {/* The key prop resets modal state on every open/mode/record change */}
      <RequestFundModal
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
