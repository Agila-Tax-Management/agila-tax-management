'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    router.push('/dashboard');
  };

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
        <div className="flex-1 max-w-sm w-full">
          <h1 className="text-2xl font-semibold text-slate-800 mb-6">Log in to One Portal</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Show password checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPw}
                onChange={e => setShowPw(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Show Password</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-md text-sm transition-colors shadow-sm"
            >
              {submitting ? 'Signing in…' : 'Log In'}
            </button>
          </form>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-5 mt-6">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Back
            </button>
            <a
              href="/register-account"
              className="text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Create New Account
            </a>
            <a
              href="/forget-password"
              className="text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Forgot Password
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
