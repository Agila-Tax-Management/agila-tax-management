// src/app/(portal)/portal/compliance/client-compliances/[clientId]/page.tsx
import { WorkingPaper } from './components/WorkingPaper';

interface Props {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ year?: string }>;
}

export default async function WorkingPaperPage({ params, searchParams }: Props) {
  const { clientId } = await params;
  const { year } = await searchParams;
  return <WorkingPaper clientId={clientId} yearParam={year} />;
}
