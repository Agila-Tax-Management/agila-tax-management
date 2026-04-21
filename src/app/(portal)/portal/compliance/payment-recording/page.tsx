import { connection } from 'next/server';
import { PaymentRecording } from '@/components/compliance/PaymentRecording';

export default async function PaymentRecordingPage() {
  await connection();
  return <PaymentRecording />;
}
