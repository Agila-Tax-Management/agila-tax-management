// src/app/(portal)/portal/hr/employee-management/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { EMPLOYEES } from '@/lib/mock-hr-data';
import { EmployeeProfileView } from '@/components/hr/profile/EmployeeProfileView';

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const employee = EMPLOYEES.find(e => e.id === id);

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-bold text-foreground mb-1">Employee not found</p>
        <p className="text-sm text-muted-foreground mb-4">No employee record with ID &ldquo;{id}&rdquo;</p>
        <button
          onClick={() => router.push('/portal/hr/employee-management')}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
        >
          Back to Employee Management
        </button>
      </div>
    );
  }

  return <EmployeeProfileView employee={employee} />;
}
