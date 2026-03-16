// src/app/(portal)/portal/hr/employee-management/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { EmployeeProfileView } from '@/components/hr/profile/EmployeeProfileView';
import type { Employee } from '@/lib/mock-hr-data';

type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATIONARY' | 'RESIGNED' | 'TERMINATED' | 'SUSPENDED' | 'RETIRED';

function mapStatus(status: string | null | undefined): Employee['status'] {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'ON_LEAVE': return 'On Leave';
    case 'PROBATIONARY': return 'Probationary';
    case 'RESIGNED': return 'Resigned';
    default: return 'Active';
  }
}

interface ApiGovernmentIds {
  sss?: string | null;
  pagibig?: string | null;
  philhealth?: string | null;
  tin?: string | null;
}

interface ApiEmployment {
  employmentStatus?: EmploymentStatus | null;
  department?: { name: string } | null;
  position?: { title: string } | null;
  hireDate?: string | null;
}

interface ApiEmployee {
  id: number;
  employeeNo?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  governmentIds?: ApiGovernmentIds | null;
  user?: { email?: string | null } | null;
  employments?: ApiEmployment[];
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/hr/employees/${id}`);
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        if (!res.ok) throw new Error('Failed to fetch');
        const json = (await res.json()) as { data: ApiEmployee };
        const emp = json.data;
        const latestEmployment = emp.employments?.[0];

        const mapped: Employee = {
          id: String(emp.id),
          employeeNo: emp.employeeNo ?? '',
          firstName: emp.firstName,
          lastName: emp.lastName,
          fullName: `${emp.firstName} ${emp.lastName}`,
          email: emp.user?.email ?? emp.email ?? '',
          phone: emp.phone ?? '',
          department: (latestEmployment?.department?.name ?? 'HR') as Employee['department'],
          position: latestEmployment?.position?.title ?? '',
          status: mapStatus(latestEmployment?.employmentStatus),
          dateHired: latestEmployment?.hireDate ?? '',
          avatar: `${emp.firstName[0] ?? ''}${emp.lastName[0] ?? ''}`.toUpperCase(),
          salary: 0,
          sssNo: emp.governmentIds?.sss ?? '',
          philHealthNo: emp.governmentIds?.philhealth ?? '',
          pagIbigNo: emp.governmentIds?.pagibig ?? '',
          tinNo: emp.governmentIds?.tin ?? '',
        };
        setEmployee(mapped);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !employee) {
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
