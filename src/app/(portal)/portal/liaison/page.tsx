import { connection } from 'next/server';
import { LiaisonDashboard } from '@/components/liaison/LiaisonDashboard';

export default async function LiaisonPage() {
  await connection();
  return <LiaisonDashboard />;
}