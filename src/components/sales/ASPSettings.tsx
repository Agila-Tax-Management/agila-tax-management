// src/components/sales/ASPSettings.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Globe, MapPin, Plus, Trash2, Edit2, Settings, GitBranch, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
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

export function ASPSettings(): React.ReactNode {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'offices' | 'cities' | 'pipeline'>('offices');

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
    void fetchOffices();
    void fetchCities();
    void fetchLeadStatuses();
  }, [fetchOffices, fetchCities, fetchLeadStatuses]);

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
              <p className="text-sm text-muted-foreground">Manage government offices, cities and the leads pipeline</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1">
            {([
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
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading officesâ€¦</div>
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
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
                            <span className="text-sm text-muted-foreground">{office.description ?? 'â€”'}</span>
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
                                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => { void handleDeleteOffice(office); }}
                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
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
                                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => { void handleDeleteCity(city); }}
                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
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
                                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => { void handleDeleteStatus(s); }}
                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
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
