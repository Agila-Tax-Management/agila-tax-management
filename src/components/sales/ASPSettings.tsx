// src/components/sales/ASPSettings.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, MapPin, Plus, Trash2, Edit2, Settings, GitBranch, ChevronUp, ChevronDown, UserCheck, Search, Loader2, Save } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import {
  GovernmentOfficeModal,
  type GovernmentOfficeRecord,
} from '@/app/(portal)/portal/sales/settings/components/GovernmentOfficeModal';
import {
  CityModal,
  type CityRecord,
} from '@/app/(portal)/portal/sales/settings/components/CityModal';
import {
  LeadStatusModal,
  type LeadStatusRecord,
} from '@/app/(portal)/portal/sales/settings/components/LeadStatusModal';

interface UserOption {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface SalesSettings {
  id: string;
  defaultJoOperationsApproverId: string | null;
  defaultJoAccountApproverId: string | null;
  defaultJoGeneralApproverId: string | null;
  defaultTsaApproverId: string | null;
  defaultJoOperationsApprover: UserOption | null;
  defaultJoAccountApprover: UserOption | null;
  defaultJoGeneralApprover: UserOption | null;
  defaultTsaApprover: UserOption | null;
}

function getInitials(name: string | null, email: string): string {
  const src = name?.trim() ?? '';
  if (src) {
    const parts = src.split(/\s+/);
    return parts.length >= 2
      ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
      : src.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function ASPSettings(): React.ReactNode {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'offices' | 'cities' | 'pipeline'>('general');

  /* ── General Settings ──────────────────────────────────────────── */
  const [salesSettings, setSalesSettings] = useState<SalesSettings | null>(null);
  const [generalLoading, setGeneralLoading] = useState(true);
  const [generalSaving, setGeneralSaving] = useState(false);

  // Local state for approver selection
  const [selectedJoOpsManager, setSelectedJoOpsManager] = useState<UserOption | null>(null);
  const [selectedJoAccountManager, setSelectedJoAccountManager] = useState<UserOption | null>(null);
  const [selectedJoGenManager, setSelectedJoGenManager] = useState<UserOption | null>(null);
  const [selectedTsaApprover, setSelectedTsaApprover] = useState<UserOption | null>(null);

  // User search states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<'jo_ops' | 'jo_account' | 'jo_gen' | 'tsa' | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSalesSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/sales');
      if (!res.ok) { error('Load failed', 'Could not load sales settings.'); return; }
      const json = (await res.json()) as { data: SalesSettings };
      setSalesSettings(json.data);
      setSelectedJoOpsManager(json.data.defaultJoOperationsApprover);
      setSelectedJoAccountManager(json.data.defaultJoAccountApprover);
      setSelectedJoGenManager(json.data.defaultJoGeneralApprover);
      setSelectedTsaApprover(json.data.defaultTsaApprover);
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setGeneralLoading(false);
    }
  }, [error]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }
    setUserSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`);
      if (!res.ok) { setUserSearchResults([]); return; }
      const json = (await res.json()) as { data: UserOption[] };
      setUserSearchResults(json.data ?? []);
    } catch {
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, []);

  const handleUserSearchChange = (value: string, field: 'jo_ops' | 'jo_account' | 'jo_gen' | 'tsa') => {
    setUserSearchQuery(value);
    setActiveSearchField(field);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      void searchUsers(value);
    }, 300);
  };

  const selectUser = (user: UserOption, field: 'jo_ops' | 'jo_account' | 'jo_gen' | 'tsa') => {
    switch (field) {
      case 'jo_ops': setSelectedJoOpsManager(user); break;
      case 'jo_account': setSelectedJoAccountManager(user); break;
      case 'jo_gen': setSelectedJoGenManager(user); break;
      case 'tsa': setSelectedTsaApprover(user); break;
    }
    setUserSearchQuery('');
    setUserSearchResults([]);
    setActiveSearchField(null);
  };

  const clearUser = (field: 'jo_ops' | 'jo_account' | 'jo_gen' | 'tsa') => {
    switch (field) {
      case 'jo_ops': setSelectedJoOpsManager(null); break;
      case 'jo_account': setSelectedJoAccountManager(null); break;
      case 'jo_gen': setSelectedJoGenManager(null); break;
      case 'tsa': setSelectedTsaApprover(null); break;
    }
  };

  const handleSaveGeneralSettings = async () => {
    setGeneralSaving(true);
    try {
      const res = await fetch('/api/admin/settings/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultJoOperationsApproverId: selectedJoOpsManager?.id ?? null,
          defaultJoAccountApproverId: selectedJoAccountManager?.id ?? null,
          defaultJoGeneralApproverId: selectedJoGenManager?.id ?? null,
          defaultTsaApproverId: selectedTsaApprover?.id ?? null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { error('Save failed', data.error ?? 'An error occurred.'); return; }
      success('Settings saved', 'Default approvers have been updated.');
      void fetchSalesSettings();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setGeneralSaving(false);
    }
  };

  /* â”€â”€ Government Offices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [offices, setOffices] = useState<GovernmentOfficeRecord[]>([]);
  const [officesLoading, setOfficesLoading] = useState(true);
  const [officeModal, setOfficeModal] = useState<{ open: boolean; record: GovernmentOfficeRecord | null }>({ open: false, record: null });

  const fetchOffices = useCallback(async () => {
    try {
      const res = await fetch('/api/sales/government-offices?includeInactive=true');
      if (!res.ok) { error('Load failed', 'Could not load government offices.'); return; }
      const json = (await res.json()) as { data: GovernmentOfficeRecord[] };
      setOffices(json.data ?? []);
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setOfficesLoading(false);
    }
  }, [error]);

  const handleDeleteOffice = async (office: GovernmentOfficeRecord) => {
    if (!confirm(`Deactivate "${office.name}"? It will be hidden from all lists.`)) return;
    try {
      const res = await fetch(`/api/sales/government-offices/${office.id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { error('Delete failed', data.error ?? 'An error occurred.'); return; }
      success('Office deactivated', `${office.name} has been deactivated.`);
      void fetchOffices();
    } catch {
      error('Network error', 'Could not connect to the server.');
    }
  };

  /* â”€â”€ Cities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [cities, setCities] = useState<CityRecord[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [cityModal, setCityModal] = useState<{ open: boolean; record: CityRecord | null }>({ open: false, record: null });

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch('/api/sales/cities?includeInactive=true');
      if (!res.ok) { error('Load failed', 'Could not load cities.'); return; }
      const json = (await res.json()) as { data: CityRecord[] };
      setCities(json.data ?? []);
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setCitiesLoading(false);
    }
  }, [error]);

  const handleDeleteCity = async (city: CityRecord) => {
    if (!confirm(`Deactivate "${city.name}"? It will be hidden from all lists.`)) return;
    try {
      const res = await fetch(`/api/sales/cities/${city.id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { error('Delete failed', data.error ?? 'An error occurred.'); return; }
      success('City deactivated', `${city.name} has been deactivated.`);
      void fetchCities();
    } catch {
      error('Network error', 'Could not connect to the server.');
    }
  };

  /* ── Leads Pipeline ─────────────────────────────────────────────── */
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusRecord[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<{ open: boolean; record: LeadStatusRecord | null }>({ open: false, record: null });

  const fetchLeadStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/sales/lead-statuses');
      if (!res.ok) { error('Load failed', 'Could not load pipeline statuses.'); return; }
      const json = (await res.json()) as { data: LeadStatusRecord[] };
      setLeadStatuses(json.data ?? []);
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setPipelineLoading(false);
    }
  }, [error]);

  const handleDeleteStatus = async (s: LeadStatusRecord) => {
    if (!confirm(`Delete stage "${s.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/settings/sales/lead-statuses/${s.id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { error('Delete failed', data.error ?? 'An error occurred.'); return; }
      success('Stage deleted', `${s.name} has been deleted.`);
      void fetchLeadStatuses();
    } catch {
      error('Network error', 'Could not connect to the server.');
    }
  };

  const handleMoveSequence = async (s: LeadStatusRecord, dir: 'up' | 'down') => {
    const sorted = [...leadStatuses].sort((a, b) => a.sequence - b.sequence);
    const idx = sorted.findIndex((x) => x.id === s.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapWith = sorted[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/admin/settings/sales/lead-statuses/${s.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sequence: swapWith.sequence }),
        }),
        fetch(`/api/admin/settings/sales/lead-statuses/${swapWith.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sequence: s.sequence }),
        }),
      ]);
      void fetchLeadStatuses();
    } catch {
      error('Network error', 'Could not connect to the server.');
    }
  };

  useEffect(() => {
    void fetchSalesSettings();
    void fetchOffices();
    void fetchCities();
    void fetchLeadStatuses();
  }, [fetchSalesSettings, fetchOffices, fetchCities, fetchLeadStatuses]);

  /* â”€â”€ Shared styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const thClass = 'px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider';
  const tdClass = 'px-6 py-3.5';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-0">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage general settings, government offices, cities and the leads pipeline</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1">
            {([
              { id: 'general', label: 'General Settings', icon: <UserCheck size={18} /> },
              { id: 'offices', label: 'Government Offices', icon: <Globe size={18} /> },
              { id: 'cities', label: 'Cities', icon: <MapPin size={18} /> },
              { id: 'pipeline', label: 'Leads Pipeline', icon: <GitBranch size={18} /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── General Settings ──────────────────────────────────────────── */}
        {activeTab === 'general' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground">General Settings</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Configure default approvers for job orders and TSA contracts</p>
            </div>

            {generalLoading ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <Loader2 size={32} className="mx-auto mb-3 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Loading settings...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Job Order Approvers Card */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                    <GitBranch size={16} className="text-blue-600" />
                    Job Order Approvers
                  </h3>
                  <p className="text-xs text-muted-foreground mb-5">3-level approval workflow for job orders</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { field: 'jo_ops' as const, label: '1. Operations Manager', selected: selectedJoOpsManager },
                      { field: 'jo_account' as const, label: '2. Account Manager', selected: selectedJoAccountManager },
                      { field: 'jo_gen' as const, label: '3. General Manager', selected: selectedJoGenManager },
                    ].map(({ field, label, selected }) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                        {selected ? (
                          <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-accent">
                            {selected.image ? (
                              <Image src={selected.image} alt="" width={32} height={32} className="rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {getInitials(selected.name, selected.email)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{selected.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{selected.email}</div>
                            </div>
                            <button onClick={() => clearUser(field)} className="p-1 hover:bg-red-50 rounded" title="Remove">
                              <Trash2 size={14} className="text-red-600" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={activeSearchField === field ? userSearchQuery : ''}
                              onChange={(e) => handleUserSearchChange(e.target.value, field)}
                              onFocus={() => setActiveSearchField(field)}
                              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {activeSearchField === field && userSearchQuery && (
                              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                                {userSearchLoading ? (
                                  <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
                                ) : userSearchResults.length === 0 ? (
                                  <div className="p-3 text-sm text-muted-foreground text-center">No users found</div>
                                ) : (
                                  userSearchResults.map((u) => (
                                    <button
                                      key={u.id}
                                      onClick={() => selectUser(u, field)}
                                      className="w-full flex items-center gap-2 p-2 hover:bg-accent transition-colors text-left"
                                    >
                                      {u.image ? (
                                        <Image src={u.image} alt="" width={28} height={28} className="rounded-full" />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                          {getInitials(u.name, u.email)}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-foreground truncate">{u.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TSA Approver Card */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                    <UserCheck size={16} className="text-green-600" />
                    TSA Contract Approver
                  </h3>
                  <p className="text-xs text-muted-foreground mb-5">Single approver for Tax Service Agreement contracts</p>

                  <div className="max-w-md">
                    {selectedTsaApprover ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-accent">
                        {selectedTsaApprover.image ? (
                          <Image src={selectedTsaApprover.image} alt="" width={32} height={32} className="rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(selectedTsaApprover.name, selectedTsaApprover.email)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{selectedTsaApprover.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{selectedTsaApprover.email}</div>
                        </div>
                        <button onClick={() => clearUser('tsa')} className="p-1 hover:bg-red-50 rounded" title="Remove">
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={activeSearchField === 'tsa' ? userSearchQuery : ''}
                          onChange={(e) => handleUserSearchChange(e.target.value, 'tsa')}
                          onFocus={() => setActiveSearchField('tsa')}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        {activeSearchField === 'tsa' && userSearchQuery && (
                          <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                            {userSearchLoading ? (
                              <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
                            ) : userSearchResults.length === 0 ? (
                              <div className="p-3 text-sm text-muted-foreground text-center">No users found</div>
                            ) : (
                              userSearchResults.map((u) => (
                                <button
                                  key={u.id}
                                  onClick={() => selectUser(u, 'tsa')}
                                  className="w-full flex items-center gap-2 p-2 hover:bg-accent transition-colors text-left"
                                >
                                  {u.image ? (
                                    <Image src={u.image} alt="" width={28} height={28} className="rounded-full" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                                      {getInitials(u.name, u.email)}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">{u.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => { void handleSaveGeneralSettings(); }}
                    disabled={generalSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generalSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ Government Offices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'offices' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Government Offices</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{offices.length} office{offices.length !== 1 ? 's' : ''} registered</p>
              </div>
              <button
                onClick={() => setOfficeModal({ open: true, record: null })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                Add Office
              </button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              {officesLoading ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading offices</div>
              ) : offices.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Globe size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No government offices yet. Add one to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className={thClass}>Code</th>
                        <th className={thClass}>Name</th>
                        <th className={thClass}>Description</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {offices.map((office) => (
                        <tr key={office.id} className="hover:bg-accent transition-colors">
                          <td className={tdClass}>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold text-blue-700 dark:text-blue-800 border border-blue-200 dark:border-blue-800">
                              {office.code}
                            </span>
                          </td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-2">
                              <Globe size={14} className="text-blue-600 shrink-0" />
                              <span className="font-medium text-foreground text-sm">{office.name}</span>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <span className="text-sm text-muted-foreground">{office.description ?? '-”'}</span>
                          </td>
                          <td className={tdClass}>
                            <Badge variant={office.isActive ? 'success' : 'neutral'} className="text-[10px]">
                              {office.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setOfficeModal({ open: true, record: office })}
                                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => { void handleDeleteOffice(office); }}
                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Deactivate"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â”€â”€ Cities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'cities' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Cities &amp; Municipalities</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{cities.length} cit{cities.length !== 1 ? 'ies' : 'y'} registered</p>
              </div>
              <button
                onClick={() => setCityModal({ open: true, record: null })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                Add City
              </button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              {citiesLoading ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading citiesâ€¦</div>
              ) : cities.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <MapPin size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No cities yet. Add one to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className={thClass}>Name</th>
                        <th className={thClass}>Province</th>
                        <th className={thClass}>Region</th>
                        <th className={thClass}>ZIP</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cities.map((city) => (
                        <tr key={city.id} className="hover:bg-accent transition-colors">
                          <td className={tdClass}>
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-blue-600 shrink-0" />
                              <span className="font-medium text-foreground text-sm">{city.name}</span>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <span className="text-sm text-muted-foreground">{city.province ?? 'â€”'}</span>
                          </td>
                          <td className={tdClass}>
                            <Badge variant="neutral" className="text-[10px]">{city.region ?? 'â€”'}</Badge>
                          </td>
                          <td className={tdClass}>
                            <span className="text-sm text-muted-foreground font-mono">{city.zipCode ?? 'â€”'}</span>
                          </td>
                          <td className={tdClass}>
                            <Badge variant={city.isActive ? 'success' : 'neutral'} className="text-[10px]">
                              {city.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setCityModal({ open: true, record: city })}
                                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => { void handleDeleteCity(city); }}
                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Deactivate"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

        {/* ── Leads Pipeline ─────────────────────────────────────────── */}
        {activeTab === 'pipeline' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Leads Pipeline</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{leadStatuses.length} stage{leadStatuses.length !== 1 ? 's' : ''} in the workflow</p>
              </div>
              <button
                onClick={() => setStatusModal({ open: true, record: null })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                Add Stage
              </button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              {pipelineLoading ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading pipeline…</div>
              ) : leadStatuses.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <GitBranch size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No pipeline stages yet. Add the first one.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className={thClass}>Order</th>
                        <th className={thClass}>Stage</th>
                        <th className={thClass}>Flags</th>
                        <th className={thClass}>Leads</th>
                        <th className={`${thClass} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...leadStatuses].sort((a, b) => a.sequence - b.sequence).map((s, idx, arr) => (
                        <tr key={s.id} className="hover:bg-accent transition-colors">
                          <td className={tdClass}>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { void handleMoveSequence(s, 'up'); }}
                                disabled={idx === 0}
                                className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <span className="text-xs font-mono font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                              <button
                                onClick={() => { void handleMoveSequence(s, 'down'); }}
                                disabled={idx === arr.length - 1}
                                className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: s.color ?? '#64748b' }}
                              />
                              <span className="font-medium text-foreground text-sm">{s.name}</span>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {s.isDefault && <Badge variant="info" className="text-[10px]">Default</Badge>}
                              {s.isOnboarding && <Badge variant="warning" className="text-[10px]">Onboarding</Badge>}
                              {s.isConverted && <Badge variant="success" className="text-[10px]">Converts</Badge>}
                              {!s.isDefault && !s.isOnboarding && !s.isConverted && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                          <td className={tdClass}>
                            <span className="text-sm font-medium text-foreground">{s._count?.leads ?? 0}</span>
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setStatusModal({ open: true, record: s })}
                                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => { void handleDeleteStatus(s); }}
                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Modals */}
      <GovernmentOfficeModal
        isOpen={officeModal.open}
        onClose={() => setOfficeModal({ open: false, record: null })}
        onSaved={() => { setOfficeModal({ open: false, record: null }); void fetchOffices(); }}
        office={officeModal.record}
      />
      <CityModal
        isOpen={cityModal.open}
        onClose={() => setCityModal({ open: false, record: null })}
        onSaved={() => { setCityModal({ open: false, record: null }); void fetchCities(); }}
        city={cityModal.record}
      />
      <LeadStatusModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, record: null })}
        onSaved={() => { setStatusModal({ open: false, record: null }); void fetchLeadStatuses(); }}
        status={statusModal.record}
      />
    </div>
  );
}
