// src/app/(portal)/portal/sales/services/monthly/new-service/page.tsx
import { NewServiceForm } from '@/components/sales/NewServiceForm';

export default function NewServicePage() {
  return <NewServiceForm billingType="RECURRING" />;
}
