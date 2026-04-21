// src/app/(dashboard)/dashboard/help/knowledgebase/page.tsx
import { connection } from 'next/server';
import { Knowledgebase } from '@/components/help/Knowledgebase';

export default async function KnowledgebasePage() {
  await connection();
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <Knowledgebase />
    </div>
  );
}
