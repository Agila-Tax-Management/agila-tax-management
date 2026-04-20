// src/app/not-found.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function RootNotFound(): React.ReactNode {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession();
      setIsAuthenticated(!!data?.session);
    };
    void checkSession();
  }, []);

  const handleGoHome = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center">
              <FileQuestion className="w-16 h-16 text-slate-400" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              404
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-slate-600 mb-8 leading-relaxed">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or the URL might be incorrect.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-teal-600 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg"
          >
            <Home size={18} />
            {isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
          </button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-slate-500 mt-8">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
