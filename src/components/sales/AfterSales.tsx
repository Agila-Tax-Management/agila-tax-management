'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Badge } from '@/components/UI/Badge';
import {
  Mail, ExternalLink, Copy, Check,
  Filter, Calendar, Users, Send, Info, CheckSquare, Square,
} from 'lucide-react';
import type { Client } from '@/lib/types';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';

export const AfterSales: React.FC = () => {
  const [clients] = useState<Client[]>(INITIAL_CLIENTS);
  const [gformLink, setGformLink] = useState('');
  const [tenureFilter, setTenureFilter] = useState<'1' | '5' | 'all' | 'custom'>('all');
  const [copied, setCopied] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());

  const lastUpdated = useMemo(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${now.getFullYear()}`;
  }, []);

  const calculateTenureMonths = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (client.status !== 'Active') return false;
      const months = calculateTenureMonths(client.createdAt);
      if (tenureFilter === '1') return months >= 1;
      if (tenureFilter === '5') return months >= 5;
      return true;
    });
  }, [clients, tenureFilter]);

  const eligibleClients = useMemo(() => {
    if (tenureFilter === 'custom') {
      return filteredClients.filter(c => selectedClientIds.has(c.id));
    }
    return filteredClients;
  }, [filteredClients, tenureFilter, selectedClientIds]);

  const allEmails = useMemo(() => {
    return eligibleClients.map(c => c.email).join('; ');
  }, [eligibleClients]);

  const handleCopyEmails = () => {
    navigator.clipboard.writeText(allEmails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenForm = () => {
    if (gformLink) {
      window.open(gformLink, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleClientSelection = (clientId: string) => {
    const newSelected = new Set(selectedClientIds);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClientIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedClientIds.size === filteredClients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(filteredClients.map(c => c.id)));
    }
  };

  const handleTenureFilterChange = (filter: '1' | '5' | 'all' | 'custom') => {
    setTenureFilter(filter);
    if (filter !== 'custom') {
      setSelectedClientIds(new Set());
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">After-Sales Service Hub</h2>
          <p className="text-sm text-slate-500 font-medium">Manage client satisfaction surveys and tenure-based follow-ups.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="info" className="px-3 py-1.5 border border-blue-100 text-blue-600 bg-blue-50/50">
            <Users size={14} className="mr-1.5" /> {eligibleClients.length} Clients Selected
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="p-6 lg:col-span-1 space-y-6 border-slate-200 shadow-sm">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Survey Configuration</label>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">Google Form Link</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://docs.google.com/forms/..."
                    value={gformLink}
                    onChange={(e) => setGformLink(e.target.value)}
                    className="text-xs h-10 rounded-xl"
                  />
                  <Button
                    variant="outline"
                    className="shrink-0 rounded-xl h-10 w-10 p-0"
                    onClick={handleOpenForm}
                    disabled={!gformLink}
                  >
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">Tenure Filter</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: '1', label: '1 Mo+' },
                    { id: '5', label: '5 Mo+' },
                    { id: 'custom', label: 'Custom' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleTenureFilterChange(opt.id as '1' | '5' | 'all' | 'custom')}
                      className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${
                        tenureFilter === opt.id
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {tenureFilter === 'custom' && (
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    ✓ Check individual clients from the list to customize your selection
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk Actions</span>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full justify-start h-11 rounded-xl font-bold text-xs"
                variant="outline"
                onClick={handleCopyEmails}
                disabled={eligibleClients.length === 0}
              >
                {copied ? <Check size={14} className="mr-2 text-emerald-500" /> : <Copy size={14} className="mr-2" />}
                {copied ? 'Emails Copied!' : 'Copy All Emails'}
              </Button>
              <Button
                className="w-full justify-start h-11 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700"
                disabled={!gformLink || eligibleClients.length === 0}
                onClick={() => alert(`Survey will be sent to ${eligibleClients.length} clients with form: ${gformLink}`)}
              >
                <Send size={14} className="mr-2" />
                Send Survey Blast
              </Button>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="flex gap-3">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
                Gathering emails based on tenure ensures you&apos;re asking for feedback at the right milestones (Onboarding vs. Long-term).
              </p>
            </div>
          </div>
        </Card>

        {/* Client List Panel */}
        <Card className="p-0 lg:col-span-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Mail size={18} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Target Recipients</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {tenureFilter === 'all'
                  ? `Showing All Clients (${filteredClients.length})`
                  : tenureFilter === 'custom'
                  ? 'Custom Selection Mode'
                  : `Filtered: ${tenureFilter === '1' ? '1+ Month' : '5+ Months'} Tenure (${filteredClients.length})`}
              </div>
              {tenureFilter === 'custom' && filteredClients.length > 0 && (
                <Button
                  variant="outline"
                  className="h-8 text-xs font-bold"
                  onClick={toggleSelectAll}
                >
                  {selectedClientIds.size === filteredClients.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-125 no-scrollbar">
            {filteredClients.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {tenureFilter === 'custom' && (
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">
                        <button
                          onClick={toggleSelectAll}
                          className="hover:opacity-70 transition-opacity"
                        >
                          {selectedClientIds.size === filteredClients.length ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} className="text-slate-400" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenure</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredClients.map((client) => {
                    const months = calculateTenureMonths(client.createdAt);
                    const isSelected = selectedClientIds.has(client.id);

                    return (
                      <tr
                        key={client.id}
                        className={`hover:bg-slate-50/80 transition-colors group ${
                          tenureFilter === 'custom' && isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {tenureFilter === 'custom' && (
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleClientSelection(client.id)}
                              className="hover:opacity-70 transition-opacity"
                            >
                              {isSelected ? (
                                <CheckSquare size={18} className="text-blue-600" />
                              ) : (
                                <Square size={18} className="text-slate-300" />
                              )}
                            </button>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{client.businessName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Client No: {client.clientNo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-600">{client.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="info" className="text-[10px] font-bold">
                            {months} {months === 1 ? 'Month' : 'Months'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              navigator.clipboard.writeText(client.email);
                            }}
                          >
                            <Copy size={14} className="text-slate-400" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter size={32} />
                </div>
                <h4 className="text-slate-800 font-bold">No clients found</h4>
                <p className="text-slate-400 text-xs mt-1">
                  {clients.length === 0
                    ? 'No clients have been turned over yet.'
                    : 'Try changing the tenure filter or check your client status settings.'}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <Calendar size={12} />
                <span>Last updated: {lastUpdated}</span>
              </div>
              {tenureFilter === 'custom' && (
                <Badge variant="info" className="text-[10px]">
                  {selectedClientIds.size} of {filteredClients.length} selected
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
