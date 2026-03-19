// src/app/(portal)/portal/sales/services/monthly/update-service-plan/[id]/page.tsx
import { EditServicePlanForm } from './components/EditServicePlanForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePlanPage({ params }: PageProps) {
  const { id } = await params;
  return <EditServicePlanForm planId={parseInt(id, 10)} />;
}
