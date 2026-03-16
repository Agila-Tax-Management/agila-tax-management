'use client';

import React, { useMemo, useState } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { EMPLOYEES } from '@/lib/mock-hr-data';
import { MOCK_DEPARTMENTS, type MockDepartment } from './data';

interface AddDepartmentFormData {
  name: string;
  head: string;
  description: string;
}

const EMPTY_ADD_DEPARTMENT_FORM: AddDepartmentFormData = {
  name: '',
  head: '',
  description: '',
};

export function DepartmentsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [departments, setDepartments] = useState<MockDepartment[]>(MOCK_DEPARTMENTS);
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [addDepartmentForm, setAddDepartmentForm] = useState<AddDepartmentFormData>(EMPTY_ADD_DEPARTMENT_FORM);

  const updateAddDepartmentForm = <K extends keyof AddDepartmentFormData>(
    key: K,
    value: AddDepartmentFormData[K],
  ) => {
    setAddDepartmentForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeAddDepartmentModal = () => {
    setIsAddDepartmentOpen(false);
    setAddDepartmentForm(EMPTY_ADD_DEPARTMENT_FORM);
  };

  const handleAddDepartment = () => {
    const requiredFields: Array<keyof AddDepartmentFormData> = ['name', 'head', 'description'];
    const hasMissingRequiredField = requiredFields.some((field) => !addDepartmentForm[field].trim());

    if (hasMissingRequiredField) {
      error('Failed to add department', 'Please complete all required department fields.');
      return;
    }

    success('Department created', 'The new department has been added successfully.');
    closeAddDepartmentModal();
  };

  const departmentStaffCountMap = useMemo(() => {
    return EMPLOYEES.reduce<Map<string, number>>((acc, employee) => {
      const currentCount = acc.get(employee.department) ?? 0;
      acc.set(employee.department, currentCount + 1);
      return acc;
    }, new Map<string, number>());
  }, []);

  const getDepartmentStaffCount = (departmentName: string) => departmentStaffCountMap.get(departmentName) ?? 0;

  return (
    <>
      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => setIsAddDepartmentOpen(true)}>
          <Plus size={16} /> Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <Card key={dept.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground">Head: {dept.head}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" className="p-1.5 h-auto text-red-500"><Trash2 size={14} /></Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{dept.description}</p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="neutral">{getDepartmentStaffCount(dept.name)} Staff</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isAddDepartmentOpen} onClose={closeAddDepartmentModal} title="Add Department" size="lg">
        <div className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addDepartmentForm.name}
                onChange={(e) => updateAddDepartmentForm('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department Head</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addDepartmentForm.head}
                onChange={(e) => updateAddDepartmentForm('head', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
              <textarea
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 min-h-24"
                value={addDepartmentForm.description}
                onChange={(e) => updateAddDepartmentForm('description', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeAddDepartmentModal}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleAddDepartment}>
              Save Department
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
