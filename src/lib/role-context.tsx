'use client';

import React, { createContext, useContext, useState } from 'react';

type Role = 'Employee' | 'HR' | 'Admin';

interface RoleContextValue {
  role: string;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({ role: 'Employee', setRole: () => {} });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('Employee');
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
