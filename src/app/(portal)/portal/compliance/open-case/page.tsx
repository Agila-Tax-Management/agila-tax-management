import { connection } from 'next/server';
import { OpenCases } from '@/components/compliance/OpenCases';

export default async function OpenCasesPage() {
  await connection();
  return <OpenCases />;
}
