// src/app/(auth)/sign-in/page.tsx
'use client';

import Image from 'next/image';
import SignInForm from './components/SignInForm';

export default function LoginPage(): React.ReactNode {
  return (
    <div className="flex-1 flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-4xl flex items-center gap-12">

        {/* Left — Illustration */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <Image
            src="/images/register.webp"
            alt="Login illustration"
            width={420}
            height={420}
            priority
          />
        </div>

        {/* Right — Form */}
        <SignInForm />

      </div>
    </div>
  );
}
