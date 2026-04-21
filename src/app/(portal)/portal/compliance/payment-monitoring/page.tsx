import { connection } from 'next/server';
import { PaymentMonitoring } from '@/components/compliance/PaymentMonitoring';

export default async function PaymentMonitoringPage() {
  await connection();
  return <PaymentMonitoring />;
}
