// src/lib/mock-task-management-data.ts
// ── Mock Task Management Data ─────────────────────────────
// Combines Liaison and Account Officer (Compliance) tasks into
// a unified view for team leads and account officers.

import { INITIAL_AO_TASKS, AO_TEAM_MEMBERS } from './mock-ao-data';
import { INITIAL_LIAISON_TASKS, LIAISON_TEAM } from './mock-liaison-data';
import type { AOTask, AOTeamMember } from './types';

// ── Source type ───────────────────────────────────────────
export type TaskSource = 'compliance' | 'liaison';

export interface UnifiedTask extends AOTask {
  source: TaskSource;
}

// ── Merge team members (deduplicated by id) ───────────────
export const ALL_TEAM_MEMBERS: AOTeamMember[] = (() => {
  const map = new Map<string, AOTeamMember>();
  for (const m of [...AO_TEAM_MEMBERS, ...LIAISON_TEAM]) {
    if (!map.has(m.id)) map.set(m.id, m);
  }
  return Array.from(map.values());
})();

// ── Merge tasks with source discriminator ─────────────────
export const ALL_TASKS: UnifiedTask[] = [
  ...INITIAL_AO_TASKS.map(t => ({ ...t, source: 'compliance' as TaskSource })),
  ...INITIAL_LIAISON_TASKS.map(t => ({ ...t, source: 'liaison' as TaskSource })),
];

// ── Source display config ─────────────────────────────────
export const SOURCE_CONFIG: Record<TaskSource, { label: string; color: string; bg: string; textColor: string }> = {
  compliance: { label: 'Compliance', color: 'bg-violet-500', bg: 'bg-violet-50', textColor: 'text-violet-700' },
  liaison: { label: 'Liaison', color: 'bg-cyan-500', bg: 'bg-cyan-50', textColor: 'text-cyan-700' },
};
