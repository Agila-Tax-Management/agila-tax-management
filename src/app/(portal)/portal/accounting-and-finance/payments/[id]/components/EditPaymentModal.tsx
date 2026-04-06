// src/app/(portal)/portal/accounting/payments/[id]/components/EditPaymentModal.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { updatePaymentAction } from '../actions';
import type { PaymentDetailRecord } from '@/types/accounting.types';

type PaymentMethod = PaymentDetailRecord['method'];

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'E_WALLET', label: 'E-Wallet (GCash / Maya)' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDetailRecord;
  onSaved: () => void;
}

export function EditPaymentModal({ isOpen, onClose, payment, onSaved }: EditPaymentModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [amount, setAmount] = useState(String(payment.amount));
  const [paymentDate, setPaymentDate] = useState(payment.paymentDate.split('T')[0]);
  const [method, setMethod] = useState<PaymentMethod>(payment.method);
  const [referenceNumber, setReferenceNumber] = useState(payment.referenceNumber ?? '');
  const [notes, setNotes] = useState(payment.notes ?? '');

  // Proof upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opened with new payment
  const [prevPaymentId, setPrevPaymentId] = useState(payment.id);
  if (payment.id !== prevPaymentId) {
    setPrevPaymentId(payment.id);
    setAmount(String(payment.amount));
    setPaymentDate(payment.paymentDate.split('T')[0]);
    setMethod(payment.method);
    setReferenceNumber(payment.referenceNumber ?? '');
    setNotes(payment.notes ?? '');
    setSelectedFile(null);
    setPreviewUrl(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toastError('Invalid file type', 'Only JPEG, PNG, WebP, or GIF images are allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toastError('File too large', 'Please upload an image smaller than 5 MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function clearFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      let proofOfPaymentUrl: string | null = null;

      // Upload proof photo if selected
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch(`/api/accounting/payments/${payment.id}/proof`, {
          method: 'PATCH',
          body: formData,
        });

        setIsUploading(false);

        if (!uploadRes.ok) {
          const body = await uploadRes.json();
          toastError('Upload failed', (body as { error?: string }).error ?? 'Could not upload proof of payment.');
          return;
        }

        const uploadData = await uploadRes.json();
        proofOfPaymentUrl = (uploadData as { data: { proofOfPaymentUrl: string } }).data.proofOfPaymentUrl;
      }

      const result = await updatePaymentAction(payment.id, {
        amount: parseFloat(amount),
        paymentDate,
        method,
        referenceNumber: referenceNumber.trim() || null,
        notes: notes.trim() || null,
        proofOfPaymentUrl,
      });

      if ('error' in result) {
        toastError('Update failed', result.error);
        return;
      }

      success('Payment updated', 'Payment details have been saved successfully.');
      onSaved();
      onClose();
    } catch (err) {
      console.error('[EditPaymentModal]', err);
      toastError('Unexpected error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }

  const isLoading = isSaving || isUploading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Payment Details" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">

        {/* Amount */}
        {(() => {
          const totalAllocated = payment.allocations.reduce((s, a) => s + a.amountApplied, 0);
          const amountNum = parseFloat(amount) || 0;
          const isBelowMin = amountNum < totalAllocated - 0.001;
          return (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Amount (₱) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              />
              {totalAllocated > 0 && (
                <p className={`mt-1.5 text-xs ${isBelowMin ? 'text-rose-500 font-medium' : 'text-muted-foreground'}`}>
                  {isBelowMin
                    ? `Amount cannot be less than ₱${totalAllocated.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (total already applied to invoices).`
                    : `₱${totalAllocated.toLocaleString('en-PH', { minimumFractionDigits: 2 })} is already applied to invoices.`}
                </p>
              )}
            </div>
          );
        })()}

        {/* Payment Date */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Payment Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Payment Method <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            disabled={isLoading}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Reference / Check No.
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. BDO-123456"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            placeholder="Optional notes about this payment..."
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          />
        </div>

        {/* Proof of Payment Upload */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Proof of Payment (Photo)
          </label>

          {previewUrl ? (
            <div className="relative w-full h-40 rounded-lg border border-border overflow-hidden bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={clearFile}
                disabled={isLoading}
                className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
              >
                <X size={14} />
              </button>
            </div>
          ) : payment.proofOfPaymentUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <ImageIcon size={16} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground flex-1 truncate">Current proof on file</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full flex flex-col items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-border hover:border-amber-400 hover:bg-amber-50/50 transition-colors text-muted-foreground"
            >
              <Upload size={18} />
              <span className="text-xs">Click to upload proof of payment</span>
              <span className="text-[10px]">JPEG, PNG, WebP, GIF · max 5 MB</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading
              ? <><Loader2 size={14} className="animate-spin" /> {isUploading ? 'Uploading...' : 'Saving...'}</>
              : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
