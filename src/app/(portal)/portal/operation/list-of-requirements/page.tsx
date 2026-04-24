// src/app/(portal)/portal/operation/list-of-requirements/page.tsx
import { connection } from 'next/server';
import { OperationRequirements } from '@/components/operation/OperationRequirements';

export default async function OperationRequirementsPage() {
  await connection();
  return <OperationRequirements />;
}
