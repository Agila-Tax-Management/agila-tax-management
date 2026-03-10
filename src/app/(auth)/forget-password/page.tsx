'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ForgetPasswordPage() {
  const router = useRouter();

  const [email, setEmail]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]             = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Frontend-only: simulate email sent
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 800);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-4xl flex items-center gap-12">

        {/* Left — Illustration */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <Image
            src="/images/register.webp"
            alt="Forgot password illustration"
            width={420}
            height={420}
            priority
          />
        </div>

        {/* Right — Form */}
        <div className="flex-1 max-w-sm w-full">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Forgot Password</h1>
          <p className="text-sm text-slate-500 mb-6">
            Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3">
                <p className="text-sm text-green-700 font-medium">Reset link sent!</p>
                <p className="text-xs text-green-600 mt-1">
                  If an account exists for <strong>{email}</strong>, you will receive a password reset email shortly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm transition-colors shadow-sm"
              >
                Back to Log In
              </button>
            </div>
          ) : (
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

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-md text-sm transition-colors shadow-sm"
              >
                {submitting ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

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
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Log In
            </a>
            <a
              href="/register-account"
              className="text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Create New Account
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
