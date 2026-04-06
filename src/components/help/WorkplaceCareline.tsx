// src/components/help/WorkplaceCareline.tsx
'use client';

import React, { useState } from 'react';
import { Heart, ShieldCheck, CheckCircle } from 'lucide-react';

interface CarelineFormData {
  name: string;
  position: string;
  tenure: string;
  category: string;
  concerns: string;
  environment: string;
  process: string;
  client: string;
  solutions: string;
  coping: string;
  support: string;
}

const CATEGORIES = [
  'Work Conflict',
  'Leadership Concern',
  'Mental Health',
  'Spiritual Guidance',
  'Relationship / Family',
  'Workload / Burnout',
  'Business Process Concern',
  'Other',
];

const FIELD_CLASSES =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-colors';

const LABEL_CLASSES = 'block text-sm font-semibold text-foreground mb-1.5';

export function WorkplaceCareline(): React.ReactNode {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<CarelineFormData>({
    name: '',
    position: '',
    tenure: '',
    category: '',
    concerns: '',
    environment: '',
    process: '',
    client: '',
    solutions: '',
    coping: '',
    support: '',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-rose-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            Your concern has been safely received.
          </h2>
          <p className="text-muted-foreground text-sm">Thank you for trusting Agila.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-4 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          Confidential &bull; Respectful &bull; Leadership Reviewed
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Submit Another Concern
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="bg-linear-to-br from-rose-500 to-pink-600 px-6 py-8 text-center text-white">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Workplace Care Line</h1>
          <p className="mt-1.5 text-rose-100 text-sm">A safe space for every member of Agila to be heard.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border text-center text-sm py-4">
          <div className="px-4 py-2 font-medium text-foreground">Your voice matters.</div>
          <div className="px-4 py-2 font-medium text-foreground">Your concerns are respected.</div>
          <div className="px-4 py-2 font-medium text-foreground">Your wellbeing matters to Agila.</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            About You
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASSES}>Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className={FIELD_CLASSES}
              />
            </div>
            <div>
              <label className={LABEL_CLASSES}>Position</label>
              <input
                type="text"
                name="position"
                value={form.position}
                onChange={handleChange}
                placeholder="Your position"
                className={FIELD_CLASSES}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASSES}>
              How long have you been with us, and how has your professional journey been so far?
            </label>
            <textarea
              name="tenure"
              value={form.tenure}
              onChange={handleChange}
              rows={3}
              placeholder="Share your experience..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>Concern Category <span className="text-red-500">*</span></label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className={FIELD_CLASSES}
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Concerns */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Your Concerns
          </h2>

          <div>
            <label className={LABEL_CLASSES}>
              What concerns would you like to raise? <span className="text-red-500">*</span>
            </label>
            <textarea
              name="concerns"
              value={form.concerns}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Please describe your concern in detail..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>
              How do these concerns affect the working environment or camaraderie among colleagues?
            </label>
            <textarea
              name="environment"
              value={form.environment}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the impact on the team..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>
              How do these concerns impact the business processes of Agila?
            </label>
            <textarea
              name="process"
              value={form.process}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the impact on operations..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>
              How do these concerns affect the quality of our services to our clients?
            </label>
            <textarea
              name="client"
              value={form.client}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the impact on client service..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>
        </div>

        {/* Solutions & Support */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Solutions &amp; Support
          </h2>

          <div>
            <label className={LABEL_CLASSES}>What solutions do you have in mind?</label>
            <textarea
              name="solutions"
              value={form.solutions}
              onChange={handleChange}
              rows={4}
              placeholder="Share any ideas or suggestions..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>How do you cope with these concerns?</label>
            <textarea
              name="coping"
              value={form.coping}
              onChange={handleChange}
              rows={4}
              placeholder="What has been helping you manage..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>How can we support you?</label>
            <textarea
              name="support"
              value={form.support}
              onChange={handleChange}
              rows={4}
              placeholder="What kind of support are you looking for..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>
        </div>

        {/* Footer + Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
            Confidential &bull; Respectful &bull; Leadership Reviewed
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 active:scale-95 transition-all"
          >
            <Heart className="w-4 h-4" />
            Submit to Workplace Care Line
          </button>
        </div>
      </form>
    </div>
  );
}
