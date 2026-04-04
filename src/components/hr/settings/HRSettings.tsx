'use client';

import React, { useState } from 'react';
import { CalendarClock, CalendarDays, Layers, CalendarRange, CalendarX } from 'lucide-react';
import { WorkingSchedulesSettingsTab } from './WorkingSchedulesSettingsTab';
import { LeaveTypesSettingsTab } from './LeaveTypesSettingsTab';
import { EmployeeLevelSettingsTab } from '@/components/hr/settings/EmployeeLevelSettingsTab';
import { PayrollSchedulesSettingsTab } from '@/components/hr/settings/PayrollSchedulesSettingsTab';
import { HolidaysSettingsTab } from '@/components/hr/settings/HolidaysSettingsTab';

type SettingsTab = 'working-schedules' | 'leave-types' | 'employee-level' | 'payroll-schedules' | 'holidays';

const SETTINGS_TABS: { key: SettingsTab; label: string; icon: typeof CalendarClock }[] = [
  { key: 'working-schedules', label: 'Working Schedules', icon: CalendarClock },
  { key: 'leave-types', label: 'Leave Types', icon: CalendarDays },
  { key: 'employee-level', label: 'Employee Level', icon: Layers },
  { key: 'payroll-schedules', label: 'Payroll Schedules', icon: CalendarRange },
  { key: 'holidays', label: 'Holidays', icon: CalendarX },
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

      {activeTab === 'leave-types' && <LeaveTypesSettingsTab />}

      {activeTab === 'employee-level' && <EmployeeLevelSettingsTab />}

      {activeTab === 'payroll-schedules' && <PayrollSchedulesSettingsTab />}

      {activeTab === 'holidays' && <HolidaysSettingsTab />}
    </div>
  );
}
