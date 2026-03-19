'use client';

import React, { useState } from 'react';
import { Globe, MapPin, Plus, Trash2, Edit2, Check, X, CornerDownRight, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { Badge } from '@/components/UI/Badge';

interface Office {
  id: number;
  name: string;
  district: string;
  isSubItem?: boolean;
}

interface City {
  id: number;
  name: string;
  region: string;
}

const INITIAL_GOVERNMENT_OFFICES_CEBU: Office[] = [
  { id: 1, name: 'Bureau of Internal Revenue (BIR) — Revenue Region No. 13', district: 'Cebu City' },
  { id: 2, name: 'RDO No. 80 — North Cebu', district: 'Mandaue City', isSubItem: true },
  { id: 3, name: 'RDO No. 81 — Cebu City North', district: 'North of Cebu City', isSubItem: true },
  { id: 4, name: 'RDO No. 82 — Cebu City South', district: 'South of Cebu City', isSubItem: true },
  { id: 5, name: 'RDO No. 83 — South Cebu', district: 'Talisay City', isSubItem: true },
  { id: 6, name: 'Securities and Exchange Commission (SEC)', district: 'Cebu City' },
  { id: 7, name: 'Department of Trade and Industry (DTI)', district: 'Cebu City' },
  { id: 8, name: 'Social Security System (SSS)', district: 'Mandaue City' },
  { id: 9, name: 'Philippine Health Insurance Corporation (PhilHealth)', district: 'Cebu City' },
  { id: 10, name: 'Home Development Mutual Fund (Pag-IBIG)', district: 'Cebu City' },
  { id: 11, name: 'City Assessor Office', district: 'Cebu City' },
  { id: 12, name: 'City Treasurer Office', district: 'Cebu City' },
];

const INITIAL_CITIES_CEBU: City[] = [
  { id: 1, name: 'Cebu City', region: 'Central Visayas' },
  { id: 2, name: 'Lapu-Lapu City', region: 'Central Visayas' },
  { id: 3, name: 'Mandaue City', region: 'Central Visayas' },
  { id: 4, name: 'Talisay City', region: 'Central Visayas' },
  { id: 5, name: 'Lapu-Lapu City', region: 'Central Visayas' },
];

export function ASPSettings() {
  const [activeTab, setActiveTab] = useState<'offices' | 'cities'>('offices');
  const [offices, setOffices] = useState<Office[]>(INITIAL_GOVERNMENT_OFFICES_CEBU);
  const [cities, setCities] = useState<City[]>(INITIAL_CITIES_CEBU);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [rdoExpanded, setRdoExpanded] = useState(false);

  const startEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveEdit = (id: number) => {
    if (activeTab === 'offices') {
      setOffices(offices.map(o => o.id === id ? { ...o, name: editingName } : o));
    } else {
      setCities(cities.map(c => c.id === id ? { ...c, name: editingName } : c));
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const deleteItem = (id: number) => {
    if (activeTab === 'offices') {
      setOffices(offices.filter(o => o.id !== id));
    } else {
      setCities(cities.filter(c => c.id !== id));
    }
  };

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
              <p className="text-sm text-muted-foreground">Manage government offices and cities in Cebu</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('offices')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'offices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <Globe size={18} />
              Government Offices
            </button>
            <button
              onClick={() => setActiveTab('cities')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'cities'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <MapPin size={18} />
              Cities
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'offices' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Government Offices of Cebu</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{offices.length} offices registered</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm">
                <Plus size={16} />
                Add Office
              </button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">District</th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {offices.map((office) => {
                      if (office.isSubItem && !rdoExpanded) return null;
                      const isBIR = office.id === 1;
                      return (
                      <tr
                        key={office.id}
                        className={`transition-colors bg-white ${
                          office.isSubItem
                            ? 'hover:bg-blue-50/70 dark:hover:bg-blue-950/20 text-[#111111]'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <td className="px-6 py-3.5">
                          {editingId === office.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full px-3 py-1.5 border border-ring rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground text-sm"
                              autoFocus
                            />
                          ) : (
                            <div className={`flex items-center gap-2 ${office.isSubItem ? 'pl-6' : ''}`}>
                              {office.isSubItem ? (
                                <CornerDownRight size={14} className="text-blue-400 shrink-0" />
                              ) : (
                                <Globe size={15} className="text-blue-600 shrink-0" />
                              )}
                              <span className={`${office.isSubItem ? 'text-sm text-muted-foreground' : 'font-medium text-foreground'}`}>
                                {office.name}
                              </span>
                              {isBIR && (
                                <button
                                  onClick={() => setRdoExpanded(v => !v)}
                                  className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-blue-600 bg-white dark:bg-white hover:bg-blue-100 dark:hover:bg-blue-100 transition-colors border border-blue-200"
                                >
                                  {rdoExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  RDOs
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant={office.isSubItem ? 'info' : 'neutral'} className="text-[10px]">
                            {office.district}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {editingId === office.id ? (
                              <>
                                <button
                                  onClick={() => saveEdit(office.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all"
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 text-muted-foreground hover:bg-accent rounded-lg transition-all"
                                >
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(office.id, office.name)}
                                  className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => deleteItem(office.id)}
                                  className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cities' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Cities in Cebu</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{cities.length} cities registered</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm">
                <Plus size={16} />
                Add City
              </button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Region</th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cities.map((city) => (
                      <tr key={city.id} className="hover:bg-accent transition-colors">
                        <td className="px-6 py-3.5">
                          {editingId === city.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full px-3 py-1.5 border border-ring rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground text-sm"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <MapPin size={15} className="text-blue-600 shrink-0" />
                              <span className="font-medium text-foreground">{city.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral" className="text-[10px]">
                            {city.region}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {editingId === city.id ? (
                              <>
                                <button
                                  onClick={() => saveEdit(city.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all"
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 text-muted-foreground hover:bg-accent rounded-lg transition-all"
                                >
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(city.id, city.name)}
                                  className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => deleteItem(city.id)}
                                  className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
