// src/components/sales/OneTimeServicePlans.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import {
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  LayoutGrid,
  List,
} from 'lucide-react';

interface ServiceOneTimeItem {
  id: number;
  name: string;
  description: string | null;
  serviceRate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  governmentOffices: { id: number; code: string; name: string }[];
  cities: { id: number; name: string }[];
  inclusions: { id: number; name: string }[];
  createdAt: string;
  updatedAt: string;
}

const INITIAL_NEW_SERVICE = { name: '', description: '', serviceRate: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' };

export function OneTimeServicePlans(): React.ReactNode {
  const { success, error } = useToast();
  const [services, setServices] = useState<ServiceOneTimeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [servicesPerPage, setServicesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Add Service Modal
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newService, setNewService] = useState(INITIAL_NEW_SERVICE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Service Modal
  const [editTarget, setEditTarget] = useState<ServiceOneTimeItem | null>(null);
  const [editForm, setEditForm] = useState(INITIAL_NEW_SERVICE);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<ServiceOneTimeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    fetch('/api/sales/service-one-time')
      .then((res) => res.json())
      .then((data: { data?: ServiceOneTimeItem[] }) => {
        setServices(data.data ?? []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // Filtering & Pagination
  const filteredServices = useMemo(() => {
    return services.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [services, searchTerm]);

  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  const startIndex = (currentPage - 1) * servicesPerPage;
  const endIndex = startIndex + servicesPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const handleServicesPerPageChange = (value: number) => {
    setServicesPerPage(value);
    setCurrentPage(1);
  };

  // Reset page on search change
  const [prevSearch, setPrevSearch] = useState(searchTerm);
  if (prevSearch !== searchTerm) {
    setPrevSearch(searchTerm);
    setCurrentPage(1);
  }

  const handleAddService = async () => {
    if (!newService.name || !newService.serviceRate) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sales/service-one-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newService.name.trim(),
          description: newService.description.trim() || undefined,
          serviceRate: parseFloat(newService.serviceRate),
          status: newService.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        error('Failed to add service', (data as { error?: string }).error ?? 'An error occurred.');
        return;
      }
      setServices((prev) => [data.data, ...prev]);
      setIsAddServiceModalOpen(false);
      setNewService(INITIAL_NEW_SERVICE);
      success('Service added', `"${data.data.name}" was added successfully.`);
    } catch {
      error('Failed to add service', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (svc: ServiceOneTimeItem) => {
    setEditTarget(svc);
    setEditForm({
      name: svc.name,
      description: svc.description ?? '',
      serviceRate: String(parseFloat(svc.serviceRate)),
      status: svc.status,
    });
  };

  const handleUpdateService = async () => {
    if (!editTarget || !editForm.name || !editForm.serviceRate) return;
    setIsEditSubmitting(true);
    try {
      const res = await fetch(`/api/sales/service-one-time/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          serviceRate: parseFloat(editForm.serviceRate),
          status: editForm.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        error('Failed to update service', (data as { error?: string }).error ?? 'An error occurred.');
        return;
      }
      setServices((prev) => prev.map((s) => (s.id === editTarget.id ? data.data : s)));
      setEditTarget(null);
      success('Service updated', `"${data.data.name}" was updated successfully.`);
    } catch {
      error('Failed to update service', 'An unexpected error occurred.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sales/service-one-time/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error('Failed to delete service', (data as { error?: string }).error ?? 'An error occurred.');
        return;
      }
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      success('Service deleted', `"${deleteTarget.name}" was removed successfully.`);
    } catch {
      error('Failed to delete service', 'An error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const active = services.filter((s) => s.status === 'ACTIVE').length;
    const avgRate = services.length > 0
      ? services.reduce((sum, s) => sum + parseFloat(s.serviceRate), 0) / services.length
      : 0;
    return { total: services.length, active, avgRate: Math.round(avgRate).toLocaleString() };
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
            <p className="text-lg font-black text-slate-900">{stats.active}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Active</p>
          </div>
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">₱{stats.avgRate}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Rate</p>
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
              {searchTerm ? ' (filtered)' : ''}
            </p>
          </div>
          <div className="flex gap-2">
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
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Rate (PHP)</th>
                  <th className="p-4">Gov Offices</th>
                  <th className="p-4 text-center w-24">Actions</th>
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
                        {service.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{service.description}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={service.status === 'ACTIVE' ? 'success' : service.status === 'INACTIVE' ? 'warning' : 'neutral'}
                          className="text-xs"
                        >
                          {service.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black text-slate-800 text-sm">
                          ₱{parseFloat(service.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-500">
                          {service.governmentOffices.length > 0
                            ? service.governmentOffices.map((g) => g.code).join(', ')
                            : <span className="text-slate-300">—</span>}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(service)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-100"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(service)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors border border-transparent hover:border-rose-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                      {searchTerm
                        ? 'No services found matching your search.'
                        : 'No services available. Add a service to get started.'}
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
                      <Badge
                        variant={service.status === 'ACTIVE' ? 'success' : service.status === 'INACTIVE' ? 'warning' : 'neutral'}
                        className="text-[9px]"
                      >
                        {service.status}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(service)}
                          className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(service)}
                          className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 leading-snug">
                      {service.name}
                    </h4>
                    {service.governmentOffices.length > 0 && (
                      <p className="text-[10px] text-slate-400 mb-1">{service.governmentOffices.map((g) => g.code).join(', ')}</p>
                    )}
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-lg font-black text-slate-900">
                        ₱{parseFloat(service.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 italic">
                {searchTerm
                  ? 'No services found matching your search.'
                  : 'No services available. Add a service to get started.'}
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <Input
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              placeholder="Brief description"
              className="bg-white border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Rate (PHP) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newService.serviceRate}
                onChange={(e) => setNewService({ ...newService, serviceRate: e.target.value })}
                placeholder="0.00"
                className="bg-white border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status</label>
              <select
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newService.status}
                onChange={(e) => setNewService({ ...newService, status: e.target.value as typeof newService.status })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setIsAddServiceModalOpen(false); setNewService(INITIAL_NEW_SERVICE); }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAddService}
              disabled={!newService.name || !newService.serviceRate || isSubmitting}
            >
              <Plus size={14} className="mr-1" />
              {isSubmitting ? 'Saving...' : 'Add Service'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Service Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Service">
        <div className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Service Name *</label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Enter service name"
              className="bg-white border-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <Input
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Brief description"
              className="bg-white border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Rate (PHP) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editForm.serviceRate}
                onChange={(e) => setEditForm({ ...editForm, serviceRate: e.target.value })}
                placeholder="0.00"
                className="bg-white border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status</label>
              <select
                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as typeof editForm.status })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditTarget(null)}
              disabled={isEditSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleUpdateService}
              disabled={!editForm.name || !editForm.serviceRate || isEditSubmitting}
            >
              {isEditSubmitting ? 'Saving...' : 'Save Changes'}
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
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDeleteService}
              disabled={isDeleting}
            >
              <Trash2 size={14} className="mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
