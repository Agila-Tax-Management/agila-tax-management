'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Input } from '@/components/UI/Input';
import { TaskDetailsModal } from './TaskDetailsModal';
import {
  Search, LayoutGrid, LayoutList, Building2,
  Mail, User, ClipboardList,
  CheckCircle2, Clock, AlertTriangle, X, ChevronRight,
} from 'lucide-react';
import { INITIAL_AO_TASKS, AO_TEAM_MEMBERS } from '@/lib/mock-ao-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTask, AOTaskStatus, Client } from '@/lib/types';

type ClientViewMode = 'card' | 'list';

const STATUS_CONFIG: Record<AOTaskStatus, { variant: 'neutral' | 'info' | 'warning' | 'success'; color: string }> = {
  'To Do': { variant: 'neutral', color: 'bg-slate-500' },
  'In Progress': { variant: 'info', color: 'bg-blue-500' },
  'Review': { variant: 'warning', color: 'bg-amber-500' },
  'Done': { variant: 'success', color: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<string, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low: { variant: 'neutral' },
  Medium: { variant: 'info' },
  High: { variant: 'warning' },
  Urgent: { variant: 'danger' },
};

export function AOClientList() {
  const [tasks, setTasks] = useState<AOTask[]>(INITIAL_AO_TASKS);
  const [viewMode, setViewMode] = useState<ClientViewMode>('card');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTask, setSelectedTask] = useState<AOTask | null>(null);

  const clients = INITIAL_CLIENTS;

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = search === '' ||
        c.businessName.toLowerCase().includes(search.toLowerCase()) ||
        c.authorizedRep.toLowerCase().includes(search.toLowerCase()) ||
        c.clientNo.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [clients, search, filterStatus]);

  const getClientTasks = (clientId: string) =>
    tasks.filter(t => t.clientId === clientId);

  const getAssigneeName = (assigneeId: string) =>
    AO_TEAM_MEMBERS.find(m => m.id === assigneeId)?.name ?? 'Unassigned';

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

  const getTaskSummary = (clientId: string) => {
    const clientTasks = getClientTasks(clientId);
    const total = clientTasks.length;
    const done = clientTasks.filter(t => t.status === 'Done').length;
    const overdue = clientTasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date('2026-03-11')).length;
    return { total, done, overdue, active: total - done };
  };

  const handleUpdateTask = (updated: AOTask) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Clients</h2>
          <p className="text-sm text-slate-500 font-medium">View client projects and associated tasks.</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'card' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            <LayoutGrid size={14} className="inline mr-1" /> Cards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            <LayoutList size={14} className="inline mr-1" /> List
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#25238e]"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </Card>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => {
            const summary = getTaskSummary(client.id);
            return (
              <Card
                key={client.id}
                className="p-5 border-none shadow-sm hover:shadow-md cursor-pointer transition-all group"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-[#25238e] rounded-xl flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{client.businessName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold">{client.clientNo}</p>
                    </div>
                  </div>
                  <Badge variant={client.status === 'Active' ? 'success' : client.status === 'Pending' ? 'warning' : 'danger'} className="text-[9px] shrink-0">
                    {client.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 mb-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5"><User size={12} /> {client.authorizedRep}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail size={12} /> {client.email}</p>
                </div>

                {client.planDetails && (
                  <div className="mb-4">
                    <Badge variant="info" className="text-[9px]">{client.planDetails.displayName}</Badge>
                  </div>
                )}

                {/* Task Summary Bar */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks</span>
                    <span className="text-xs font-bold text-slate-600">{summary.done}/{summary.total}</span>
                  </div>
                  {summary.total > 0 && (
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${summary.total > 0 ? (summary.done / summary.total) * 100 : 0}%` }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {summary.active > 0 && (
                      <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5"><Clock size={10} /> {summary.active} active</span>
                    )}
                    {summary.overdue > 0 && (
                      <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> {summary.overdue} overdue</span>
                    )}
                    {summary.done > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 size={10} /> {summary.done} done</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_140px_100px_120px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Client</span>
            <span>Plan</span>
            <span>Contact</span>
            <span>Status</span>
            <span>Tasks</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredClients.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400 font-medium">No clients match your search.</div>
            )}
            {filteredClients.map(client => {
              const summary = getTaskSummary(client.id);
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="grid grid-cols-[1fr_120px_140px_100px_120px] gap-4 px-6 py-4 items-center hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-[#25238e] rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{client.businessName}</p>
                      <p className="text-[10px] text-slate-400">{client.clientNo}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 truncate">{client.planDetails?.displayName ?? '—'}</span>
                  <span className="text-xs text-slate-500 truncate">{client.authorizedRep}</span>
                  <Badge variant={client.status === 'Active' ? 'success' : client.status === 'Pending' ? 'warning' : 'danger'} className="text-[9px] w-fit">
                    {client.status}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">{summary.done}/{summary.total}</span>
                    {summary.overdue > 0 && (
                      <Badge variant="danger" className="text-[8px]">{summary.overdue} late</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Client Tasks Modal (Global modal) */}
      {selectedClient && !selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedClient(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#25238e] rounded-xl flex items-center justify-center">
                  <Building2 size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedClient.businessName}</h2>
                  <p className="text-xs text-slate-500">{selectedClient.clientNo} • {selectedClient.authorizedRep}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: Client Info */}
              <div className="w-72 p-6 border-r border-slate-100 overflow-y-auto shrink-0">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Client Information</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">Status</p>
                    <Badge variant={selectedClient.status === 'Active' ? 'success' : selectedClient.status === 'Pending' ? 'warning' : 'danger'}>
                      {selectedClient.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">Email</p>
                    <p className="text-xs text-slate-700 font-medium">{selectedClient.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">Phone</p>
                    <p className="text-xs text-slate-700 font-medium">{selectedClient.phone}</p>
                  </div>
                  {selectedClient.planDetails && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Plan</p>
                      <Badge variant="info">{selectedClient.planDetails.displayName}</Badge>
                      <p className="text-xs text-slate-600 font-bold mt-1">₱{selectedClient.planDetails.customPrice}/mo</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">Company Code</p>
                    <p className="text-xs text-slate-700 font-medium">{selectedClient.companyCode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">Since</p>
                    <p className="text-xs text-slate-700 font-medium">{formatDate(selectedClient.createdAt)}</p>
                  </div>

                  {selectedClient.clientServices.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-2">Services</p>
                      <div className="space-y-1">
                        {selectedClient.clientServices.map(svc => (
                          <p key={svc.id} className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg">{svc.serviceName}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Task List */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-[#25238e]" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      Tasks for {selectedClient.businessName}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{getClientTasks(selectedClient.id).length} tasks</span>
                </div>

                <div className="space-y-2">
                  {getClientTasks(selectedClient.id).length === 0 && (
                    <div className="py-12 text-center text-sm text-slate-400 font-medium">No tasks assigned to this client.</div>
                  )}
                  {getClientTasks(selectedClient.id).map(task => {
                    const overdue = task.status !== 'Done' && new Date(task.dueDate) < new Date('2026-03-11');
                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_CONFIG[task.status].color}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-medium">{getAssigneeName(task.assigneeId)}</span>
                              <span className={`text-[10px] font-bold ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                Due {formatDate(task.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant={STATUS_CONFIG[task.status].variant} className="text-[9px]">{task.status}</Badge>
                          <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[9px]">{task.priority}</Badge>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details (from client view) */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
