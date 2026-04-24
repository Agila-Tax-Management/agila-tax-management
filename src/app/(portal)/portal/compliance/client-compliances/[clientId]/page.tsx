// src/app/(portal)/portal/compliance/client-compliances/[clientId]/page.tsx
import { connection } from 'next/server';
import { WorkingPaper } from './components/WorkingPaper';

interface Props {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ year?: string }>;
}

export default async function WorkingPaperPage({
  params, searchParams }: Props) {
  await connection();
  const { clientId } = await params;
  const { year } = await searchParams;
  return <WorkingPaper clientId={clientId} yearParam={year} />;
}
