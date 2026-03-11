'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  Search, FileText, Eye, Download, Plus, Send,
  CheckCircle2, Clock, AlertTriangle, XCircle, CircleDot,
  Building2, Mail,
} from 'lucide-react';
import {
  INITIAL_INVOICES,
  ACCOUNTING_TEAM,
  type Invoice,
  type InvoiceStatus,
} from '@/lib/mock-accounting-data';

const STATUS_CONFIG: Record<InvoiceStatus, { badge: 'info' | 'success' | 'danger' | 'warning' | 'neutral'; icon: React.ReactNode }> = {
  Draft:          { badge: 'neutral',  icon: <FileText size={12} /> },
  Sent:           { badge: 'info',     icon: <Send size={12} /> },
  Paid:           { badge: 'success',  icon: <CheckCircle2 size={12} /> },
  Overdue:        { badge: 'danger',   icon: <AlertTriangle size={12} /> },
  Cancelled:      { badge: 'neutral',  icon: <XCircle size={12} /> },
  'Partially Paid': { badge: 'warning', icon: <CircleDot size={12} /> },
};

export function InvoiceList() {
  const [invoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return inv.clientName.toLowerCase().includes(q)
          || inv.invoiceNo.toLowerCase().includes(q)
          || inv.clientNo.includes(q);
      }
      return true;
    });
  }, [invoices, search, statusFilter]);

  const stats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.total, 0);
    const paid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amountPaid, 0);
    const outstanding = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled')
      .reduce((s, i) => s + (i.total - i.amountPaid), 0);
    const overdue = invoices.filter(i => i.status === 'Overdue').length;
    return { total, paid, outstanding, overdue };
  }, [invoices]);

  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Invoices</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and track all client invoices.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 mb-3 w-fit"><FileText size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Invoiced</p>
          <p className="text-2xl font-black text-slate-900">{fmt(stats.total)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 mb-3 w-fit"><CheckCircle2 size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Collected</p>
          <p className="text-2xl font-black text-emerald-600">{fmt(stats.paid)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600 mb-3 w-fit"><Clock size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-black text-slate-900">{fmt(stats.outstanding)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-red-50 p-3 rounded-xl text-red-600 mb-3 w-fit"><AlertTriangle size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-2xl font-black text-red-600">{stats.overdue}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none">
            <option value="all">All Status</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      {/* Invoice List */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice No.</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No invoices found.</td></tr>
              ) : filtered.map(inv => {
                const cfg = STATUS_CONFIG[inv.status];
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-amber-700 text-sm">{inv.invoiceNo}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-[10px] font-black">
                          {inv.clientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{inv.clientName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{inv.clientNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{inv.issueDate}</td>
                    <td className="px-5 py-4 text-slate-600">{inv.dueDate}</td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-black text-slate-900">{fmt(inv.total)}</p>
                      {inv.amountPaid > 0 && inv.amountPaid < inv.total && (
                        <p className="text-[10px] text-emerald-600 font-bold">Paid: {fmt(inv.amountPaid)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={cfg.badge} className="text-[9px] uppercase flex items-center gap-1 w-fit">
                        {cfg.icon} {inv.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelected(inv)}>
                        <Eye size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Invoice Details" size="lg">
        {selected && (() => {
          const cfg = STATUS_CONFIG[selected.status];
          const creator = ACCOUNTING_TEAM.find(m => m.id === selected.createdBy);
          return (
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-amber-700">{selected.invoiceNo}</h3>
                  <p className="text-xs text-slate-500 mt-1">Issued: {selected.issueDate} · Due: {selected.dueDate}</p>
                </div>
                <Badge variant={cfg.badge} className="text-[9px] uppercase flex items-center gap-1">
                  {cfg.icon} {selected.status}
                </Badge>
              </div>

              {/* Client info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 font-black text-sm">
                    {selected.clientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{selected.clientName}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1"><Building2 size={10} /> {selected.clientNo}</span>
                      <span className="flex items-center gap-1"><Mail size={10} /> {selected.clientEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Line Items</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-2 text-[10px] font-black text-slate-400 uppercase">Description</th>
                        <th className="text-center px-4 py-2 text-[10px] font-black text-slate-400 uppercase">Qty</th>
                        <th className="text-right px-4 py-2 text-[10px] font-black text-slate-400 uppercase">Rate</th>
                        <th className="text-right px-4 py-2 text-[10px] font-black text-slate-400 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.lineItems.map(li => (
                        <tr key={li.id}>
                          <td className="px-4 py-3 text-slate-700">{li.description}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{li.quantity}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{fmt(li.rate)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(li.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-bold text-slate-800">{fmt(selected.subtotal)}</span>
                    </div>
                    {selected.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tax</span>
                        <span className="font-bold text-slate-800">{fmt(selected.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5">
                      <span className="font-bold text-slate-700">Total</span>
                      <span className="font-black text-lg text-slate-900">{fmt(selected.total)}</span>
                    </div>
                    {selected.amountPaid > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Amount Paid</span>
                        <span className="font-bold text-emerald-600">{fmt(selected.amountPaid)}</span>
                      </div>
                    )}
                    {selected.amountPaid < selected.total && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Balance Due</span>
                        <span className="font-bold text-red-600">{fmt(selected.total - selected.amountPaid)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Notes</p>
                  <p className="text-sm text-slate-600">{selected.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Created by: {creator?.name ?? 'System'}</span>
                <span>Created: {new Date(selected.createdAt).toLocaleDateString('en-PH')}</span>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
