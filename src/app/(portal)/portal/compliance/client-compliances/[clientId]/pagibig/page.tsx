// src/app/(portal)/portal/compliance/client-compliances/[clientId]/pagibig/page.tsx
import { connection } from 'next/server';
import { ComplianceDetailShell } from '../components/ComplianceDetailShell';

interface Props {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ year?: string }>;
}

export default async function Page({
  params, searchParams }: Props) {
  await connection();
  const { clientId } = await params;
  const { year } = await searchParams;
  return <ComplianceDetailShell clientId={clientId} complianceSlug="pagibig" yearParam={year} />;
}
