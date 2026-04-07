// src/components/UI/ProfileDropdown.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, User } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export function ProfileDropdown(): React.ReactNode {
  const { data: sessionData } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = React.useRef<HTMLDivElement>(null);
  const name = sessionData?.user?.name ?? '';
  const image = (sessionData?.user as { image?: string | null } | undefined)?.image ?? null;
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        title="Profile"
        onClick={() => setOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white text-sm font-semibold shrink-0 hover:ring-2 hover:ring-blue-400 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {image ? (
          <Image
            src={image}
            alt={name || 'Profile'}
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border bg-card shadow-lg py-1 z-50">
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <User size={15} className="shrink-0 text-muted-foreground" />
            Profile
          </button>
          <div className="my-1 border-t border-border" />
          <button
            onClick={async () => {
              setOpen(false);
              await authClient.signOut();
              router.push('/sign-in');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} className="shrink-0" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
