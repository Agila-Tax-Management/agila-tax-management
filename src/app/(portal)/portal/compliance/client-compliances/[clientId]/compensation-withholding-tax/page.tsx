// src/app/(portal)/portal/compliance/client-compliances/[clientId]/compensation-withholding-tax/page.tsx
import { ComplianceDetailShell } from '../components/ComplianceDetailShell';

interface Props {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ year?: string }>;
}

export default async function Page({ params, searchParams }: Props) {
  const { clientId } = await params;
  const { year } = await searchParams;
  return <ComplianceDetailShell clientId={clientId} complianceSlug="compensation-withholding-tax" yearParam={year} />;
}
