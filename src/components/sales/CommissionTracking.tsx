'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { MOCK_AGENTS } from '@/lib/constants';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { Client } from '@/lib/types';
import {
  TrendingUp, Calendar, DollarSign, Zap, ShoppingBag,
  CheckCircle, AlertCircle, Clock,
} from 'lucide-react';

interface CommissionBreakdown {
  clients: Client[];
  instant: { qualified: number; pending: number };
  recurring: { qualified: number; pending: number };
  upsell: { qualified: number; pending: number };
  totalQualified: number;
  totalPending: number;
}

interface AgentWithCommission {
  id: string;
  name: string;
  type: string;
  email: string;
  contact: string;
  role: string;
  totalQualified: number;
  totalPending: number;
  clients: Client[];
  instant: { qualified: number; pending: number };
  recurring: { qualified: number; pending: number };
  upsell: { qualified: number; pending: number };
  commission: {
    instant: number;
    recurring: number;
    upsell: number;
    total: number;
  };
}

export const CommissionTracking: React.FC = () => {
  const agents = MOCK_AGENTS;
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithCommission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedPayoutAgent, setSelectedPayoutAgent] = useState<AgentWithCommission | null>(null);

  const calculateCommissions = (agent: typeof agents[number]): CommissionBreakdown => {
    const agentClients = clients.filter(c => c.agentId === agent.id);

    let instantQualified = 0;
    let instantPending = 0;
    let recurringQualified = 0;
    let recurringPending = 0;
    let upsellQualified = 0;
    let upsellPending = 0;

    agentClients.forEach(client => {
      if (client.isPaid && !client.commissionPaid) {
        instantQualified += client.finalAmount * 0.10;
      } else if (!client.isPaid) {
        instantPending += client.finalAmount * 0.10;
      }

      if (client.isPaid && client.status === 'Active') {
        recurringQualified += client.finalAmount * 0.03;
      } else if (!client.isPaid || client.status !== 'Active') {
        recurringPending += client.finalAmount * 0.03;
      }

      if (client.hasUpsell) {
        const upsellAmount = (client.upsellAmount || 0) * 0.05;
        if (client.isPaid && !client.commissionPaid) {
          upsellQualified += upsellAmount;
        } else if (!client.isPaid) {
          upsellPending += upsellAmount;
        }
      }
    });

    return {
      instant: { qualified: instantQualified, pending: instantPending },
      recurring: { qualified: recurringQualified, pending: recurringPending },
      upsell: { qualified: upsellQualified, pending: upsellPending },
      totalQualified: instantQualified + recurringQualified + upsellQualified,
      totalPending: instantPending + recurringPending + upsellPending,
      clients: agentClients,
    };
  };

  const openDetails = (agent: typeof agents[number]) => {
    const commissions = calculateCommissions(agent);
    setSelectedAgent({
      ...agent,
      clients: commissions.clients,
      instant: commissions.instant,
      recurring: commissions.recurring,
      upsell: commissions.upsell,
      totalQualified: commissions.totalQualified,
      totalPending: commissions.totalPending,
      commission: {
        instant: commissions.instant.qualified + commissions.instant.pending,
        recurring: commissions.recurring.qualified + commissions.recurring.pending,
        upsell: commissions.upsell.qualified + commissions.upsell.pending,
        total: commissions.totalQualified + commissions.totalPending,
      },
    });
    setIsDetailsOpen(true);
  };

  const handleMarkAsPaid = (agentId: string) => {
    if (!window.confirm('Are you sure you want to mark all qualified commissions as paid for this agent?')) {
      return;
    }

    setClients(prev =>
      prev.map(c =>
        c.agentId === agentId && c.isPaid && !c.commissionPaid
          ? { ...c, commissionPaid: true }
          : c
      )
    );
    setIsPayoutModalOpen(false);
  };

  const openPayoutModal = (agent: typeof agents[number]) => {
    const breakdown = calculateCommissions(agent);
    setSelectedPayoutAgent({
      ...agent,
      clients: breakdown.clients,
      instant: breakdown.instant,
      recurring: breakdown.recurring,
      upsell: breakdown.upsell,
      totalQualified: breakdown.totalQualified,
      totalPending: breakdown.totalPending,
      commission: {
        instant: breakdown.instant.qualified + breakdown.instant.pending,
        recurring: breakdown.recurring.qualified + breakdown.recurring.pending,
        upsell: breakdown.upsell.qualified + breakdown.upsell.pending,
        total: breakdown.totalQualified + breakdown.totalPending,
      },
    });
    setIsPayoutModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Agent Commission Engine</h2>
          <p className="text-sm text-slate-500">Tracking Referral, Instant (10%), and Recurring (3%) payouts.</p>
        </div>
        <Button className="bg-slate-900 text-white">
          <Calendar size={16} className="mr-2" /> Monthly Payout Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Qualified for Payout',
            value: `₱${agents.reduce((sum, a) => sum + calculateCommissions(a).totalQualified, 0).toFixed(2)}`,
            icon: <CheckCircle className="text-emerald-600" />,
            color: 'bg-emerald-50',
            description: 'Client paid & active',
          },
          {
            label: 'Pending Payment',
            value: `₱${agents.reduce((sum, a) => sum + calculateCommissions(a).totalPending, 0).toFixed(2)}`,
            icon: <Clock className="text-amber-600" />,
            color: 'bg-amber-50',
            description: 'Awaiting client payment',
          },
          {
            label: 'Active Monthly (3%)',
            value: `₱${agents.reduce((sum, a) => sum + calculateCommissions(a).recurring.qualified, 0).toFixed(2)}`,
            icon: <TrendingUp className="text-blue-600" />,
            color: 'bg-blue-50',
            description: 'Active clients only',
          },
          {
            label: 'Total Agents',
            value: agents.length.toString(),
            icon: <DollarSign className="text-purple-600" />,
            color: 'bg-purple-50',
            description: 'All agents',
          },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-none shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} p-3 rounded-xl`}>{stat.icon}</div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2">{stat.description}</p>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-5">Agent</th>
                <th className="p-5">Type</th>
                <th className="p-5 text-center">Active Clients</th>
                <th className="p-5 text-right">Qualified Amount</th>
                <th className="p-5 text-right">Pending Amount</th>
                <th className="p-5">Status</th>
                <th className="p-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map(agent => {
                const breakdown = calculateCommissions(agent);
                const activeClients = clients.filter(
                  c => c.agentId === agent.id && c.status === 'Active' && c.isPaid
                ).length;

                return (
                  <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{agent.name}</p>
                          <p className="text-[10px] text-slate-400">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <Badge variant={agent.type === 'INTERNAL' ? 'info' : 'warning'}>
                        {agent.type}
                      </Badge>
                    </td>
                    <td className="p-5 text-center">
                      <span className="font-bold text-slate-800">{activeClients}</span>
                    </td>
                    <td className="p-5 text-right">
                      <span className="font-black text-lg text-emerald-600">
                        ₱{breakdown.totalQualified.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <span className="font-bold text-amber-600">
                        ₱{breakdown.totalPending.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-5">
                      {breakdown.totalQualified > 0 ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle size={12} />
                          Ready for Payout
                        </Badge>
                      ) : (
                        <Badge variant="neutral">No Qualified Amount</Badge>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openDetails(agent)}>
                          View Details
                        </Button>
                        {breakdown.totalQualified > 0 && (
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => openPayoutModal(agent)}
                          >
                            Process Payout
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payout Modal */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title="Process Commission Payout"
        size="lg"
      >
        <div className="p-5 space-y-5">
          {selectedPayoutAgent && (
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Important</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Only commissions from clients who have already paid will be processed.
                      Recurring commissions require ACTIVE status.
                    </p>
                  </div>
                </div>
              </div>

              <Card className="p-6 bg-slate-50">
                <h4 className="font-bold text-slate-800 mb-4">
                  Payout Summary for {selectedPayoutAgent.name}
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-yellow-600" />
                      <span className="text-sm font-bold">Instant Commission (10%)</span>
                    </div>
                    <span className="font-black text-yellow-600">
                      ₱{selectedPayoutAgent.instant.qualified.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-600" />
                      <span className="text-sm font-bold">Recurring Commission (3%)</span>
                    </div>
                    <span className="font-black text-blue-600">
                      ₱{selectedPayoutAgent.recurring.qualified.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={16} className="text-purple-600" />
                      <span className="text-sm font-bold">Upsell Commission (5%)</span>
                    </div>
                    <span className="font-black text-purple-600">
                      ₱{selectedPayoutAgent.upsell.qualified.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t-2 border-slate-200 pt-3 mt-3">
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                      <span className="text-base font-black text-slate-800">Total Payout</span>
                      <span className="text-2xl font-black text-emerald-600">
                        ₱{selectedPayoutAgent.totalQualified.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Qualification Criteria Met:</strong><br />
                    ✓ All clients have paid their invoices<br />
                    ✓ Recurring commissions are from ACTIVE clients only<br />
                    ✓ Commission has not been paid previously
                  </p>
                </div>
              </Card>

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsPayoutModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleMarkAsPaid(selectedPayoutAgent.id)}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Mark as Paid
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedAgent ? `${selectedAgent.name} - Commission Details` : ''}
      >
        <div className="p-5 space-y-5">
          {selectedAgent && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-1">Instant (10%)</p>
                  <p className="text-xl font-black text-yellow-600">₱{selectedAgent.commission.instant.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Recurring (3%)</p>
                  <p className="text-xl font-black text-blue-600">₱{selectedAgent.commission.recurring.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                  <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1">Upsell (5%)</p>
                  <p className="text-xl font-black text-purple-600">₱{selectedAgent.commission.upsell.toFixed(2)}</p>
                </div>
              </div>

              {selectedAgent.commission.total > 0 && (
                <div className="p-6 bg-linear-to-r from-emerald-500 to-teal-500 rounded-2xl text-white">
                  <p className="text-sm font-bold mb-2">Total Commission Balance</p>
                  <p className="text-4xl font-black">₱{selectedAgent.commission.total.toFixed(2)}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <p className="text-white/70 mb-1">Qualified</p>
                      <p className="font-bold">₱{selectedAgent.totalQualified.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg">
                      <p className="text-white/70 mb-1">Pending</p>
                      <p className="font-bold">₱{selectedAgent.totalPending.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-5">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Client Breakdown</h4>
                {selectedAgent.clients.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedAgent.clients.map(client => {
                      const hasInstantCommission = client.isPaid && !client.commissionPaid;
                      const hasRecurringCommission = client.isPaid && client.status === 'Active';
                      const hasUpsellCommission = client.hasUpsell && client.isPaid && !client.commissionPaid;

                      return (
                        <div key={client.id} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-slate-900">{client.businessName}</p>
                              <p className="text-xs text-slate-500">{client.clientNo}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={client.isPaid ? 'success' : 'warning'}>
                                {client.isPaid ? 'Paid' : 'Pending'}
                              </Badge>
                              <Badge variant={client.status === 'Active' ? 'success' : 'neutral'}>
                                {client.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200 space-y-2">
                            {hasInstantCommission && (
                              <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Zap size={12} className="text-yellow-600" />
                                  <span className="text-xs font-bold text-yellow-700">Instant (10%) - Qualified</span>
                                </div>
                                <span className="text-sm font-black text-yellow-600">
                                  ₱{(client.finalAmount * 0.10).toFixed(2)}
                                </span>
                              </div>
                            )}

                            {!hasInstantCommission && !client.isPaid && (
                              <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-100 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Clock size={12} className="text-amber-600" />
                                  <span className="text-xs font-bold text-amber-700">Instant (10%) - Pending Payment</span>
                                </div>
                                <span className="text-sm font-black text-amber-600">
                                  ₱{(client.finalAmount * 0.10).toFixed(2)}
                                </span>
                              </div>
                            )}

                            {hasRecurringCommission && (
                              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <TrendingUp size={12} className="text-blue-600" />
                                  <span className="text-xs font-bold text-blue-700">Recurring (3%) - Qualified</span>
                                </div>
                                <span className="text-sm font-black text-blue-600">
                                  ₱{(client.finalAmount * 0.03).toFixed(2)}
                                </span>
                              </div>
                            )}

                            {!hasRecurringCommission && client.isPaid && client.status !== 'Active' && (
                              <div className="flex items-center justify-between p-2 bg-slate-100 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={12} className="text-slate-600" />
                                  <span className="text-xs font-bold text-slate-700">Recurring (3%) - Not Active</span>
                                </div>
                                <span className="text-sm font-black text-slate-600">
                                  ₱{(client.finalAmount * 0.03).toFixed(2)}
                                </span>
                              </div>
                            )}

                            {hasUpsellCommission && (
                              <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-100 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <ShoppingBag size={12} className="text-purple-600" />
                                  <span className="text-xs font-bold text-purple-700">Upsell (5%) - Qualified</span>
                                </div>
                                <span className="text-sm font-black text-purple-600">
                                  ₱{((client.upsellAmount || 0) * 0.05).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 italic py-8">No clients assigned yet.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
