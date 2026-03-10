'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RegisterAccountPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyCode: '',
    branch: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    // Frontend-only: redirect to login after "creating" account
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-4xl flex items-center gap-12">

        {/* Left — Illustration */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <Image
            src="/images/register.webp"
            alt="Register illustration"
            width={420}
            height={420}
            priority
          />
        </div>

        {/* Right — Form */}
        <div className="flex-1 max-w-sm w-full">
          <h1 className="text-2xl font-semibold text-slate-800 mb-6">Create New Account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  required
                  autoComplete="given-name"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  required
                  autoComplete="family-name"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Company Code & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.companyCode}
                  onChange={e => update('companyCode', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.branch}
                  onChange={e => update('branch', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
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
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
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
              {submitting ? 'Creating Account…' : 'Create Account'}
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
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Already have an account? Log In
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
