'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

interface EmployeeLevelItem {
  id: string;
  name: string;
  position: number;
  description: string;
}

const INITIAL_LEVELS: EmployeeLevelItem[] = [
  { id: 'lvl-1', name: 'Executive', position: 1, description: 'Top-level leadership and approvals' },
  { id: 'lvl-2', name: 'Manager', position: 2, description: 'Manages teams and operational output' },
  { id: 'lvl-3', name: 'Senior', position: 3, description: 'Senior contributor with mentoring role' },
  { id: 'lvl-4', name: 'Staff', position: 4, description: 'Standard operational role level' },
];

export function EmployeeLevelSettingsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [levels, setLevels] = useState<EmployeeLevelItem[]>(INITIAL_LEVELS);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelPosition, setNewLevelPosition] = useState(5);

  const addLevel = () => {
    if (!newLevelName.trim()) {
      error('Failed to add level', 'Level name is required.');
      return;
    }

    const duplicateName = levels.some((item) => item.name.toLowerCase() === newLevelName.trim().toLowerCase());
    const duplicatePosition = levels.some((item) => item.position === newLevelPosition);

    if (duplicateName) {
      error('Failed to add level', 'Level name already exists.');
      return;
    }

    if (duplicatePosition) {
      error('Failed to add level', 'Position number already exists.');
      return;
    }

    setLevels((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newLevelName.trim(),
        position: newLevelPosition,
        description: '',
      },
    ]);
    setNewLevelName('');
    setNewLevelPosition((prev) => prev + 1);
    success('Employee level added', 'The new level has been added to the list.');
  };

  const removeLevel = (id: string) => {
    setLevels((prev) => prev.filter((level) => level.id !== id));
    success('Employee level removed', 'The selected level has been removed.');
  };

  const saveChanges = () => {
    const hasEmptyName = levels.some((level) => !level.name.trim());
    if (hasEmptyName) {
      error('Failed to save', 'All employee levels must have a name.');
      return;
    }

    success('Employee levels updated', 'Employee level settings have been saved.');
  };

  return (
    <Card className="p-6 sm:p-7 space-y-5">
      <div>
        <h2 className="text-lg font-black text-foreground">Employee Level</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Maintain dynamic employee level hierarchy and ordering.
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs tracking-wider">Position</th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs tracking-wider">Name</th>
              <th className="text-left px-4 py-3 font-bold uppercase text-xs tracking-wider hidden md:table-cell">Description</th>
              <th className="text-right px-4 py-3 font-bold uppercase text-xs tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {levels
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((level) => (
                <tr key={level.id} className="border-t border-border/70">
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      value={level.position}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value) || 1;
                        setLevels((prev) => prev.map((item) => (
                          item.id === level.id ? { ...item, position: nextValue } : item
                        )));
                      }}
                      className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={level.name}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setLevels((prev) => prev.map((item) => (
                          item.id === level.id ? { ...item, name: nextValue } : item
                        )));
                      }}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <input
                      type="text"
                      value={level.description}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setLevels((prev) => prev.map((item) => (
                          item.id === level.id ? { ...item, description: nextValue } : item
                        )));
                      }}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeLevel(level.id)}
                      className="inline-flex items-center justify-center rounded-md p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Add New Level</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Level name"
            value={newLevelName}
            onChange={(event) => setNewLevelName(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <input
            type="number"
            min={1}
            value={newLevelPosition}
            onChange={(event) => setNewLevelPosition(Number(event.target.value) || 1)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={addLevel}>
            Add Level
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={saveChanges}>
          Save Employee Levels
        </Button>
      </div>
    </Card>
  );
}
