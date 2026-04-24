import { connection } from 'next/server';
import { AOPaymentMonitoring } from '@/components/account-officer/AOPaymentMonitoring';

export default async function AOPaymentMonitoringPage() {
  await connection();
  return <AOPaymentMonitoring />;
}
