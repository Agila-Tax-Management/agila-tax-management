'use client';

import React, { useState } from 'react';
import type { Client } from '@/lib/types';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import { PLAN_DATA, MOCK_SERVICES } from '@/lib/service-data';
import type { ServicePlan } from '@/lib/service-data';
import {
  Search, ChevronLeft, ChevronRight, Eye,
  User, FileText, CheckCircle, Package, Plus
} from 'lucide-react';

const parseMoney = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    return Number.parseFloat(normalized) || 0;
  }
  return 0;
};

const formatPHP = (amount: number): string =>
  new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [entriesPerPage, setEntriesPerPage] = useState('50');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(50);
  const [isAddServicesModalOpen, setIsAddServicesModalOpen] = useState(false);
  const [selectedOneTimeServices, setSelectedOneTimeServices] = useState<Set<string>>(new Set());
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<string | undefined>(undefined);

  const getResolvedOneTimePrice = (service: { rate?: number }): number => {
    return parseMoney(service.rate);
  };

  // Filter clients based on search and status
  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      c.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const paginatedClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);

  const handleEntriesPerPageChange = (value: string) => {
    setEntriesPerPage(value);
    if (value === 'All') {
      setClientsPerPage(filteredClients.length || 1);
    } else {
      setClientsPerPage(parseInt(value));
    }
    setCurrentPage(1);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };

  const toggleOneTimeService = (serviceId: string) => {
    const newSelected = new Set(selectedOneTimeServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedOneTimeServices(newSelected);
  };

  const handleSaveServices = () => {
    if (!selectedClient) return;

    setClients(prev =>
      prev.map(client => {
        if (client.id !== selectedClient.id) return client;

        const updated = { ...client };

        // If changing plan
        if (isChangingPlan && newPlan) {
          const newPlanData = PLAN_DATA[newPlan as ServicePlan];
          updated.planDetails = {
            basePlan: newPlan,
            displayName: newPlanData.displayName,
            customFeaturesIncluded: newPlanData.featuresIncluded,
            customFeaturesMore: newPlanData.featuresMore || [],
            customFreebies: newPlanData.freebies,
            customPrice: newPlanData.price,
            selectedServiceIds: [],
          };
        }

        // Add one-time services
        if (selectedOneTimeServices.size > 0) {
          const newServices = Array.from(selectedOneTimeServices).map(id => {
            const service = MOCK_SERVICES.find(s => s.id === id);
            return {
              id: `${client.id}-${id}`,
              serviceId: id,
              serviceName: service?.name || '',
              rate: service?.rate || 0,
            };
          });
          updated.clientServices = [...(updated.clientServices || []), ...newServices];
        }

        return updated;
      })
    );

    setIsAddServicesModalOpen(false);
    setSelectedOneTimeServices(new Set());
    setIsChangingPlan(false);
    setNewPlan(undefined);
  };

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
              placeholder="Search by name, client no., email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
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
              {paginatedClients.length > 0 ? (
                paginatedClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <span className="text-sm font-bold text-slate-800">{client.clientNo}</span>
                    </td>
                    <td className="p-5">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{client.businessName}</p>
                        <p className="text-xs text-slate-400 mt-1">{client.companyCode || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm text-slate-600">{client.email}</p>
                      <p className="text-xs text-slate-400 mt-1">{client.phone}</p>
                    </td>
                    <td className="p-5">
                      {client.planDetails ? (
                        <div>
                          <Badge variant="info" className="text-xs font-bold">
                            {client.planDetails.displayName || 'Custom Plan'}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            ₱{client.planDetails.customPrice || '0'}/mo
                          </p>
                        </div>
                      ) : (
                        <Badge variant="neutral" className="text-xs">No Plan</Badge>
                      )}
                    </td>
                    <td className="p-5">
                      <Badge variant={client.status === 'Active' ? 'success' : 'warning'}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="h-9 w-9 p-0 bg-purple-50 hover:bg-purple-100 border-purple-200"
                          onClick={() => {
                            setSelectedClient(client);
                            setSelectedOneTimeServices(new Set());
                            setIsChangingPlan(false);
                            setNewPlan(undefined);
                            setIsAddServicesModalOpen(true);
                          }}
                          title="Add / Change Plan"
                        >
                          <Plus size={16} className="text-purple-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0"
                          onClick={() => handleViewClient(client)}
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
          Showing <span className="font-bold">{indexOfFirstClient + 1}</span>-<span className="font-bold">{Math.min(indexOfLastClient, filteredClients.length)}</span> of <span className="font-bold">{filteredClients.length}</span> clients
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
            let pageNum;
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

      {/* Client Detail Modal - View Only */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedClient ? `${selectedClient.businessName}` : ''}
        size="xl"
      >
        {selectedClient && (
          <div className="space-y-6 p-6">
            {/* Basic Information Card */}
            <Card className="p-6 border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  <User size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Number</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedClient.clientNo}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Code</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedClient.companyCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authorized Representative</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedClient.authorizedRep}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedClient.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</p>
                  <Badge variant={selectedClient.status === 'Active' ? 'success' : 'warning'} className="mt-1">
                    {selectedClient.status}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                    <CheckCircle size={20} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Services</h3>
                </div>
              </div>

              {/* Monthly Service Plan */}
              {selectedClient.planDetails ? (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-black text-purple-900 uppercase tracking-wider">Monthly Service Plan</p>
                      <h4 className="text-lg font-black text-purple-700 mt-1">
                        {selectedClient.planDetails.displayName}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-purple-600">
                        ₱{selectedClient.planDetails.customPrice}
                      </p>
                      <p className="text-xs text-purple-600 font-bold">/month</p>
                    </div>
                  </div>

                  {/* Features included in plan */}
                  {selectedClient.planDetails.customFeaturesIncluded.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-xs font-black text-purple-900 uppercase tracking-wider mb-3">
                        Plan Features ({selectedClient.planDetails.customFeaturesIncluded.length}):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedClient.planDetails.customFeaturesIncluded.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm bg-white p-2 rounded-lg border border-purple-100">
                            <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-slate-700 leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6 p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Package size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">No Monthly Service Plan</p>
                  <p className="text-xs text-slate-500 mt-1">Click the &ldquo;+&rdquo; button to assign a monthly plan</p>
                </div>
              )}

              {/* One-Time Services */}
              <div>
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                  One-Time Services ({selectedClient.clientServices?.length || 0}):
                </p>
                {selectedClient.clientServices && selectedClient.clientServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedClient.clientServices.map(clientService => (
                      <div key={clientService.id} className="flex items-start gap-2 text-sm bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <FileText size={14} className="text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-slate-700 font-medium">{clientService.serviceName}</span>
                          {clientService.rate > 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">₱{formatPHP(clientService.rate)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No one-time services added</p>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Services Modal */}
      <Modal
        isOpen={isAddServicesModalOpen}
        onClose={() => {
          setIsAddServicesModalOpen(false);
          setSelectedOneTimeServices(new Set());
          setIsChangingPlan(false);
          setNewPlan(undefined);
        }}
        title={selectedClient ? `Add Services - ${selectedClient.businessName}` : 'Add Services'}
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
                    <select
                      value={newPlan || ''}
                      onChange={e => setNewPlan(e.target.value)}
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium"
                    >
                      <option value="">Select a plan...</option>
                      {Object.entries(PLAN_DATA).map(([key, plan]) => (
                        <option key={key} value={key}>
                          {plan.displayName} - ₱{plan.price}/mo
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedClient.planDetails && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-bold text-slate-500 uppercase">Current Plan:</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {selectedClient.planDetails.displayName} - ₱{selectedClient.planDetails.customPrice}/mo
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

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {MOCK_SERVICES.map(service => {
                  const isSelected = selectedOneTimeServices.has(service.id);
                  const alreadyHasService = selectedClient?.clientServices?.some(
                    cs => cs.serviceId === service.id
                  );

                  return (
                    <div
                      key={service.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300'
                          : alreadyHasService
                          ? 'bg-slate-100 border-slate-300 opacity-60'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => !alreadyHasService && toggleOneTimeService(service.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={alreadyHasService}
                          onChange={() => toggleOneTimeService(service.id)}
                          className="mt-1 w-4 h-4 rounded border-slate-300"
                          onClick={e => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
                          {getResolvedOneTimePrice(service) > 0 && (
                            <p className="text-xs font-bold text-blue-600 mt-1">
                              ₱{formatPHP(getResolvedOneTimePrice(service))}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="neutral" className="text-[10px]">
                              {service.teamInCharge}
                            </Badge>
                            <Badge variant="info" className="text-[10px]">
                              {service.government}
                            </Badge>
                          </div>
                          {alreadyHasService && (
                            <Badge variant="success" className="mt-2 text-xs">Already Added</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Summary */}
            {(selectedOneTimeServices.size > 0 || isChangingPlan) && (
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2">Summary:</p>
                <ul className="text-sm text-emerald-800 space-y-1">
                  {isChangingPlan && newPlan && (
                    <li>• Changing plan to: <strong>{PLAN_DATA[newPlan as ServicePlan]?.displayName}</strong></li>
                  )}
                  {selectedOneTimeServices.size > 0 && (
                    <li>• Adding <strong>{selectedOneTimeServices.size}</strong> one-time service(s)</li>
                  )}
                </ul>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddServicesModalOpen(false);
                  setSelectedOneTimeServices(new Set());
                  setIsChangingPlan(false);
                  setNewPlan(undefined);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSaveServices}
                disabled={!isChangingPlan && selectedOneTimeServices.size === 0}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
