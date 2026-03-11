// src/app/(auth)/sign-in/components/SignInForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/context/ToastContext';

// ── Zod Schema ───────────────────────────────────────────────────────
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

type SignInInput = z.infer<typeof signInSchema>;

// ── Component ────────────────────────────────────────────────────────
export default function SignInForm(): React.ReactNode {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<SignInInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof SignInInput, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof SignInInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validate with Zod ──
    const result = signInSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignInInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignInInput;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    // ── Sign in via BetterAuth ──
    setSubmitting(true);
    setErrors({});

    try {
      const { error: authError } = await authClient.signIn.email({
        email: result.data.email,
        password: result.data.password,
      });

      if (authError) {
        setSubmitting(false);
        showError('Sign-in failed', authError.message ?? 'Invalid email or password.');
        return;
      }

      success('Welcome back!', 'You have signed in successfully.');
      router.push('/dashboard');
    } catch {
      setSubmitting(false);
      showError('Sign-in failed', 'An unexpected error occurred. Please try again.');
    }
  };

  return (
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
            value={formData.email}
            onChange={handleChange('email')}
            autoComplete="email"
            className={`w-full px-3 py-2.5 border rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
              errors.email ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type={showPw ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange('password')}
            autoComplete="current-password"
            className={`w-full px-3 py-2.5 border rounded-md text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
              errors.password ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
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
  );
}
