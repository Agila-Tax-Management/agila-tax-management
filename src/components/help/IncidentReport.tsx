// src/components/help/IncidentReport.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, FileText, Send } from 'lucide-react';

interface IncidentFormData {
  dateOfIncident: string;
  time: string;
  location: string;
  employeeInvolved: string;
  positionDepartment: string;
  typeOfIncident: string;
  briefDescription: string;
  violationNegligence: string;
  actionTaken: string;
  managerRemark: string;
  preparedBy: string;
  preparedDate: string;
  acknowledgedBy: string;
  acknowledgedDate: string;
}

const INCIDENT_TYPES = [
  'Workplace Accident',
  'Near Miss',
  'Property Damage',
  'Safety Violation',
  'Harassment / Misconduct',
  'Negligence',
  'Tardiness / Absence Without Leave',
  'Insubordination',
  'Data / Information Breach',
  'Other',
];

const FIELD_CLASSES =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

const LABEL_CLASSES = 'block text-sm font-semibold text-foreground mb-1.5';

export function IncidentReport(): React.ReactNode {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<IncidentFormData>({
    dateOfIncident: '',
    time: '',
    location: '',
    employeeInvolved: '',
    positionDepartment: '',
    typeOfIncident: '',
    briefDescription: '',
    violationNegligence: '',
    actionTaken: '',
    managerRemark: '',
    preparedBy: '',
    preparedDate: '',
    acknowledgedBy: '',
    acknowledgedDate: '',
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

  function handleReset() {
    setSubmitted(false);
    setForm({
      dateOfIncident: '',
      time: '',
      location: '',
      employeeInvolved: '',
      positionDepartment: '',
      typeOfIncident: '',
      briefDescription: '',
      violationNegligence: '',
      actionTaken: '',
      managerRemark: '',
      preparedBy: '',
      preparedDate: '',
      acknowledgedBy: '',
      acknowledgedDate: '',
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <FileText className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Incident Report Submitted</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Your incident report has been received and will be reviewed by HR. Please ensure you
          follow up with your direct manager.
        </p>
        <button
          onClick={handleReset}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Incident Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Use this form to report workplace incidents, violations, or near-miss events. All
            submissions are reviewed by Human Resources.
          </p>
        </div>
      </div>

      {/* Note banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          Note: Submit within 24–48 hours upon discovery of the incident.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Incident Details */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Incident Details
          </h2>

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASSES}>Date of Incident <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="dateOfIncident"
                value={form.dateOfIncident}
                onChange={handleChange}
                required
                className={FIELD_CLASSES}
              />
            </div>
            <div>
              <label className={LABEL_CLASSES}>Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
                className={FIELD_CLASSES}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={LABEL_CLASSES}>Location <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              placeholder="e.g. Main Office, Room 3, Client Site"
              className={FIELD_CLASSES}
            />
          </div>

          {/* Employee Involved + Position/Dept */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASSES}>Employee Involved <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="employeeInvolved"
                value={form.employeeInvolved}
                onChange={handleChange}
                required
                placeholder="Full name"
                className={FIELD_CLASSES}
              />
            </div>
            <div>
              <label className={LABEL_CLASSES}>Position / Department <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="positionDepartment"
                value={form.positionDepartment}
                onChange={handleChange}
                required
                placeholder="e.g. Tax Associate / Compliance"
                className={FIELD_CLASSES}
              />
            </div>
          </div>

          {/* Type of Incident */}
          <div>
            <label className={LABEL_CLASSES}>Type of Incident <span className="text-red-500">*</span></label>
            <select
              name="typeOfIncident"
              value={form.typeOfIncident}
              onChange={handleChange}
              required
              className={FIELD_CLASSES}
            >
              <option value="">Select incident type...</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Narrative */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Narrative
          </h2>

          <div>
            <label className={LABEL_CLASSES}>Brief Description <span className="text-red-500">*</span></label>
            <textarea
              name="briefDescription"
              value={form.briefDescription}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Describe what happened, the sequence of events, and any witnesses present..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>Violation / Negligence</label>
            <textarea
              name="violationNegligence"
              value={form.violationNegligence}
              onChange={handleChange}
              rows={4}
              placeholder="Describe any policy violations or negligence observed..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>Action Taken</label>
            <textarea
              name="actionTaken"
              value={form.actionTaken}
              onChange={handleChange}
              rows={4}
              placeholder="What immediate actions were taken after the incident?"
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>Manager&apos;s Remark</label>
            <textarea
              name="managerRemark"
              value={form.managerRemark}
              onChange={handleChange}
              rows={4}
              placeholder="Manager's observations, recommendations, or corrective actions..."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </div>
        </div>

        {/* Section 3: Signatures */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Acknowledgment
          </h2>

          {/* Prepared by */}
          <div>
            <p className="text-sm font-bold text-foreground mb-3">Prepared by:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-b border-border pb-1">
                <label className="block text-xs text-muted-foreground mb-1">Name &amp; Signature</label>
                <input
                  type="text"
                  name="preparedBy"
                  value={form.preparedBy}
                  onChange={handleChange}
                  placeholder="Print name"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="border-b border-border pb-1">
                <label className="block text-xs text-muted-foreground mb-1">Date</label>
                <input
                  type="date"
                  name="preparedDate"
                  value={form.preparedDate}
                  onChange={handleChange}
                  className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <p className="text-sm font-bold text-foreground mb-3">Acknowledged by (Manager):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-b border-border pb-1">
                <label className="block text-xs text-muted-foreground mb-1">Name &amp; Signature</label>
                <input
                  type="text"
                  name="acknowledgedBy"
                  value={form.acknowledgedBy}
                  onChange={handleChange}
                  placeholder="Print name"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="border-b border-border pb-1">
                <label className="block text-xs text-muted-foreground mb-1">Date</label>
                <input
                  type="date"
                  name="acknowledgedDate"
                  value={form.acknowledgedDate}
                  onChange={handleChange}
                  className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            Submit within 24–48 hours upon discovery of the incident.
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            Submit Report to HR
          </button>
        </div>
      </form>
    </div>
  );
}
