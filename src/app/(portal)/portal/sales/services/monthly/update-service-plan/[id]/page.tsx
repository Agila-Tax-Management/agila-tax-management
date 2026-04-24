// src/app/(portal)/portal/sales/services/monthly/update-service-plan/[id]/page.tsx
import { connection } from 'next/server';
import { EditServicePlanForm } from './components/EditServicePlanForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePlanPage({
  params }: PageProps) {
  await connection();
  const { id } = await params;
  return <EditServicePlanForm planId={parseInt(id, 10)} />;
}   