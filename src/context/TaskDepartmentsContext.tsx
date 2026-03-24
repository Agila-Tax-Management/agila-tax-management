// src/context/TaskDepartmentsContext.tsx
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const LS_KEY = 'atms-task-dept-order';

export interface TaskApiStatus {
  id: number;
  name: string;
  color: string | null;
  statusOrder: number;
  isEntryStep: boolean;
  isExitStep: boolean;
}

export interface TaskApiDepartment {
  id: number;
  name: string;
  statuses: TaskApiStatus[];
}

interface TaskDepartmentsContextValue {
  departments: TaskApiDepartment[];
  loading: boolean;
  refresh: () => void;
  reorderDepts: (orderedIds: number[]) => void;
}

const TaskDepartmentsContext = createContext<TaskDepartmentsContextValue>({
  departments: [],
  loading: true,
  refresh: () => {},
  reorderDepts: () => {},
});

/** Sort departments by the user-defined order stored in localStorage. New depts go to the end. */
export function applyStoredDeptOrder<T extends { id: number }>(depts: T[]): T[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) return depts;
    const ids: number[] = JSON.parse(stored);
    const idMap = new Map(depts.map(d => [d.id, d]));
    const ordered: T[] = [];
    for (const id of ids) {
      const d = idMap.get(id);
      if (d) { ordered.push(d); idMap.delete(id); }
    }
    for (const d of idMap.values()) ordered.push(d);
    return ordered;
  } catch {
    return depts;
  }
}

export function TaskDepartmentsProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = useState<TaskApiDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/task-workflow/departments');
      const data = await res.json();
      if (res.ok) setDepartments(applyStoredDeptOrder(data.data as TaskApiDepartment[]));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const reorderDepts = useCallback((orderedIds: number[]) => {
    localStorage.setItem(LS_KEY, JSON.stringify(orderedIds));
    setDepartments(prev => {
      const idMap = new Map(prev.map(d => [d.id, d]));
      const ordered: TaskApiDepartment[] = [];
      for (const id of orderedIds) {
        const d = idMap.get(id);
        if (d) { ordered.push(d); idMap.delete(id); }
      }
      for (const d of idMap.values()) ordered.push(d);
      return ordered;
    });
  }, []);

  return (
    <TaskDepartmentsContext.Provider value={{ departments, loading, refresh: fetchDepartments, reorderDepts }}>
      {children}
    </TaskDepartmentsContext.Provider>
  );
}

export const useTaskDepartments = () => useContext(TaskDepartmentsContext);
