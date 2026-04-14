// src/app/(portal)/portal/operation/clients/[id]/components/BIREditModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { X, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface BIRInfo {
  tin: string | null;
  branchCode: string | null;
  rdoCode: string | null;
  registeredAddress: string | null;
  zipCode: string | null;
  contactNumber: string | null;
  isWithholdingAgent: boolean | null;
  withholdingCategory: string | null;
  corUrl: string | null;
}

interface BIREditModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
  birInfo: BIRInfo | null;
  onUpdated: (updated: BIRInfo) => void;
}

export function BIREditModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  birInfo,
  onUpdated,
}: BIREditModalProps) {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BIRInfo>({
    tin: birInfo?.tin ?? null,
    branchCode: birInfo?.branchCode ?? null,
    rdoCode: birInfo?.rdoCode ?? null,
    registeredAddress: birInfo?.registeredAddress ?? null,
    zipCode: birInfo?.zipCode ?? null,
    contactNumber: birInfo?.contactNumber ?? null,
    isWithholdingAgent: birInfo?.isWithholdingAgent ?? null,
    withholdingCategory: birInfo?.withholdingCategory ?? null,
    corUrl: birInfo?.corUrl ?? null,
  });

  // Reset form when modal opens with new data
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormData({
        tin: birInfo?.tin ?? null,
        branchCode: birInfo?.branchCode ?? null,
        rdoCode: birInfo?.rdoCode ?? null,
        registeredAddress: birInfo?.registeredAddress ?? null,
        zipCode: birInfo?.zipCode ?? null,
        contactNumber: birInfo?.contactNumber ?? null,
        isWithholdingAgent: birInfo?.isWithholdingAgent ?? null,
        withholdingCategory: birInfo?.withholdingCategory ?? null,
        corUrl: birInfo?.corUrl ?? null,
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/operation/clients/${clientId}/bir`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        toastError('Failed to update BIR information', json.error ?? 'An error occurred.');
        return;
      }

      const json = (await res.json()) as { data: BIRInfo };
      onUpdated(json.data);
      success('BIR information updated', `Successfully updated BIR details for ${clientName}.`);
      onClose();
    } catch {
      toastError('Failed to update BIR information', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25238e]/20 focus:border-[#25238e] transition';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Edit BIR Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{clientName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition"
          disabled={saving}
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* TIN */}
          <div>
            <label htmlFor="tin" className={labelCls}>
              TIN
            </label>
            <input
              id="tin"
              type="text"
              value={formData.tin ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, tin: e.target.value || null }))}
              className={inputCls}
              placeholder="e.g., 123-456-789-000"
            />
          </div>

          {/* Branch Code */}
          <div>
            <label htmlFor="branchCode" className={labelCls}>
              Branch Code
            </label>
            <input
              id="branchCode"
              type="text"
              value={formData.branchCode ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, branchCode: e.target.value || null }))}
              className={inputCls}
              placeholder="e.g., 00000"
            />
          </div>

          {/* RDO Code */}
          <div>
            <label htmlFor="rdoCode" className={labelCls}>
              RDO Code
            </label>
            <input
              id="rdoCode"
              type="text"
              value={formData.rdoCode ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, rdoCode: e.target.value || null }))}
              className={inputCls}
              placeholder="e.g., 050"
            />
          </div>

          {/* Registered Address */}
          <div>
            <label htmlFor="registeredAddress" className={labelCls}>
              Registered Address
            </label>
            <textarea
              id="registeredAddress"
              value={formData.registeredAddress ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, registeredAddress: e.target.value || null }))
              }
              className={inputCls}
              rows={3}
              placeholder="Full registered address as per BIR records"
            />
          </div>

          {/* Zip Code */}
          <div>
            <label htmlFor="zipCode" className={labelCls}>
              Zip Code
            </label>
            <input
              id="zipCode"
              type="text"
              value={formData.zipCode ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value || null }))}
              className={inputCls}
              placeholder="e.g., 6000"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contactNumber" className={labelCls}>
              Contact Number
            </label>
            <input
              id="contactNumber"
              type="text"
              value={formData.contactNumber ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactNumber: e.target.value || null }))
              }
              className={inputCls}
              placeholder="e.g., +63 917 123 4567"
            />
          </div>

          {/* Withholding Agent */}
          <div>
            <label className={labelCls}>Withholding Agent</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isWithholdingAgent"
                  checked={formData.isWithholdingAgent === true}
                  onChange={() => setFormData((prev) => ({ ...prev, isWithholdingAgent: true }))}
                  className="w-4 h-4 text-[#25238e] focus:ring-[#25238e]"
                />
                <span className="text-sm text-foreground">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isWithholdingAgent"
                  checked={formData.isWithholdingAgent === false}
                  onChange={() => setFormData((prev) => ({ ...prev, isWithholdingAgent: false }))}
                  className="w-4 h-4 text-[#25238e] focus:ring-[#25238e]"
                />
                <span className="text-sm text-foreground">No</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isWithholdingAgent"
                  checked={formData.isWithholdingAgent === null}
                  onChange={() => setFormData((prev) => ({ ...prev, isWithholdingAgent: null }))}
                  className="w-4 h-4 text-[#25238e] focus:ring-[#25238e]"
                />
                <span className="text-sm text-muted-foreground">N/A</span>
              </label>
            </div>
          </div>

          {/* Withholding Category */}
          <div>
            <label htmlFor="withholdingCategory" className={labelCls}>
              Withholding Category
            </label>
            <input
              id="withholdingCategory"
              type="text"
              value={formData.withholdingCategory ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, withholdingCategory: e.target.value || null }))
              }
              className={inputCls}
              placeholder="e.g., Expanded Withholding Tax"
            />
          </div>

          {/* COR URL */}
          <div>
            <label htmlFor="corUrl" className={labelCls}>
              Certificate of Registration (COR) URL
            </label>
            <input
              id="corUrl"
              type="url"
              value={formData.corUrl ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, corUrl: e.target.value || null }))}
              className={inputCls}
              placeholder="https://..."
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Link to the BIR Certificate of Registration document (e.g., cloud storage link).
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 text-sm font-bold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#25238e] hover:bg-[#25238e]/90 rounded-xl transition disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
