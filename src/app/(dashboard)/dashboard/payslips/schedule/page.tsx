// src/app/(dashboard)/dashboard/payslips/schedule/page.tsx
import { connection } from 'next/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  await connection();
  redirect('/dashboard/payslips');
}

