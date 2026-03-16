'use client';

import React, { useState } from 'react';
import { Star, Plus } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

interface WorkingTimeTemplate {
  id: string;
  workingTime: string;
  workingTimeRate: string;
  company: string;
  contractsUsingIt: number;
  isFavorite: boolean;
}

const MOCK_WORKING_TIME_DATA: WorkingTimeTemplate[] = [
  {
    id: 'wt-001',
    workingTime: '08:00 AM - 05:00 PM',
    workingTimeRate: 'Regular Day Rate',
    company: 'Agila Tax Management',
    contractsUsingIt: 18,
    isFavorite: true,
  },
  {
    id: 'wt-002',
    workingTime: '09:00 AM - 06:00 PM',
    workingTimeRate: 'Flexi Day Rate',
    company: 'Agila Tax Management',
    contractsUsingIt: 9,
    isFavorite: false,
  },
  {
    id: 'wt-003',
    workingTime: '10:00 PM - 07:00 AM',
    workingTimeRate: 'Night Shift Rate',
    company: 'Agila Business Support',
    contractsUsingIt: 6,
    isFavorite: true,
  },
  {
    id: 'wt-004',
    workingTime: '07:00 AM - 04:00 PM',
    workingTimeRate: 'Field Operations Rate',
    company: 'Agila Business Support',
    contractsUsingIt: 11,
    isFavorite: false,
  },
  {
    id: 'wt-005',
    workingTime: '08:30 AM - 05:30 PM',
    workingTimeRate: 'Admin Operations Rate',
    company: 'Agila Corporate Services',
    contractsUsingIt: 7,
    isFavorite: false,
  },
];

export function WorkingSchedulesSettingsTab(): React.ReactNode {
  const { success } = useToast();
  const [rows, setRows] = useState<WorkingTimeTemplate[]>(MOCK_WORKING_TIME_DATA);
  const [filterByCompany, setFilterByCompany] = useState('all');
  const [groupBy, setGroupBy] = useState('none');
  const [favoritesFilter, setFavoritesFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkingTimeTemplate | null>(null);

  const companies = Array.from(new Set(rows.map((item) => item.company)));

  const filteredData = rows
    .filter((item) => (filterByCompany === 'all' ? true : item.company === filterByCompany))
    .filter((item) => {
      if (favoritesFilter === 'favorites') return item.isFavorite;
      if (favoritesFilter === 'non-favorites') return !item.isFavorite;
      return true;
    })
    .sort((a, b) => {
      if (groupBy === 'company') {
        return a.company.localeCompare(b.company) || a.workingTime.localeCompare(b.workingTime);
      }
      if (groupBy === 'rate') {
        return a.workingTimeRate.localeCompare(b.workingTimeRate) || a.workingTime.localeCompare(b.workingTime);
      }
      if (groupBy === 'usage') {
        return b.contractsUsingIt - a.contractsUsingIt;
      }
      return a.workingTime.localeCompare(b.workingTime);
    });

  const handleView = (row: WorkingTimeTemplate) => {
    setSelectedTemplate(row);
  };

  const handleEditFromModal = () => {
    if (!selectedTemplate) return;
    success('Edit action', `Edit flow for ${selectedTemplate.workingTime} can be connected here.`);
  };

  return (
    <Card className="p-6 sm:p-7 space-y-6">
      <div>
        <h2 className="text-lg font-black text-foreground">Working Schedules</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage working time templates assigned to employee contracts.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex items-center rounded-xl bg-muted p-1">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider bg-card text-foreground shadow-sm"
          >
            Working Time Templates
          </button>
        </div>

        <Button
          className="bg-rose-600 hover:bg-rose-700 text-white"
          onClick={() => success('Template action', 'Add working time form can be connected here.')}
        >
          <Plus size={15} className="mr-2" /> Add Working Time
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Filters
          <select
            value={filterByCompany}
            onChange={(event) => setFilterByCompany(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          >
            <option value="all">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Group By
          <select
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          >
            <option value="none">No Grouping</option>
            <option value="company">Company</option>
            <option value="rate">Working Time Rate</option>
            <option value="usage">Contracts Using It</option>
          </select>
        </label>

        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Favorites
          <select
            value={favoritesFilter}
            onChange={(event) => setFavoritesFilter(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          >
            <option value="all">All</option>
            <option value="favorites">Favorites Only</option>
            <option value="non-favorites">Non-Favorites</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full min-w-180 text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-black uppercase text-xs tracking-wider">Working Time</th>
              <th className="text-left px-4 py-3 font-black uppercase text-xs tracking-wider">Working Time Rate</th>
              <th className="text-left px-4 py-3 font-black uppercase text-xs tracking-wider">Company</th>
              <th className="text-left px-4 py-3 font-black uppercase text-xs tracking-wider">Contracts Using It</th>
              <th className="text-right px-4 py-3 font-black uppercase text-xs tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="border-t border-border/70 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <span>{item.workingTime}</span>
                    {item.isFavorite && <Star size={14} className="text-amber-500 fill-amber-500" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.workingTimeRate}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.company}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2.5 py-1 text-xs font-bold">
                    {item.contractsUsingIt}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleView(item)}
                    className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No working time templates match the selected controls.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing <span className="font-bold text-foreground">{filteredData.length}</span> template(s)
        from <span className="font-bold text-foreground">{rows.length}</span> mock records.
      </div>

      <Modal
        isOpen={selectedTemplate !== null}
        onClose={() => setSelectedTemplate(null)}
        title="Working Time Details"
        size="lg"
      >
        {selectedTemplate && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Working Time</p>
                <p className="mt-2 text-sm font-bold text-foreground">{selectedTemplate.workingTime}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Working Time Rate</p>
                <p className="mt-2 text-sm font-bold text-foreground">{selectedTemplate.workingTimeRate}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Company</p>
                <p className="mt-2 text-sm font-bold text-foreground">{selectedTemplate.company}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Contracts Using It</p>
                <p className="mt-2 text-sm font-bold text-foreground">{selectedTemplate.contractsUsingIt}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Favorite Template</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                selectedTemplate.isFavorite
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {selectedTemplate.isFavorite ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Close
              </Button>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleEditFromModal}>
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
