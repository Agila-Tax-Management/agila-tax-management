// src/components/task-management/TaskSettingsTabs.tsx
'use client';

import React, { useState } from 'react';
import { Settings2, FileText } from 'lucide-react';
import { WorkflowSettings } from './WorkflowSettings';
import { TemplatesSettings } from './TemplatesSettings';

type SettingsTab = 'workflow' | 'templates';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'workflow',  label: 'Workflow',  icon: <Settings2 size={15} /> },
  { id: 'templates', label: 'Templates', icon: <FileText  size={15} /> },
];

export function TaskSettingsTabs(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<SettingsTab>('workflow');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center shrink-0">
          <Settings2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Task Settings</h1>
          <p className="text-sm text-slate-500">
            Configure workflows and reusable task templates for the portal.
          </p>
        </div>
      </div>

      {/* Top-level tab bar */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-teal-700 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'workflow'  && <WorkflowSettings />}
      {activeTab === 'templates' && <TemplatesSettings />}
    </div>
  );
}
