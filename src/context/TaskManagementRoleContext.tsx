// src/context/TaskManagementRoleContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PortalRole, Role } from '@/generated/prisma/client';

interface TaskManagementRoleContextValue {
  role: PortalRole | null;
  userRole: Role | null;
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAccessSettings: boolean;
}

const TaskManagementRoleContext = createContext<TaskManagementRoleContextValue>({
  role: null,
  userRole: null,
  loading: true,
  canEdit: false,
  canDelete: false,
  canAccessSettings: false,
});

export function TaskManagementRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<PortalRole | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/portal-access?portal=TASK_MANAGEMENT')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { role: PortalRole | null; userRole: Role } | null) => {
        if (json) {
          setRole(json.role);
          setUserRole(json.userRole);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Compute permissions based on role
  // SUPER_ADMIN users have full access regardless of portal role
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const canEdit = isSuperAdmin || role === 'USER' || role === 'ADMIN' || role === 'SETTINGS';
  const canDelete = isSuperAdmin || role === 'ADMIN' || role === 'SETTINGS';
  const canAccessSettings = isSuperAdmin || role === 'SETTINGS';

  return (
    <TaskManagementRoleContext.Provider
      value={{ role, userRole, loading, canEdit, canDelete, canAccessSettings }}
    >
      {children}
    </TaskManagementRoleContext.Provider>
  );
}

export const useTaskManagementRole = () => useContext(TaskManagementRoleContext);
