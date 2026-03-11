'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { Client } from '@/lib/types';
import {
  Search,
  UserCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  Eye,
} from 'lucide-react';

/* ─── Constants ───────────────────────────────────────────────────── */

const CLIENT_STATUS_VARIANT: Record<string, 'success' | 'neutral' | 'warning' | 'danger'> = {
  Active: 'success',
  Pending: 'warning',
  Inactive: 'neutral',
  Suspended: 'danger',
};

const ITEMS_PER_PAGE = 10;

/* ─── Component ───────────────────────────────────────────────────── */

export default function ClientManagement(): React.ReactNode {
  const [clients] = useState<Client[]>(INITIAL_CLIENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    let result = clients;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.businessName.toLowerCase().includes(q) ||
          c.authorizedRep.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.clientNo.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [clients, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeCount = clients.filter((c) => c.status === 'Active').length;
  const pendingCount = clients.filter((c) => c.status === 'Pending').length;

  const stats = [
    { label: 'Total Clients', value: clients.length, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending', value: pendingCount, icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage client accounts and service plans
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by business name, representative, or email..."
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </Card>

      {/* Clients Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Client No.</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Business Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Authorized Rep</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No clients found.
                  </td>
                </tr>
              ) : (
                paginated.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{client.clientNo}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewingClient(client)}
                        className="font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap underline-offset-2 hover:underline transition text-left"
                      >
                        {client.businessName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {client.authorizedRep}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {client.email}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {client.planDetails ? (
                        <Badge variant="info">{client.planDetails.displayName}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CLIENT_STATUS_VARIANT[client.status] ?? 'neutral'}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setViewingClient(client)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} clients
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                    n === page ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Client Details Modal */}
      <Modal
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        title="Client Details"
        size="lg"
      >
        {viewingClient && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{viewingClient.businessName}</h3>
                <p className="text-sm text-muted-foreground">{viewingClient.companyCode} • {viewingClient.clientNo}</p>
              </div>
              <Badge variant={CLIENT_STATUS_VARIANT[viewingClient.status] ?? 'neutral'}>
                {viewingClient.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Authorized Representative</p>
                <p className="text-sm text-foreground">{viewingClient.authorizedRep}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="text-sm text-foreground">{viewingClient.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</p>
                <p className="text-sm text-foreground">{viewingClient.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</p>
                <p className="text-sm text-foreground">{viewingClient.planDetails?.displayName ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</p>
                <p className="text-sm font-semibold text-foreground">₱{viewingClient.planDetails?.customPrice ?? '0'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</p>
                <Badge variant={viewingClient.isPaid ? 'success' : 'warning'}>
                  {viewingClient.isPaid ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>
            </div>

            {viewingClient.clientServices.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Additional Services</h4>
                <div className="space-y-2">
                  {viewingClient.clientServices.map((svc) => (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border"
                    >
                      <span className="text-sm text-foreground">{svc.serviceName}</span>
                      <span className="text-sm font-medium text-foreground">₱{svc.rate.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewingClient(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
