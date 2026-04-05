// src/app/(portal)/portal/sales/services/one-time/new-service/page.tsx
import { NewServiceForm } from '@/components/sales/NewServiceForm';

export default function NewOneTimeServicePage() {
  return <NewServiceForm billingType="ONE_TIME" />;
}
