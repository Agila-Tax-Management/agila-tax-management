'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]                 = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState('');
  const [done, setDone]                     = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    // Frontend-only: simulate password reset
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 800);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-4xl flex items-center gap-12">

        {/* Left — Illustration */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <Image
            src="/images/register.webp"
            alt="Reset password illustration"
            width={420}
            height={420}
            priority
          />
        </div>

        {/* Right — Form */}
        <div className="flex-1 max-w-sm w-full">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Reset Password</h1>
          <p className="text-sm text-slate-500 mb-6">
            Enter your new password below.
          </p>

          {done ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3">
                <p className="text-sm text-green-700 font-medium">Password reset successfully!</p>
                <p className="text-xs text-green-600 mt-1">
                  You can now log in with your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/sign-in')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm transition-colors shadow-sm"
              >
                Go to Log In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Show password */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPw}
                  onChange={e => setShowPw(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">Show Password</span>
              </label>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-md text-sm transition-colors shadow-sm"
              >
                {submitting ? 'Resetting…' : 'Reset Password'}
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
              href="/sign-in"
              className="text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Log In
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
