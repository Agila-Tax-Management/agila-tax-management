// src/app/(portal)/portal/sales/lead-center/components/CreateJobOrderModal.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Briefcase, Phone, User } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { Lead } from './lead-types';

interface CreateJobOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onCreated: (updatedLead: Lead) => void;
}

export function CreateJobOrderModal({ isOpen, onClose, lead, onCreated }: CreateJobOrderModalProps): React.ReactNode {
  const { success, error } = useToast();
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}/job-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() || null }),
      });
      const data = (await res.json()) as { data?: Lead; error?: string };
      if (!res.ok) {
        error('Failed to create job order', data.error ?? 'Please try again.');
        return;
      }
      success('Job Order Created', `Job order has been generated for ${lead.firstName} ${lead.lastName}.`);
      onCreated(data.data!);
      router.push('/portal/sales/job-orders');
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const allServices = [
    ...lead.servicePlans.map((p) => ({ name: p.name, rate: p.serviceRate, type: 'Recurring' as const })),
    ...lead.serviceOneTimePlans.map((s) => ({ name: s.name, rate: s.serviceRate, type: 'One-Time' as const })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Job Order" size="lg">
      <div className="space-y-5 p-4">
        {/* Lead Info */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <User size={14} className="text-violet-600 shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              {lead.firstName} {lead.lastName}
            </span>
          </div>
          {lead.businessName && (
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">{lead.businessName}</span>
            </div>
          )}
          {lead.contactNumber && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">{lead.contactNumber}</span>
            </div>
          )}
        </div>

        {/* Services to include */}
        {allServices.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
              Services Included
            </h4>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground">Service</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-muted-foreground">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allServices.map((svc, i) => (
                    <tr key={i} className="bg-card">
                      <td className="px-4 py-2.5 text-foreground font-medium">{svc.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                          svc.type === 'Recurring'
                            ? 'bg-blue-100 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:text-purple-400'
                        }`}>
                          {svc.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-foreground">
                        ₱{Number(svc.rate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Notes <span className="font-normal">(optional)</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[80px] resize-none"
            placeholder="Any special instructions or remarks for the operations team..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => { void handleSubmit(); }}
            disabled={submitting}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {submitting
              ? <><Loader2 size={14} className="animate-spin mr-2" /> Creating...</>
              : <><FileText size={14} className="mr-2" /> Create Job Order</>
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
}
