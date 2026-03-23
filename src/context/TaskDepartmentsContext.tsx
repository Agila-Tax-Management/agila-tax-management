// src/context/TaskDepartmentsContext.tsx
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
}

const TaskDepartmentsContext = createContext<TaskDepartmentsContextValue>({
  departments: [],
  loading: true,
  refresh: () => {},
});

export function TaskDepartmentsProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = useState<TaskApiDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/task-workflow/departments');
      const data = await res.json();
      if (res.ok) setDepartments(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  return (
    <TaskDepartmentsContext.Provider value={{ departments, loading, refresh: fetchDepartments }}>
      {children}
    </TaskDepartmentsContext.Provider>
  );
}

export const useTaskDepartments = () => useContext(TaskDepartmentsContext);
