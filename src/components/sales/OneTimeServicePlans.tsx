// src/components/sales/OneTimeServicePlans.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import {
  Trash2,
  Plus,
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { ServiceItem } from '@/lib/types';
import { MOCK_SERVICES, GOVERNMENT_AGENCIES, TEAM_OPTIONS } from '@/lib/service-data';

export function OneTimeServicePlans(): React.ReactNode {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [servicesPerPage, setServicesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterAgency, setFilterAgency] = useState('All');

  // Add Service Modal
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    teamInCharge: '',
    government: '',
    rate: '',
  });

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    const timer = setTimeout(() => {
      setServices([...MOCK_SERVICES]);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Filtering & Pagination
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.government.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = filterTeam === 'All' || s.teamInCharge === filterTeam;
      const matchesAgency = filterAgency === 'All' || s.government === filterAgency;
      return matchesSearch && matchesTeam && matchesAgency;
    });
  }, [services, searchTerm, filterTeam, filterAgency]);

  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  const startIndex = (currentPage - 1) * servicesPerPage;
  const endIndex = startIndex + servicesPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const handleServicesPerPageChange = (value: number) => {
    setServicesPerPage(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTeam, filterAgency]);

  const handleBulkImport = () => {
    setServices([...MOCK_SERVICES]);
  };

  const handleAddService = () => {
    if (!newService.name || !newService.teamInCharge || !newService.government || !newService.rate) {
      return;
    }

    const created: ServiceItem = {
      id: `svc-custom-${Date.now()}`,
      name: newService.name,
      teamInCharge: newService.teamInCharge,
      government: newService.government,
      rate: parseFloat(newService.rate),
    };

    setServices((prev) => [...prev, created]);
    setIsAddServiceModalOpen(false);
    setNewService({ name: '', teamInCharge: '', government: '', rate: '' });
  };

  const handleDeleteService = () => {
    if (!deleteTarget) return;
    setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const stats = useMemo(() => {
    const teams = new Set(services.map((s) => s.teamInCharge));
    const agencies = new Set(services.map((s) => s.government));
    const avgRate = services.length > 0 ? services.reduce((sum, s) => sum + s.rate, 0) / services.length : 0;
    return { total: services.length, teams: teams.size, agencies: agencies.size, avgRate };
  }, [services]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading one-time services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              One-Time Service Plans
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Individual services available for one-time engagements &bull; Currency: PHP
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">{stats.total}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Services</p>
          </div>
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">{stats.teams}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Teams</p>
          </div>
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">{stats.agencies}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Agencies</p>
          </div>
        </div>
      </div>

      {/* Services List */}
      <Card className="border-slate-200 shadow-sm overflow-visible">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              List of Services
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {filteredServices.length} of {services.length} services
              {searchTerm || filterTeam !== 'All' || filterAgency !== 'All' ? ' (filtered)' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {services.length === 0 && (
              <Button
                onClick={handleBulkImport}
                className="bg-green-600 hover:bg-green-700 text-white text-[11px]"
              >
                <Upload size={14} className="mr-1" />
                Import All (64)
              </Button>
            )}
            <Button
              onClick={() => setIsAddServiceModalOpen(true)}
              className="bg-blue-600 text-white rounded-md font-bold text-[11px] px-4 py-2 hover:bg-blue-700 shadow-sm"
            >
              <Plus size={14} className="mr-1" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-md text-sm w-full"
                placeholder="Search services or agencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Filter size={14} className="text-slate-400" />
              <select
                className="h-10 bg-slate-50 border border-slate-200 rounded-md px-3 text-sm font-medium text-slate-800"
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
              >
                {TEAM_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? 'All Teams' : t}
                  </option>
                ))}
              </select>
              <select
                className="h-10 bg-slate-50 border border-slate-200 rounded-md px-3 text-sm font-medium text-slate-800"
                value={filterAgency}
                onChange={(e) => setFilterAgency(e.target.value)}
              >
                {GOVERNMENT_AGENCIES.map((a) => (
                  <option key={a} value={a}>
                    {a === 'All' ? 'All Agencies' : a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <select
              className="h-10 bg-slate-50 border border-slate-200 rounded-md px-3 text-sm font-medium text-slate-800"
              value={servicesPerPage}
              onChange={(e) => handleServicesPerPageChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>All</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 w-12">#</th>
                  <th className="p-4">Service Name</th>
                  <th className="p-4">Team In Charge</th>
                  <th className="p-4">Government</th>
                  <th className="p-4 text-right">Rate (PHP)</th>
                  <th className="p-4 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedServices.length > 0 ? (
                  paginatedServices.map((service, idx) => (
                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 text-xs text-slate-400 font-mono">
                        {startIndex + idx + 1}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 text-sm">{service.name}</span>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            service.teamInCharge === 'Compliance'
                              ? 'warning'
                              : service.teamInCharge === 'Accounting'
                              ? 'info'
                              : 'neutral'
                          }
                          className="text-xs"
                        >
                          {service.teamInCharge}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="info" className="text-xs">
                          {service.government}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black text-slate-800 text-sm">
                          ₱{service.rate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setDeleteTarget(service)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors border border-transparent hover:border-rose-100 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                      {searchTerm || filterTeam !== 'All' || filterAgency !== 'All'
                        ? 'No services found matching your filters.'
                        : 'No services available. Import or add services to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="p-6">
            {paginatedServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedServices.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="info" className="text-[9px]">
                        {service.government}
                      </Badge>
                      <button
                        onClick={() => setDeleteTarget(service)}
                        className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 leading-snug">
                      {service.name}
                    </h4>
                    <Badge
                      variant={
                        service.teamInCharge === 'Compliance'
                          ? 'warning'
                          : service.teamInCharge === 'Accounting'
                          ? 'info'
                          : 'neutral'
                      }
                      className="text-[9px] mb-3"
                    >
                      {service.teamInCharge}
                    </Badge>
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-lg font-black text-slate-900">
                        ₱{service.rate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 italic">
                {searchTerm || filterTeam !== 'All' || filterAgency !== 'All'
                  ? 'No services found matching your filters.'
                  : 'No services available. Import or add services to get started.'}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredServices.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600">
              Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
              <span className="font-bold">{Math.min(endIndex, filteredServices.length)}</span> of{' '}
              <span className="font-bold">{filteredServices.length}</span> services
            </p>

            <div className="flex gap-1.5">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
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
                    className={`h-9 w-9 p-0 text-xs font-bold ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                        : ''
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="h-9 w-9 p-0"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Service Modal */}
      <Modal isOpen={isAddServiceModalOpen} onClose={() => setIsAddServiceModalOpen(false)} title="Add New Service">
        <div className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Service Name *</label>
            <Input
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              placeholder="Enter service name"
              className="bg-white border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Team In Charge *</label>
              <select
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newService.teamInCharge}
                onChange={(e) => setNewService({ ...newService, teamInCharge: e.target.value })}
              >
                <option value="">Select team</option>
                <option value="Liaison">Liaison</option>
                <option value="Compliance">Compliance</option>
                <option value="Accounting">Accounting</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Government Agency *</label>
              <select
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newService.government}
                onChange={(e) => setNewService({ ...newService, government: e.target.value })}
              >
                <option value="">Select agency</option>
                {GOVERNMENT_AGENCIES.filter((a) => a !== 'All').map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Rate (PHP) *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newService.rate}
              onChange={(e) => setNewService({ ...newService, rate: e.target.value })}
              placeholder="0.00"
              className="bg-white border-slate-200"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsAddServiceModalOpen(false);
                setNewService({ name: '', teamInCharge: '', government: '', rate: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAddService}
              disabled={!newService.name || !newService.teamInCharge || !newService.government || !newService.rate}
            >
              <Plus size={14} className="mr-1" />
              Add Service
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Service" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-bold text-slate-900">{deleteTarget?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDeleteService}
            >
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
