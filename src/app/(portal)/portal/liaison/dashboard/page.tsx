import { connection } from 'next/server';
import { redirect } from 'next/navigation';

export default async function LiaisonDashboardPage() {
  await connection();
  redirect('/portal/liaison');
}
