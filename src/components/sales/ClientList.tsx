'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import type {
  ClientListRecord,
  ServicePlanOption,
  OneTimeServiceOption,
} from '@/types/sales-client-list.types';
import {
  Search, ChevronLeft, ChevronRight, Eye,
  FileText, Package, Plus,
  Loader2,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────

const formatPHP = (amount: number): string =>
  new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

// ─── Component ────────────────────────────────────────────────────

export function ClientList(): React.ReactNode {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // ─── Core data ─────────────────────────────────────────────────
  const [clients, setClients] = useState<ClientListRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // ─── Filters / pagination ──────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [entriesPerPage, setEntriesPerPage] = useState('50');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(50);

  // Reset page when filters or page size change (adjust state during render)
  const [prevFilters, setPrevFilters] = useState({ searchTerm, statusFilter, clientsPerPage });
  if (
    prevFilters.searchTerm !== searchTerm ||
    prevFilters.statusFilter !== statusFilter ||
    prevFilters.clientsPerPage !== clientsPerPage
  ) {
    setPrevFilters({ searchTerm, statusFilter, clientsPerPage });
    setCurrentPage(1);
  }

  // ─── Add services modal ────────────────────────────────────────
  const [selectedClient, setSelectedClient] = useState<ClientListRecord | null>(null);

  // ─── Add services modal ────────────────────────────────────────
  const [isAddServicesModalOpen, setIsAddServicesModalOpen] = useState(false);
  const [selectedOneTimeServices, setSelectedOneTimeServices] = useState<Set<number>>(new Set());
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [newPlanId, setNewPlanId] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [servicePlans, setServicePlans] = useState<ServicePlanOption[]>([]);
  const [oneTimeServices, setOneTimeServices] = useState<OneTimeServiceOption[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const hasLoadedServices = useRef(false);

  // ─── Fetch clients ─────────────────────────────────────────────
   
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      search: searchTerm,
      status: statusFilter,
      page: String(currentPage),
      limit: String(clientsPerPage),
    });
    fetch(`/api/sales/clients?${params}`)
      .then(r => r.json())
      .then((json: { data: ClientListRecord[]; total: number; page: number; totalPages: number }) => {
        setClients(json.data ?? []);
        setTotal(json.total ?? 0);
        setTotalPages(json.totalPages ?? 0);
      })
      .catch(() => toastError('Failed to load clients', 'Please refresh and try again.'))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, currentPage, clientsPerPage, refreshKey]);

  // ─── Load service options lazily on first modal open ──────────
  const loadServiceOptions = async () => {
    if (hasLoadedServices.current) return;
    setIsLoadingServices(true);
    try {
      const [plansRes, servicesRes] = await Promise.all([
        fetch('/api/sales/service-plans').then(r => r.json()),
        fetch('/api/sales/service-one-time').then(r => r.json()),
      ]);
      setServicePlans((plansRes as { data: ServicePlanOption[] }).data ?? []);
      setOneTimeServices((servicesRes as { data: OneTimeServiceOption[] }).data ?? []);
      hasLoadedServices.current = true;
    } catch {
      toastError('Failed to load services', 'Please try again.');
    } finally {
      setIsLoadingServices(false);
    }
  };

  // ─── Event handlers ────────────────────────────────────────────
  const handleEntriesPerPageChange = (value: string) => {
    setEntriesPerPage(value);
    setClientsPerPage(value === 'All' ? 1000 : parseInt(value, 10));
  };

  const handleOpenAddServices = (client: ClientListRecord) => {
    setSelectedClient(client);
    setSelectedOneTimeServices(new Set());
    setIsChangingPlan(false);
    setNewPlanId(undefined);
    setIsAddServicesModalOpen(true);
    void loadServiceOptions();
  };

  const toggleOneTimeService = (serviceId: number) => {
    setSelectedOneTimeServices(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const handleSaveServices = async () => {
    if (!selectedClient) return;
    if (!isChangingPlan && selectedOneTimeServices.size === 0) return;

    setIsSaving(true);
    try {
      const body: { changePlanId?: number; oneTimeServiceIds?: number[]; notes: null } = {
        notes: null,
      };
      if (isChangingPlan && newPlanId) body.changePlanId = newPlanId;
      if (selectedOneTimeServices.size > 0) body.oneTimeServiceIds = Array.from(selectedOneTimeServices);

      const res = await fetch(`/api/sales/clients/${selectedClient.id}/job-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { data?: { jobOrderNumber: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to create job order');

      success('Job Order Created', `Job order ${json.data?.jobOrderNumber ?? ''} has been submitted.`);
      setIsAddServicesModalOpen(false);
      setSelectedOneTimeServices(new Set());
      setIsChangingPlan(false);
      setNewPlanId(undefined);
      setRefreshKey(k => k + 1);
    } catch (err) {
      toastError('Failed to save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const indexOfFirstClient = (currentPage - 1) * clientsPerPage;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Client List</h2>
          <p className="text-sm text-slate-500">All onboarded clients with full profiles.</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
              placeholder="Search by name or client no..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium"
            value={entriesPerPage}
            onChange={e => handleEntriesPerPageChange(e.target.value)}
          >
            <option>50</option>
            <option>100</option>
            <option>All</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-5">Client No.</th>
                <th className="p-5">Business Name</th>
                <th className="p-5">Contact</th>
                <th className="p-5">Service Plan</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 size={24} className="mx-auto animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : clients.length > 0 ? (
                clients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <span className="text-sm font-bold text-slate-800">{client.clientNo ?? `#${client.id}`}</span>
                    </td>
                    <td className="p-5">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{client.businessName}</p>
                        <p className="text-xs text-slate-400 mt-1">{client.companyCode ?? 'N/A'}</p>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm text-slate-600">{client.contactEmail ?? '—'}</p>
                      <p className="text-xs text-slate-400 mt-1">{client.contactPhone ?? '—'}</p>
                    </td>
                    <td className="p-5">
                      {client.activeSubscription ? (
                        <div>
                          <Badge variant="info" className="text-xs font-bold">
                            {client.activeSubscription.servicePlanName}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            ₱{formatPHP(client.activeSubscription.agreedRate)}/mo
                          </p>
                        </div>
                      ) : (
                        <Badge variant="neutral" className="text-xs">No Plan</Badge>
                      )}
                    </td>
                    <td className="p-5">
                      <Badge variant={client.active ? 'success' : 'warning'}>
                        {client.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="h-9 w-9 p-0 bg-purple-50 hover:bg-purple-100 border-purple-200"
                          onClick={() => handleOpenAddServices(client)}
                          title="Add / Change Plan"
                        >
                          <Plus size={16} className="text-purple-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0"
                          onClick={() => router.push(`/portal/sales/clients/${client.id}`)}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                    No clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Showing{' '}
          <span className="font-bold">{clients.length > 0 ? indexOfFirstClient + 1 : 0}</span>–
          <span className="font-bold">{indexOfFirstClient + clients.length}</span> of{' '}
          <span className="font-bold">{total}</span> clients
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft size={16} />
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant="outline"
                onClick={() => setCurrentPage(pageNum)}
                className={`h-9 w-9 p-0 ${
                  currentPage === pageNum
                    ? 'bg-[#25238e] text-white hover:bg-[#1e1c72] border-none'
                    : ''
                }`}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="h-9 w-9 p-0"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Add / Change Services Modal */}
      <Modal
        isOpen={isAddServicesModalOpen}
        onClose={() => {
          setIsAddServicesModalOpen(false);
          setSelectedOneTimeServices(new Set());
          setIsChangingPlan(false);
          setNewPlanId(undefined);
        }}
        title={selectedClient ? `Add Services — ${selectedClient.businessName}` : 'Add Services'}
        size="xl"
      >
        {selectedClient && (
          <div className="space-y-6 p-6">
            {/* Change Plan Section */}
            <Card className="p-6 border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center">
                  <Package size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Change Monthly Plan</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="changePlan"
                    checked={isChangingPlan}
                    onChange={e => setIsChangingPlan(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="changePlan" className="text-sm font-medium text-slate-700">
                    Change to a different plan
                  </label>
                </div>
                {isChangingPlan && (
                  <div className="ml-7">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                      Select New Plan
                    </label>
                    {isLoadingServices ? (
                      <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                        <Loader2 size={16} className="animate-spin" />
                        Loading plans...
                      </div>
                    ) : (
                      <select
                        value={newPlanId ?? ''}
                        onChange={e => setNewPlanId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium"
                      >
                        <option value="">Select a plan...</option>
                        {servicePlans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} — ₱{formatPHP(plan.serviceRate)}/mo
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                {selectedClient.activeSubscription && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-bold text-slate-500 uppercase">Current Plan:</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {selectedClient.activeSubscription.servicePlanName} — ₱{formatPHP(selectedClient.activeSubscription.agreedRate)}/mo
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* One-Time Services Section */}
            <Card className="p-6 border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Add One-Time Services</h3>
              </div>
              {isLoadingServices ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                  <Loader2 size={16} className="animate-spin" />
                  Loading services...
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {oneTimeServices.map(service => {
                    const isSelected = selectedOneTimeServices.has(service.id);
                    return (
                      <div
                        key={service.id}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => toggleOneTimeService(service.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOneTimeService(service.id)}
                            className="mt-1 w-4 h-4 rounded border-slate-300"
                            onClick={e => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
                            {service.serviceRate > 0 && (
                              <p className="text-xs font-bold text-blue-600 mt-1">
                                ₱{formatPHP(service.serviceRate)}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {service.inclusions.slice(0, 1).map(inc => (
                                <Badge key={inc.id} variant="neutral" className="text-[10px]">
                                  {inc.category ?? inc.name}
                                </Badge>
                              ))}
                              {service.governmentOffices.slice(0, 1).map(gov => (
                                <Badge key={gov.id} variant="info" className="text-[10px]">
                                  {gov.code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {oneTimeServices.length === 0 && (
                    <p className="text-sm text-slate-500 italic py-4 text-center">No one-time services available</p>
                  )}
                </div>
              )}
            </Card>

            {/* Summary */}
            {(selectedOneTimeServices.size > 0 || (isChangingPlan && newPlanId)) && (
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2">Summary:</p>
                <ul className="text-sm text-emerald-800 space-y-1">
                  {isChangingPlan && newPlanId && (
                    <li>• Changing plan to: <strong>{servicePlans.find(p => p.id === newPlanId)?.name ?? '...'}</strong></li>
                  )}
                  {selectedOneTimeServices.size > 0 && (
                    <li>• Adding <strong>{selectedOneTimeServices.size}</strong> one-time service(s)</li>
                  )}
                  <li className="text-xs text-emerald-700 mt-1">A job order will be created and sent for operations review.</li>
                </ul>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                className="flex-1"
                disabled={isSaving}
                onClick={() => {
                  setIsAddServicesModalOpen(false);
                  setSelectedOneTimeServices(new Set());
                  setIsChangingPlan(false);
                  setNewPlanId(undefined);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => void handleSaveServices()}
                disabled={isSaving || (!isChangingPlan && selectedOneTimeServices.size === 0) || (isChangingPlan && !newPlanId)}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Creating Job Order...
                  </span>
                ) : (
                  'Create Job Order'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

