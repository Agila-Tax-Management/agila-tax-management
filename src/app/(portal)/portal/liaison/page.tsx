'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiaisonPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/portal/liaison/tasks');
  }, [router]);

  return null;
}