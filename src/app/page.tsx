'use client';

import Image from 'next/image';
import Link from 'next/link';

const VALUES = [
  {
    letter: 'A',
    title: 'Aspiration',
    desc: 'We ensure our services and solutions are easy to use and available to all micro business owners, breaking down barriers to success.',
  },
  {
    letter: 'T',
    title: 'Trustworthiness',
    desc: 'We build lasting relationships through honesty, transparency, and reliability in everything we do.',
  },
  {
    letter: 'M',
    title: 'Mentorship',
    desc: 'We commit to guiding and advising micro business owners and their teams to help them grow confidently.',
  },
  {
    letter: 'S',
    title: 'Support',
    desc: 'We are dedicated to providing ongoing assistance and resources, fostering a community where every micro business can thrive.',
  },
];

const SERVICES = [
  { icon: '🏢', label: 'Business Registration' },
  { icon: '📋', label: 'Tax Filing & Compliance' },
  { icon: '📒', label: 'Bookkeeping Services' },
  { icon: '💼', label: 'Financial Consulting' },
  { icon: '📈', label: 'Business Advisory' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/agila_logo.webp"
              alt="Agila Tax Management Services"
              width={36}
              height={36}
              className="rounded-sm"
            />
            <span className="font-bold text-slate-800 text-base leading-tight">
              Agila Tax Management<br />
              <span className="text-xs font-normal text-slate-500 tracking-wide">Services</span>
            </span>
          </Link>

          <Link
            href="/login"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="flex-1 flex items-center bg-linear-to-br from-blue-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12">

          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
              Trusted by 100+ Businesses
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
              Streamline Your<br />
              <span className="text-blue-600">Business Operations</span>
            </h1>

            <p className="text-slate-600 text-base md:text-lg max-w-lg mb-8">
              Professional tax management and business solutions designed specifically for
              micro business owners. Focus on growing your business while we handle
              the compliance.
            </p>

            <div className="flex flex-col sm:flex-row items-center md:items-start gap-3">
              <Link
                href="/login"
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm transition-colors shadow-md"
              >
                One Portal →
              </Link>
              <a
                href="mailto:info@agilacebu.com"
                className="px-7 py-3 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-md text-sm transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex-1 flex items-center justify-center">
            <Image
              src="/images/register.webp"
              alt="Business management illustration"
              width={440}
              height={360}
              className="w-full max-w-md drop-shadow-xl rounded-xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Why Choose Agila ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Our Values</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Why Choose Agila?</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              We provide innovative solutions that make business management effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ letter, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-xl border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center mb-4">
                  {letter}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────── */}
      <section className="py-20 bg-linear-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Our Services</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {SERVICES.map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-5 py-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to simplify your compliance?
          </h2>
          <p className="text-blue-100 mb-8 text-sm md:text-base">
            Log in to One Portal and manage your business from a single, secure dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-3.5 bg-white text-blue-600 font-bold rounded-md text-sm hover:bg-blue-50 transition-colors shadow-md"
          >
            Access One Portal
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/agila_logo.webp"
                alt="ATMS Logo"
                width={32}
                height={32}
                className="rounded-sm"
              />
              <span className="text-white font-bold text-sm">Agila Tax Management Services</span>
            </div>
            <p className="text-sm leading-relaxed">
              We offer innovative solutions in business registration, bookkeeping, and tax
              filing, removing the stress of compliance so entrepreneurs can focus on growing
              their businesses.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Our Services</h4>
            <ul className="space-y-2 text-sm">
              {SERVICES.map(({ label }) => (
                <li key={label} className="hover:text-white transition">{label}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Contact Information</h4>
            <ul className="space-y-2 text-sm">
              <li>📍 Lahug, Cebu City, Philippines</li>
              <li>
                <a href="mailto:info@agilacebu.com" className="hover:text-white transition">
                  ✉️ info@agilacebu.com
                </a>
              </li>
              <li>
                <a href="tel:+639622485706" className="hover:text-white transition">
                  📞 +63 962-248-5706
                </a>
              </li>
            </ul>
            <a
              href="https://www.facebook.com/profile.php?id=61565479076573"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm hover:text-white transition"
            >
              Facebook →
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
          © 2025 Copyright: Agila Tax Management Services | All Rights Reserved
        </div>
      </footer>

    </div>
  );
}
