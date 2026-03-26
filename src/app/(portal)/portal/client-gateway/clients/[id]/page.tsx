// src/app/(portal)/portal/client-gateway/clients/[id]/page.tsx
import { ClientDetailPage } from './components/ClientDetailPage';

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPageRoute({ params }: Props) {
  const { id } = await params;
  return <ClientDetailPage clientId={parseInt(id, 10)} />;
}
