'use client';

import React, { useState } from 'react';
import { CalendarClock, FileText, Layers } from 'lucide-react';
import { WorkingSchedulesSettingsTab } from './WorkingSchedulesSettingsTab';
import { ContractsSettingsTab } from './ContractsSettingsTab';
import { EmployeeLevelSettingsTab } from '@/components/hr/settings/EmployeeLevelSettingsTab';

type SettingsTab = 'working-schedules' | 'contracts' | 'employee-level';

const SETTINGS_TABS: { key: SettingsTab; label: string; icon: typeof CalendarClock }[] = [
  { key: 'working-schedules', label: 'Working Schedules', icon: CalendarClock },
  { key: 'contracts', label: 'Contracts', icon: FileText },
  { key: 'employee-level', label: 'Employee Level', icon: Layers },
];

export function HRSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('working-schedules');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">HR Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage configuration for schedules, contracts, and employee level in one place.
        </p>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {SETTINGS_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'working-schedules' && <WorkingSchedulesSettingsTab />}

      {activeTab === 'contracts' && <ContractsSettingsTab />}

      {activeTab === 'employee-level' && <EmployeeLevelSettingsTab />}
    </div>
  );
}
