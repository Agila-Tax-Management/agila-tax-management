// src/components/it/ITAssets.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import {
  Plus, Search, HardDrive, X, Loader2, Pencil, Monitor,
  Laptop, Tablet, Phone, Server, Printer, Wifi, HelpCircle,
} from 'lucide-react';

interface AssetRecord {
  id: number;
  assetTag: string;
  name: string;
  type: string;
  status: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  warrantyUntil: string | null;
  notes: string | null;
  createdAt: string;
  assignedTo: { id: number; firstName: string; lastName: string; employeeNo: string | null } | null;
}

const TYPE_ICONS: Record<string, typeof HardDrive> = {
  COMPUTER: Monitor,
  LAPTOP: Laptop,
  TABLET: Tablet,
  PHONE: Phone,
  SERVER: Server,
  PRINTER: Printer,
  NETWORK_DEVICE: Wifi,
  OTHER: HelpCircle,
};

const TYPE_LABELS: Record<string, string> = {
  COMPUTER: 'Computer',
  LAPTOP: 'Laptop',
  TABLET: 'Tablet',
  PHONE: 'Phone',
  SERVER: 'Server',
  PRINTER: 'Printer',
  NETWORK_DEVICE: 'Network Device',
  OTHER: 'Other',
};

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'info' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  UNASSIGNED: 'neutral',
  UNDER_REPAIR: 'warning',
  RETIRED: 'danger',
  DISPOSED: 'danger',
};

const EMPTY_FORM = {
  name: '', type: 'COMPUTER', status: 'UNASSIGNED', brand: '', model: '',
  serialNumber: '', purchaseDate: '', warrantyUntil: '', notes: '',
};

export function ITAssets() {
  const { success, error } = useToast();
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState<AssetRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterType) params.set('type', filterType);
    if (search) params.set('search', search);
    const res = await fetch(`/api/it/assets?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    setAssets(json.data ?? []);
  }, [filterStatus, filterType, search]);

  useEffect(() => {
    setLoading(true);
    void fetchAssets().finally(() => setLoading(false));
  }, [fetchAssets]);

  function openAdd() {
    setEditAsset(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(asset: AssetRecord) {
    setEditAsset(asset);
    setForm({
      name: asset.name,
      type: asset.type,
      status: asset.status,
      brand: asset.brand ?? '',
      model: asset.model ?? '',
      serialNumber: asset.serialNumber ?? '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : '',
      warrantyUntil: asset.warrantyUntil ? asset.warrantyUntil.slice(0, 10) : '',
      notes: asset.notes ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { error('Missing name', 'Asset name is required.'); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name, type: form.type, status: form.status,
      };
      if (form.brand) payload.brand = form.brand;
      if (form.model) payload.model = form.model;
      if (form.serialNumber) payload.serialNumber = form.serialNumber;
      if (form.purchaseDate) payload.purchaseDate = form.purchaseDate;
      if (form.warrantyUntil) payload.warrantyUntil = form.warrantyUntil;
      if (form.notes) payload.notes = form.notes;

      const res = editAsset
        ? await fetch(`/api/it/assets/${editAsset.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/it/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) { const j = await res.json(); error('Failed', j.error ?? 'Error occurred.'); return; }
      success(editAsset ? 'Asset updated' : 'Asset registered', `${form.name} has been ${editAsset ? 'updated' : 'registered'}.`);
      setShowForm(false);
      setEditAsset(null);
      void fetchAssets();
    } catch { error('Failed', 'Unexpected error.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Asset Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track company IT assets, devices, and hardware.</p>
        </div>
        <Button onClick={openAdd} className="bg-cyan-700 hover:bg-cyan-800 text-white">
          <Plus size={16} className="mr-2" /> Register Asset
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="UNASSIGNED">Unassigned</option>
          <option value="UNDER_REPAIR">Under Repair</option>
          <option value="RETIRED">Retired</option>
          <option value="DISPOSED">Disposed</option>
        </select>
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Card>

      {/* Form */}
      {showForm && (
        <Card className="p-5 border-cyan-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">{editAsset ? `Edit ${editAsset.name}` : 'Register Asset'}</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Name</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                placeholder="e.g., Dell Laptop #3"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="UNASSIGNED">Unassigned</option>
                <option value="UNDER_REPAIR">Under Repair</option>
                <option value="RETIRED">Retired</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Brand</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                placeholder="e.g., Dell, Apple, HP"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Model</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                placeholder="e.g., Latitude 5530"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Serial Number</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                placeholder="SN / Asset serial"
                value={form.serialNumber}
                onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Purchase Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Warranty Until</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                value={form.warrantyUntil}
                onChange={(e) => setForm((f) => ({ ...f, warrantyUntil: e.target.value }))}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
              placeholder="Additional notes…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-cyan-700 hover:bg-cyan-800 text-white">
              {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
              {editAsset ? 'Update' : 'Register'}
            </Button>
          </div>
        </Card>
      )}

      {/* Asset list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-cyan-700" /></div>
      ) : assets.length === 0 ? (
        <Card className="p-12 text-center">
          <HardDrive size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No assets found</p>
          <p className="text-slate-400 text-sm mt-1">Register a device to start tracking your IT inventory.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const Icon = TYPE_ICONS[asset.type] ?? HardDrive;
            return (
              <Card key={asset.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-cyan-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{asset.name}</p>
                      <button onClick={() => openEdit(asset)} className="text-slate-400 hover:text-cyan-700 shrink-0">
                        <Pencil size={13} />
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{asset.assetTag}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={STATUS_VARIANT[asset.status] ?? 'neutral'} className="text-[9px]">
                        {asset.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-500">{TYPE_LABELS[asset.type] ?? asset.type}</span>
                    </div>
                    {(asset.brand || asset.model) && (
                      <p className="text-xs text-slate-500 mt-1">{[asset.brand, asset.model].filter(Boolean).join(' ')}</p>
                    )}
                    {asset.assignedTo && (
                      <p className="text-xs text-cyan-700 font-medium mt-1">
                        → {asset.assignedTo.firstName} {asset.assignedTo.lastName}
                      </p>
                    )}
                    {asset.warrantyUntil && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Warranty: {new Date(asset.warrantyUntil).toLocaleDateString('en-PH')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
