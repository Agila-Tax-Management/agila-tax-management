// src/app/(portal)/portal/it/assets/page.tsx
import { connection } from 'next/server';
import { ITAssets } from '@/components/it/ITAssets';

export default async function ITAssetsPage() {
  await connection();
  return <ITAssets />;
}
